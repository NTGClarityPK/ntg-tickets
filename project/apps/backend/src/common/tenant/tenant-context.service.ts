import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped service to hold the current tenant context.
 * This is set by the TenantMiddleware after extracting tenantId from the JWT.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId: string | null = null;

  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  requireTenantId(): string {
    if (!this.tenantId) {
      throw new Error('Tenant context not set. Ensure TenantMiddleware is applied.');
    }
    return this.tenantId;
  }
}

