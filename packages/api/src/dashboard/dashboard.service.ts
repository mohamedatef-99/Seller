import { Injectable } from '@nestjs/common';
import { CodStatus, OrderStatus, Prisma } from '@prisma/client';
import type {
  DashboardResponse,
  DashboardSummary,
  OrderDto,
} from '@cod/shared';
import { PrismaService } from '../prisma/prisma.service';
import { mapOrderToDto, toNum } from '../orders/order.mapper';

// Orders that are "out for delivery".
const OUT_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.IN_TRANSIT,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(sellerId: string): Promise<DashboardResponse> {
    const [summary, orders] = await Promise.all([
      this.buildSummary(sellerId),
      this.listOrders(sellerId),
    ]);
    return { summary, orders };
  }

  private async buildSummary(sellerId: string): Promise<DashboardSummary> {
    const ledgerWhere = (
      extra: Prisma.CodLedgerWhereInput = {},
    ): Prisma.CodLedgerWhereInput => ({
      order: { sellerId },
      ...extra,
    });

    const [
      ordersOut,
      delivered,
      collectedAgg, // COLLECTED + SETTLED → cash that left the customer's hands
      stillOwedAgg, // COLLECTED only → courier is holding your cash
      settledAgg, // SETTLED → already paid to you
      inTransitAgg, // expected on orders still out
    ] = await Promise.all([
      this.prisma.order.count({
        where: { sellerId, status: { in: OUT_STATUSES } },
      }),
      this.prisma.order.count({
        where: { sellerId, status: OrderStatus.DELIVERED },
      }),
      this.prisma.codLedger.aggregate({
        _sum: { collectedAmount: true },
        where: ledgerWhere({
          status: { in: [CodStatus.COLLECTED, CodStatus.SETTLED] },
        }),
      }),
      this.prisma.codLedger.aggregate({
        _sum: { collectedAmount: true },
        where: ledgerWhere({ status: CodStatus.COLLECTED }),
      }),
      this.prisma.codLedger.aggregate({
        _sum: { settledAmount: true },
        where: ledgerWhere({ status: CodStatus.SETTLED }),
      }),
      this.prisma.codLedger.aggregate({
        _sum: { expectedAmount: true },
        where: ledgerWhere({ order: { sellerId, status: { in: OUT_STATUSES } } }),
      }),
    ]);

    return {
      ordersOut,
      delivered,
      codCollected: toNum(collectedAgg._sum.collectedAmount),
      codStillOwed: toNum(stillOwedAgg._sum.collectedAmount),
      codSettled: toNum(settledAgg._sum.settledAmount),
      codInTransit: toNum(inTransitAgg._sum.expectedAmount),
    };
  }

  private async listOrders(sellerId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, codLedger: true },
    });

    return orders.map(mapOrderToDto);
  }
}
