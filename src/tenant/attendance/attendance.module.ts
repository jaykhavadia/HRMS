import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../master/organization/schemas/organization.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { DatabaseModule } from '../../core/database/database.module';
import { FileUploadModule } from '../../shared/file-upload/file-upload.module';
import { ConfigModule } from '../../config/config.module';
import { ShiftModule } from '../shift/shift.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    FileUploadModule,
    ConfigModule,
    ShiftModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
