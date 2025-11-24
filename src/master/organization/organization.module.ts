import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { TempCleanupService } from './temp-cleanup.service';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import {
  TempRegistration,
  TempRegistrationSchema,
} from './schemas/temp-registration.schema';
import { User, UserSchema } from '../../tenant/user/schemas/user.schema';
import { DatabaseModule } from '../../core/database/database.module';
import { EmailModule } from '../../shared/email/email.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: TempRegistration.name, schema: TempRegistrationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EmailModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, TempCleanupService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
