import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  CourierAdapter,
  CourierCredentials,
  CourierStatus,
  ShipmentRequest,
  ShipmentResult,
} from './courier-adapter';

export const BOSTA_BASE_URLS = {
  staging: 'https://stg-app.bosta.co',
  production: 'https://app.bosta.co',
} as const;

interface BostaCity {
  _id: string; // Bosta city code, e.g. "EG-01" — this is what dropOffAddress.city wants
  name: string; // e.g. "Cairo"
}

// Aliases for governorate names that Bosta may spell differently. Keys/values
// are normalized-compared, so only meaningfully different spellings need listing.
const GOVERNORATE_ALIASES: Record<string, string[]> = {
  Qalyubia: ['qaliobia', 'qalyobia', 'kalyoubia'],
  Monufia: ['menofia', 'menoufia'],
  Beheira: ['behira', 'elbeheira'],
  Sharqia: ['sharkia', 'elsharkia'],
  Dakahlia: ['dakahleya', 'eldakahlia'],
  Gharbia: ['elgharbia'],
  Faiyum: ['fayoum', 'elfayoum'],
  'Beni Suef': ['banisuef', 'benisuef'],
  Asyut: ['assiut', 'asyout'],
  Qena: ['qina'],
  Matrouh: ['marsamatrouh', 'matrouh'],
  'Kafr El Sheikh': ['kafrelsheikh', 'kafrelshaikh'],
};

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(el|al)\b/g, '') // drop arabic articles
    .replace(/[^a-z0-9]/g, ''); // strip spaces/punctuation
}

// Bosta delivery state (state.value) -> our OrderStatus.
// Source: bostaapp/bosta-nodejs deliveryStates. null = leave order unchanged.
function mapBostaState(state: string): OrderStatus | null {
  switch (state) {
    case 'Delivered':
    case 'Delivery confirmed':
      return OrderStatus.DELIVERED;
    case 'Returned to business':
      return OrderStatus.RETURNED;
    case 'Canceled':
    case 'Terminated':
      return OrderStatus.CANCELLED;
    case 'Delivering':
    case 'Arrived at customer':
    case 'In transit between Hubs':
    case 'Received at warehouse':
    case 'Picked up':
    case 'Picked up from business':
      return OrderStatus.IN_TRANSIT;
    case 'Pickup requested':
    case 'Waiting for route':
    case 'Route Assigned':
    case 'Waiting for Pickup':
    case 'Picking up':
    case 'Picking up from warehouse':
    case 'Arrived at business':
      return OrderStatus.PENDING;
    default:
      return null; // Exception / Lost / Damaged / Investigation — don't guess
  }
}

// Real Bosta integration. Endpoints/auth confirmed from the official Node SDK:
//   POST   /api/v0/deliveries            (Authorization: <apiKey>)
//   GET    /api/v0/deliveries/{tracking}
@Injectable()
export class BostaAdapter implements CourierAdapter {
  readonly name = 'bosta';
  private readonly logger = new Logger(BostaAdapter.name);

  // Cities are global + rarely change — cache per base URL.
  private citiesCache = new Map<string, { at: number; cities: BostaCity[] }>();
  private static readonly CITIES_TTL_MS = 12 * 60 * 60 * 1000;

  async createShipment(
    creds: CourierCredentials,
    req: ShipmentRequest,
  ): Promise<ShipmentResult> {
    const { firstName, lastName } = splitName(req.customerName);
    const cityCode = await this.resolveCityCode(creds, req.governorate);

    const body = {
      type: 10, // Package Delivery (forward, COD)
      specs: {
        size: 'SMALL',
        packageDetails: {
          itemsCount: req.itemsCount,
          description: req.description ?? 'Order',
        },
      },
      cod: req.codAmount,
      dropOffAddress: {
        city: cityCode, // Bosta city code (e.g. "EG-01")
        firstLine: req.addressLine,
      },
      businessReference: req.orderId,
      receiver: {
        firstName,
        lastName,
        phone: req.customerPhone,
      },
      notes: `Order ${req.orderId}`,
    };

    const json = await this.call(creds, 'POST', '/api/v0/deliveries', body);
    const data = json?.data ?? json?.message ?? json;
    const trackingNumber = data?.trackingNumber;
    if (!trackingNumber) {
      this.logger.error(
        `Bosta createDelivery returned no trackingNumber: ${JSON.stringify(json)?.slice(0, 300)}`,
      );
      throw new Error('Bosta did not return a tracking number');
    }
    return { trackingNumber, courierName: this.name };
  }

  async getStatus(
    creds: CourierCredentials,
    trackingNumber: string,
  ): Promise<CourierStatus> {
    const json = await this.call(
      creds,
      'GET',
      `/api/v0/deliveries/${encodeURIComponent(trackingNumber)}`,
    );
    const data = json?.data ?? json?.message ?? json;
    const rawState: string | undefined = data?.state?.value ?? data?.state;
    return {
      trackingNumber,
      status: rawState ? mapBostaState(rawState) : null,
      rawState,
    };
  }

  async verifyCredentials(creds: CourierCredentials): Promise<boolean> {
    try {
      // Cheap authenticated read — cities require a valid key (also warms cache).
      const cities = await this.getCities(creds);
      return cities.length > 0;
    } catch {
      return false;
    }
  }

  // Resolve a governorate name to a Bosta city code (dropOffAddress.city).
  private async resolveCityCode(
    creds: CourierCredentials,
    governorate: string,
  ): Promise<string> {
    const cities = await this.getCities(creds);
    const target = normalizeName(governorate);

    // 1. exact (normalized) name match
    let match = cities.find((c) => normalizeName(c.name) === target);

    // 2. alias table
    if (!match) {
      const aliases = GOVERNORATE_ALIASES[governorate]?.map(normalizeName) ?? [];
      match = cities.find((c) => aliases.includes(normalizeName(c.name)));
    }

    // 3. loose contains either direction (e.g. "Marsa Matrouh" vs "Matrouh")
    if (!match) {
      match = cities.find((c) => {
        const n = normalizeName(c.name);
        return n.includes(target) || target.includes(n);
      });
    }

    if (!match) {
      throw new Error(
        `Couldn't map governorate "${governorate}" to a Bosta city. ` +
          `Available cities: ${cities.length}. Check the spelling or add an alias.`,
      );
    }
    return match._id;
  }

  private async getCities(creds: CourierCredentials): Promise<BostaCity[]> {
    const cached = this.citiesCache.get(creds.baseUrl);
    if (cached && Date.now() - cached.at < BostaAdapter.CITIES_TTL_MS) {
      return cached.cities;
    }
    const json = await this.call(creds, 'GET', '/api/v0/cities');
    const list: BostaCity[] = (json?.data ?? json?.message ?? json ?? []).map(
      (c: any) => ({ _id: c._id ?? c.code, name: c.name }),
    );
    this.citiesCache.set(creds.baseUrl, { at: Date.now(), cities: list });
    return list;
  }

  private async call(
    creds: CourierCredentials,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<any> {
    const res = await fetch(`${creds.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: creds.apiKey,
        'Content-Type': 'application/json',
        'X-Requested-By': 'cod-tracker',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    const text = await res.text();
    const json = text ? safeJson(text) : null;
    if (!res.ok) {
      const msg = json?.message ?? `Bosta API ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : `Bosta API ${res.status}`);
    }
    return json;
  }
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  const firstName = parts.shift() ?? full;
  const lastName = parts.join(' ') || '-'; // Bosta requires a last name
  return { firstName, lastName };
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
