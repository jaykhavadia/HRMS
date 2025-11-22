import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles/roles.guard';
import { Roles } from '../../common/decorators/roles/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant/tenant.guard';
import { Tenant } from '../../common/decorators/tenant/tenant.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Tenant() tenant: any) {
    return this.dashboardService.getDashboardStats(
      tenant.clientId,
      tenant.clientName,
    );
  }
}
