import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../../database/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenantContext: TenantContextService,
    private prisma: PrismaService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract user from request (set by JWT auth guard)
      const user = (req as any).user as JwtPayload | undefined;

      if (user?.tenantId) {
        // If tenantId is in JWT, use it directly
        this.tenantContext.setTenantId(user.tenantId);
      } else if (user?.sub || user?.email) {
        // Fallback: Look up user's tenantId from database
        const dbUser = await this.prisma.user.findFirst({
          where: user.sub ? { id: user.sub } : { email: user.email },
          select: { tenantId: true },
        });

        if (dbUser?.tenantId) {
          this.tenantContext.setTenantId(dbUser.tenantId);
        }
      }
    } catch (error) {
      // Don't block request if tenant lookup fails
      console.warn('TenantMiddleware: Failed to set tenant context', error);
    }

    next();
  }
}

