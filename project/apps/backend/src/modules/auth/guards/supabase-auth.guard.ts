import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

      // Fetch user from database to get roles
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          roles: true,
          isActive: true,
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

      // Determine activeRole: use first role, or END_USER as fallback
      // Note: activeRole is not stored in the database, it's determined from roles array
      // In a multi-role scenario, the frontend should send the activeRole in a header or token
      // For now, we'll use the first role as the activeRole
      const activeRole = dbUser.roles[0] || 'END_USER';

      // Attach user to request with role information
      request.user = {
        id: dbUser.id,
        email: dbUser.email,
        roles: dbUser.roles,
        activeRole: activeRole,
        supabaseUser: user,
      };

      this.logger.debug(`Token verified successfully for user: ${user.email} with role: ${activeRole}`);
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

