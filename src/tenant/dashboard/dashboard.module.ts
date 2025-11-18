import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DatabaseModule } from '../../core/database/database.module';
import { UserModule } from '../user/user.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
  imports: [DatabaseModule, UserModule, AttendanceModule, TenantModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
