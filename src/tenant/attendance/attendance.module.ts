import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { DatabaseModule } from '../../core/database/database.module';
import { FileUploadModule } from '../../shared/file-upload/file-upload.module';
import { ConfigModule } from '../../config/config.module';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
  imports: [DatabaseModule, FileUploadModule, ConfigModule, TenantModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
