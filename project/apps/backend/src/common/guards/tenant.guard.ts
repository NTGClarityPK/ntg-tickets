import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user or no tenantId, deny access
    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Check if request body or params contain a different tenantId
    const bodyTenantId = request.body?.tenantId;
    const paramTenantId = request.params?.tenantId;

    // Prevent cross-tenant access
    if (bodyTenantId && bodyTenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    if (paramTenantId && paramTenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return true;
  }
}

