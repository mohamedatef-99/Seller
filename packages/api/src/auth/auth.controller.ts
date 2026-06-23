import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { AuthResponse, SellerDto } from '@cod/shared';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentSeller, CurrentSellerData } from './current-seller.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto): Promise<AuthResponse> {
    return this.auth.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentSeller() seller: CurrentSellerData): Promise<SellerDto> {
    return this.auth.getProfile(seller.id);
  }
}
