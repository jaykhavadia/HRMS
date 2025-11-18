import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { TenantModule } from './core/tenant/tenant.module';
import { DatabaseModule } from './core/database/database.module';
import { OrganizationModule } from './master/organization/organization.module';
import { SubscriptionModule } from './master/subscription/subscription.module';
import { EmailModule } from './shared/email/email.module';
import { FileUploadModule } from './shared/file-upload/file-upload.module';
import { AuthModule } from './tenant/auth/auth.module';
import { UserModule } from './tenant/user/user.module';
import { AttendanceModule } from './tenant/attendance/attendance.module';
import { DashboardModule } from './tenant/dashboard/dashboard.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule,
    TenantModule,
    DatabaseModule,
    OrganizationModule,
    SubscriptionModule,
    EmailModule,
    FileUploadModule,
    AuthModule,
    UserModule,
    AttendanceModule,
    DashboardModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
