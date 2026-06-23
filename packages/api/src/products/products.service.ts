import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ProductDto } from '@cod/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Order form only offers active products; the catalog screen shows all.
  async list(sellerId: string, activeOnly = false): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: { sellerId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return products.map(toDto);
  }

  async create(sellerId: string, dto: CreateProductDto): Promise<ProductDto> {
    const product = await this.prisma.product.create({
      data: {
        sellerId,
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        sku: dto.sku,
      },
    });
    return toDto(product);
  }

  async update(
    sellerId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductDto> {
    // Scope by sellerId so one seller can't touch another's product.
    const existing = await this.prisma.product.findFirst({
      where: { id, sellerId },
    });
    if (!existing) throw new NotFoundException('Product not found');

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.price !== undefined
          ? { price: new Prisma.Decimal(dto.price) }
          : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    return toDto(product);
  }
}

function toDto(p: {
  id: string;
  name: string;
  price: Prisma.Decimal;
  sku: string | null;
  isActive: boolean;
}): ProductDto {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    sku: p.sku,
    isActive: p.isActive,
  };
}
