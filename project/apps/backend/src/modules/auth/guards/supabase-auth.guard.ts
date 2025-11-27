import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { PrismaService } from '../../../database/prisma.service';
import { TenantContextService } from '../../../common/tenant/tenant-context.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token with Supabase
      // Use the regular client - it will verify JWT signature via Supabase API
      const supabase = this.supabaseService.getClient();
      
      // Validate token format (basic check - should be a JWT with 3 parts)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        this.logger.warn('Invalid token format - not a valid JWT');
        throw new UnauthorizedException('Invalid token format');
      }
      
      // Log token for debugging (first 20 chars only for security)
      this.logger.debug(`Verifying token: ${token.substring(0, 20)}...`);
      
      // Get user by passing the token directly
      // The Supabase client will verify the JWT signature automatically via Supabase API
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        this.logger.warn('Supabase token verification error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        throw new UnauthorizedException(`Invalid token: ${error.message}`);
      }

      if (!user) {
        this.logger.warn('No user found for token');
        throw new UnauthorizedException('Invalid token: user not found');
      }

      // Fetch user from database to get roles and tenantId
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          roles: true,
          isActive: true,
          tenantId: true,
        },
      });

      if (!dbUser) {
        this.logger.warn(`User ${user.id} not found in database`);
        throw new UnauthorizedException('User not found in database');
      }

      if (!dbUser.isActive) {
        this.logger.warn(`User ${user.id} is inactive`);
        throw new UnauthorizedException('User account is inactive');
      }

      // Determine activeRole: prefer metadata, fallback to first role
      // The activeRole is stored in Supabase user metadata when switching roles
      const metadataActiveRole = user.user_metadata?.activeRole as string | undefined;
      const activeRole = metadataActiveRole && dbUser.roles.includes(metadataActiveRole as any)
        ? metadataActiveRole
        : dbUser.roles[0] || 'END_USER';

      // Attach user to request with role information and tenantId
      request.user = {
        id: dbUser.id,
        email: dbUser.email,
        roles: dbUser.roles,
        activeRole: activeRole,
        tenantId: dbUser.tenantId,
        supabaseUser: user,
      };

      // Set tenant context for the request
      this.tenantContext.setTenantId(dbUser.tenantId);

      this.logger.debug(`Token verified successfully for user: ${user.email} with role: ${activeRole} in tenant: ${dbUser.tenantId}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error verifying Supabase token:', {
        error: error.message,
        stack: error.stack,
      });
      throw new UnauthorizedException('Token verification failed');
    }
  }
}

