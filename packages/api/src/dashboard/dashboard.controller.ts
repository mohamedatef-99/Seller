import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DashboardResponse } from '@cod/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentSeller,
  CurrentSellerData,
} from '../auth/current-seller.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@CurrentSeller() seller: CurrentSellerData): Promise<DashboardResponse> {
    return this.dashboard.getDashboard(seller.id);
  }
}
