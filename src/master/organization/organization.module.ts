import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import { DatabaseModule } from '../../core/database/database.module';
import { EmailModule } from '../../shared/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    DatabaseModule,
    EmailModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
