import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantService: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Try to get tenant identifier from header first, then subdomain
    let tenantIdentifier =
      request.headers['x-tenant-id'] || request.headers['x-tenant-domain'];

    if (!tenantIdentifier) {
      // Extract from subdomain
      const host = request.headers.host || '';
      const parts = host.split('.');
      if (parts.length > 2) {
        tenantIdentifier = parts[0];
      }
    }

    if (!tenantIdentifier) {
      throw new BadRequestException('Tenant identifier is required');
    }

    // Resolve tenant and attach to request
    const organization = await this.tenantService.resolveTenant(
      tenantIdentifier as string,
    );
    request.tenant = organization;
    request.tenantId = organization.clientId;
    request.tenantName = organization.clientName;

    return true;
  }
}
