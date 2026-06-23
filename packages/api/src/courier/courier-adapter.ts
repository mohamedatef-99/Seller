import { OrderStatus } from '@prisma/client';

// The thin seam between our app and any courier. Per-seller credentials are
// passed in (multi-tenant), so a single adapter instance serves all sellers.
// Adding Mylerz/R2S later = another class implementing this interface.

export interface CourierCredentials {
  apiKey: string;
  baseUrl: string; // resolved from the seller's env (staging/production)
}

export interface ShipmentRequest {
  orderId: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  governorate: string;
  codAmount: number; // EGP to collect on delivery
  itemsCount: number;
  description?: string;
}

export interface ShipmentResult {
  trackingNumber: string;
  courierName: string;
}

export interface CourierStatus {
  trackingNumber: string;
  // null = courier returned a state we don't map; leave the order unchanged.
  status: OrderStatus | null;
  rawState?: string;
}

export interface CourierAdapter {
  readonly name: string;
  createShipment(
    creds: CourierCredentials,
    req: ShipmentRequest,
  ): Promise<ShipmentResult>;
  getStatus(
    creds: CourierCredentials,
    trackingNumber: string,
  ): Promise<CourierStatus>;
  // Used to validate a newly-entered API key before saving it.
  verifyCredentials(creds: CourierCredentials): Promise<boolean>;
}
