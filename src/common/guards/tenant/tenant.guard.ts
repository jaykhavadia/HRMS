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
    const request = context.switchToHttp().getRequest();

    let tenantDomain: string;

    // Priority 1: Get tenant from authenticated user (JWT token)
    if (request.user && request.user.email) {
      tenantDomain = extractTenantDomainFromEmail(request.user.email);
    }
    // Priority 2: Get tenant from password setup token (for setup-password endpoint)
    else if (
      request.body &&
      request.body.token &&
      request.url?.includes('setup-password')
    ) {
      const decoded = decodeTokenWithTenant(request.body.token);
      if (!decoded) {
        throw new BadRequestException('Invalid token format');
      }
      tenantDomain = decoded.tenantDomain;
      // Store decoded token in request for later use
      request.decodedToken = decoded.token;
    }
    // Priority 3: Get tenant from request body email (for login)
    else if (request.body && request.body.email) {
      tenantDomain = extractTenantDomainFromEmail(request.body.email);
    }
    // Priority 4: Get tenant from query parameter email
    else if (request.query && request.query.email) {
      tenantDomain = extractTenantDomainFromEmail(request.query.email);
    }
    else {
      throw new BadRequestException(
        'Unable to determine tenant. Email address or valid token is required.',
      );
    }

    // Resolve tenant and attach to request
    const organization = await this.tenantService.resolveTenant(tenantDomain);
    request.tenant = organization;
    request.tenantId = organization.clientId;
    request.tenantName = organization.clientName;
    request.tenantDomain = tenantDomain;

    return true;
  }
}
