import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { OrderDto, SyncResult } from '@cod/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentSeller,
  CurrentSellerData,
} from '../auth/current-seller.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @CurrentSeller() seller: CurrentSellerData,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderDto> {
    return this.orders.create(seller.id, dto);
  }

  @Post(':id/push')
  push(
    @CurrentSeller() seller: CurrentSellerData,
    @Param('id') id: string,
  ): Promise<OrderDto> {
    return this.orders.pushToCourier(seller.id, id);
  }

  // Pull latest status from the courier for all active orders.
  @Post('sync')
  sync(@CurrentSeller() seller: CurrentSellerData): Promise<SyncResult> {
    return this.orders.syncActive(seller.id);
  }
}
