import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { AuthResponse, SellerDto } from '@cod/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import {
  SELLER_DTO_SELECT,
  SellerRow,
  toSellerDto,
} from '../sellers/seller.mapper';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existing = await this.prisma.seller.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const seller = await this.prisma.seller.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        businessName: dto.businessName,
        phone: dto.phone,
      },
    });

    return this.buildAuthResponse(seller);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const seller = await this.prisma.seller.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!seller) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(seller.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(seller);
  }

  async getProfile(sellerId: string): Promise<SellerDto> {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: SELLER_DTO_SELECT,
    });
    if (!seller) throw new UnauthorizedException();
    return toSellerDto(seller);
  }

  private buildAuthResponse(seller: SellerRow): AuthResponse {
    const accessToken = this.jwt.sign({ sub: seller.id, email: seller.email });
    return { accessToken, seller: toSellerDto(seller) };
  }
}
