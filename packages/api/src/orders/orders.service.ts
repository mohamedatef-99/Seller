import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CodStatus, OrderStatus, Prisma } from '@prisma/client';
import type { OrderDto, SyncResult } from '@cod/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { mapOrderToDto } from './order.mapper';
import { CourierService } from '../courier/courier.service';

// Active = out for delivery, so worth polling Bosta for a status change.
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.IN_TRANSIT,
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courier: CourierService,
  ) {}

  async create(sellerId: string, dto: CreateOrderDto): Promise<OrderDto> {
    // 1. Load the seller's products referenced in the order (ownership check).
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, sellerId },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'One or more products were not found for this seller',
      );
    }
    const priceById = new Map(products.map((p) => [p.id, p]));

    // 2. Snapshot name + price per line, compute COD total.
    const shippingFee = new Prisma.Decimal(dto.shippingFee ?? 0);
    let itemsTotal = new Prisma.Decimal(0);

    const itemsData = dto.items.map((line) => {
      const product = priceById.get(line.productId);
      if (!product) {
        throw new BadRequestException(`Unknown product ${line.productId}`);
      }
      const lineTotal = product.price.mul(line.quantity);
      itemsTotal = itemsTotal.add(lineTotal);
      return {
        productId: product.id,
        productName: product.name, // snapshot
        unitPrice: product.price, // snapshot
        quantity: line.quantity,
      };
    });

    const codAmount = itemsTotal.add(shippingFee);

    // 3. Create order + items + ledger atomically. Status starts NEW (not yet
    //    pushed to a courier); ledger starts PENDING (no cash collected).
    const order = await this.prisma.order.create({
      data: {
        sellerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        addressLine: dto.addressLine,
        governorate: dto.governorate,
        status: OrderStatus.NEW,
        codAmount,
        shippingFee,
        items: { create: itemsData },
        codLedger: {
          create: {
            expectedAmount: codAmount,
            collectedAmount: new Prisma.Decimal(0),
            settledAmount: new Prisma.Decimal(0),
            status: CodStatus.PENDING,
          },
        },
      },
      include: { items: true, codLedger: true },
    });

    return mapOrderToDto(order);
  }

  // One-tap: hand a NEW order to the courier, store the returned tracking
  // number, and move it to PENDING (awaiting pickup).
  async pushToCourier(sellerId: string, orderId: string): Promise<OrderDto> {
    const seller = await this.getSellerCourierConfig(sellerId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, sellerId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Order has already been sent to a courier');
    }

    const itemsCount = order.items.reduce((s, it) => s + it.quantity, 0);
    const description = order.items.map((it) => it.productName).join(', ');

    const result = await this.courier.createShipment(seller, {
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      addressLine: order.addressLine,
      governorate: order.governorate,
      codAmount: Number(order.codAmount),
      itemsCount,
      description,
    });

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PENDING,
        trackingNumber: result.trackingNumber,
        courierName: result.courierName,
      },
      include: { items: true, codLedger: true },
    });

    return mapOrderToDto(updated);
  }

  // Pull status from Bosta for every active (out-for-delivery) order with a
  // tracking number, and apply any change — including advancing the COD ledger
  // when an order is delivered.
  async syncActive(sellerId: string): Promise<SyncResult> {
    const seller = await this.getSellerCourierConfig(sellerId);

    const orders = await this.prisma.order.findMany({
      where: {
        sellerId,
        status: { in: ACTIVE_STATUSES },
        trackingNumber: { not: null },
      },
    });

    let updated = 0;
    for (const order of orders) {
      const changed = await this.syncOne(
        seller,
        order.id,
        order.trackingNumber as string,
        order.status,
      );
      if (changed) updated++;
    }
    return { synced: orders.length, updated };
  }

  private async syncOne(
    seller: { bostaApiKeyEnc: string | null; bostaEnv: string },
    orderId: string,
    trackingNumber: string,
    currentStatus: OrderStatus,
  ): Promise<boolean> {
    let result;
    try {
      result = await this.courier.getStatus(seller, trackingNumber);
    } catch {
      return false; // one courier hiccup shouldn't fail the whole sync
    }
    const next = result.status;
    if (!next || next === currentStatus) return false;

    await this.applyStatusTransition(orderId, next);
    return true;
  }

  // Apply a new order status and keep the COD ledger consistent.
  private async applyStatusTransition(
    orderId: string,
    next: OrderStatus,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: next } });

      if (next === OrderStatus.DELIVERED) {
        // Courier collected the COD on delivery (not yet settled to seller).
        const ledger = await tx.codLedger.findUnique({ where: { orderId } });
        if (ledger && ledger.status === CodStatus.PENDING) {
          await tx.codLedger.update({
            where: { orderId },
            data: {
              status: CodStatus.COLLECTED,
              collectedAmount: ledger.expectedAmount,
              collectedAt: new Date(),
            },
          });
        }
      }
      // RETURNED / CANCELLED: no cash changes hands — ledger stays PENDING.
    });
  }

  private async getSellerCourierConfig(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { bostaApiKeyEnc: true, bostaEnv: true },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }
}
