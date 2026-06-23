import { CodStatus, Prisma } from '@prisma/client';
import type { OrderDto } from '@cod/shared';

// Order with the relations the DTO needs.
export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; codLedger: true };
}>;

export function mapOrderToDto(o: OrderWithRelations): OrderDto {
  return {
    id: o.id,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    addressLine: o.addressLine,
    governorate: o.governorate,
    status: o.status,
    codAmount: toNum(o.codAmount),
    shippingFee: toNum(o.shippingFee),
    trackingNumber: o.trackingNumber,
    courierName: o.courierName,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      unitPrice: toNum(it.unitPrice),
      quantity: it.quantity,
    })),
    cod: {
      status: o.codLedger?.status ?? CodStatus.PENDING,
      expectedAmount: toNum(o.codLedger?.expectedAmount),
      collectedAmount: toNum(o.codLedger?.collectedAmount),
      settledAmount: toNum(o.codLedger?.settledAmount),
    },
  };
}

export function toNum(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}
