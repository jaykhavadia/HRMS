import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { TenantService } from '../../../core/tenant/tenant.service';
import { extractTenantDomainFromEmail } from '../../utils/email.util';
import { decodeTokenWithTenant } from '../../utils/token.util';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantService: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // NOTE: This guard is deprecated - multi-tenancy has been removed
    // This guard is no longer used in the new single-DB architecture
    // Keeping for backward compatibility but always returns true
    return true;
  }
}
