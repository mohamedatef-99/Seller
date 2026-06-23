import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import type { SellerDto } from '@cod/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentSeller,
  CurrentSellerData,
} from '../auth/current-seller.decorator';
import { SellersService } from './sellers.service';
import { ConnectBostaDto } from './dto/connect-bosta.dto';

@UseGuards(JwtAuthGuard)
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellers: SellersService) {}

  @Get('me')
  me(@CurrentSeller() seller: CurrentSellerData): Promise<SellerDto> {
    return this.sellers.findById(seller.id);
  }

  // Connect the seller's own Bosta account (key validated + encrypted at rest).
  @Post('me/bosta')
  connectBosta(
    @CurrentSeller() seller: CurrentSellerData,
    @Body() dto: ConnectBostaDto,
  ): Promise<SellerDto> {
    return this.sellers.connectBosta(seller.id, dto);
  }

  @Delete('me/bosta')
  disconnectBosta(
    @CurrentSeller() seller: CurrentSellerData,
  ): Promise<SellerDto> {
    return this.sellers.disconnectBosta(seller.id);
  }
}
