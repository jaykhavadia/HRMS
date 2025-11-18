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
   * Resolve tenant from subdomain or custom header
   */
  async resolveTenant(tenantIdentifier: string): Promise<Organization> {
    const organization = await this.organizationModel.findOne({
      $or: [
        { companyDomain: tenantIdentifier },
        { clientId: tenantIdentifier },
      ],
      isActive: true,
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }
}
