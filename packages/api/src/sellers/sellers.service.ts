import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SellerDto } from '@cod/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SELLER_DTO_SELECT, toSellerDto } from './seller.mapper';
import { CryptoService } from '../crypto/crypto.service';
import { CourierService } from '../courier/courier.service';
import { ConnectBostaDto } from './dto/connect-bosta.dto';

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly courier: CourierService,
  ) {}

  async findById(id: string): Promise<SellerDto> {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      select: SELLER_DTO_SELECT,
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return toSellerDto(seller);
  }

  // Validate the key against Bosta before storing it (encrypted).
  async connectBosta(id: string, dto: ConnectBostaDto): Promise<SellerDto> {
    const valid = await this.courier.verifyCredentials(dto.apiKey, dto.env);
    if (!valid) {
      throw new BadRequestException(
        'Bosta rejected this API key — check the key and the environment',
      );
    }

    const seller = await this.prisma.seller.update({
      where: { id },
      data: {
        bostaApiKeyEnc: this.crypto.encrypt(dto.apiKey),
        bostaEnv: dto.env,
        bostaConnectedAt: new Date(),
      },
      select: SELLER_DTO_SELECT,
    });
    return toSellerDto(seller);
  }

  async disconnectBosta(id: string): Promise<SellerDto> {
    const seller = await this.prisma.seller.update({
      where: { id },
      data: { bostaApiKeyEnc: null, bostaConnectedAt: null },
      select: SELLER_DTO_SELECT,
    });
    return toSellerDto(seller);
  }
}
