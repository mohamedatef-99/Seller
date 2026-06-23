import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  CourierAdapter,
  CourierCredentials,
  CourierStatus,
  ShipmentRequest,
  ShipmentResult,
} from './courier-adapter';

// Fallback used when a seller has NOT connected a real Bosta key, so the app
// still works end-to-end in dev. Mirrors the CourierAdapter shape.
@Injectable()
export class BostaStubAdapter implements CourierAdapter {
  readonly name = 'bosta';
  private readonly logger = new Logger(BostaStubAdapter.name);

  async createShipment(
    _creds: CourierCredentials,
    req: ShipmentRequest,
  ): Promise<ShipmentResult> {
    const trackingNumber = `BOSTA-STUB-${Date.now().toString().slice(-6)}`;
    this.logger.log(`[STUB] shipment for order ${req.orderId} -> ${trackingNumber}`);
    return { trackingNumber, courierName: this.name };
  }

  async getStatus(
    _creds: CourierCredentials,
    trackingNumber: string,
  ): Promise<CourierStatus> {
    // Stub never advances on its own.
    return { trackingNumber, status: OrderStatus.PENDING, rawState: 'stub' };
  }

  async verifyCredentials(_creds: CourierCredentials): Promise<boolean> {
    return true;
  }
}
