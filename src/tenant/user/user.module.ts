import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from '../../core/database/database.module';
import { EmailModule } from '../../shared/email/email.module';
import { FileUploadModule } from '../../shared/file-upload/file-upload.module';
import { ConfigModule } from '../../config/config.module';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    FileUploadModule,
    ConfigModule,
    TenantModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
