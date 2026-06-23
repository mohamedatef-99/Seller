import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type {
  CreateOrderDto as ICreateOrder,
  OrderItemInput as IOrderItem,
} from '@cod/shared';

export class OrderItemInputDto implements IOrderItem {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto implements ICreateOrder {
  @IsString()
  @MinLength(2)
  customerName: string;

  @IsString()
  @MinLength(6)
  customerPhone: string;

  @IsString()
  @MinLength(3)
  addressLine: string;

  @IsString()
  @MinLength(2)
  governorate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;
}
