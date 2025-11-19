import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization } from '../../master/organization/schemas/organization.schema';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
  ) {}

  /**
   * Resolve tenant from domain extracted from email
   * Example: acme-corp from john@acme-corp.com
   */
  async resolveTenant(tenantDomain: string): Promise<Organization> {
    const organization = await this.organizationModel.findOne({
      companyDomain: tenantDomain,
      isActive: true,
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with domain '${tenantDomain}' not found`,
      );
    }

    return organization;
  }
}
