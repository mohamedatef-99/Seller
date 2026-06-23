import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // seller id
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    });
  }

  // Return value is attached to request.user (see CurrentSeller decorator).
  async validate(payload: JwtPayload) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, businessName: true, phone: true },
    });
    if (!seller) throw new UnauthorizedException();
    return seller;
  }
}
