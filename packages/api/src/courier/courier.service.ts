import { Injectable } from '@nestjs/common';
import {
  CourierAdapter,
  CourierCredentials,
  CourierStatus,
  ShipmentRequest,
  ShipmentResult,
} from './courier-adapter';
import { BOSTA_BASE_URLS, BostaAdapter } from './bosta.adapter';
import { BostaStubAdapter } from './bosta-stub.adapter';
import { CryptoService } from '../crypto/crypto.service';

// Minimal shape we need off a Seller row.
export interface SellerCourierConfig {
  bostaApiKeyEnc: string | null;
  bostaEnv: string;
}

@Injectable()
export class CourierService {
  constructor(
    private readonly bosta: BostaAdapter,
    private readonly stub: BostaStubAdapter,
    private readonly crypto: CryptoService,
  ) {}

  isConnected(seller: SellerCourierConfig): boolean {
    return !!seller.bostaApiKeyEnc;
  }

  // Real adapter when the seller has connected a key; stub otherwise so the
  // app keeps working in dev.
  private resolve(seller: SellerCourierConfig): {
    adapter: CourierAdapter;
    creds: CourierCredentials;
  } {
    if (seller.bostaApiKeyEnc) {
      return {
        adapter: this.bosta,
        creds: {
          apiKey: this.crypto.decrypt(seller.bostaApiKeyEnc),
          baseUrl: this.baseUrl(seller.bostaEnv),
        },
      };
    }
    return { adapter: this.stub, creds: { apiKey: '', baseUrl: '' } };
  }

  baseUrl(env: string): string {
    return env === 'production'
      ? BOSTA_BASE_URLS.production
      : BOSTA_BASE_URLS.staging;
  }

  createShipment(
    seller: SellerCourierConfig,
    req: ShipmentRequest,
  ): Promise<ShipmentResult> {
    const { adapter, creds } = this.resolve(seller);
    return adapter.createShipment(creds, req);
  }

  getStatus(
    seller: SellerCourierConfig,
    trackingNumber: string,
  ): Promise<CourierStatus> {
    const { adapter, creds } = this.resolve(seller);
    return adapter.getStatus(creds, trackingNumber);
  }

  // Validate a raw key+env (used by the connect flow before we save it).
  verifyCredentials(apiKey: string, env: string): Promise<boolean> {
    return this.bosta.verifyCredentials({
      apiKey,
      baseUrl: this.baseUrl(env),
    });
  }
}
