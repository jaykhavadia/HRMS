import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';
import { DatabaseModule } from '../database/database.module';
import {
  Organization,
  OrganizationSchema,
} from '../../master/organization/schemas/organization.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
