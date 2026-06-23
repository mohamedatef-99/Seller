import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ProductDto } from '@cod/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentSeller,
  CurrentSellerData,
} from '../auth/current-seller.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // Default: active only (order form). ?includeInactive=true for the catalog.
  @Get()
  list(
    @CurrentSeller() seller: CurrentSellerData,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProductDto[]> {
    const activeOnly = includeInactive !== 'true';
    return this.products.list(seller.id, activeOnly);
  }

  @Post()
  create(
    @CurrentSeller() seller: CurrentSellerData,
    @Body() dto: CreateProductDto,
  ): Promise<ProductDto> {
    return this.products.create(seller.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentSeller() seller: CurrentSellerData,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.products.update(seller.id, id, dto);
  }
}
