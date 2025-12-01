import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private tenantContext: TenantContextService
  ) {}

  /**
   * Get the Supabase admin client for direct operations
   */
  getAdminClient() {
    return this.supabaseService.getAdminClient();
  }

  /**
   * Sign up a new user with Supabase Auth
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    roles: UserRole[] = [UserRole.END_USER]
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Create user in Supabase Auth
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (set to false in production)
      user_metadata: {
        name,
        roles: roles.map((r) => r.toString()),
      },
    });

    if (authError || !supabaseUser) {
      this.logger.error('Error creating Supabase user:', authError);
      throw new BadRequestException(
        authError?.message || 'Failed to create user'
      );
    }

    // Create user record in our database
    try {
      const tenantId = this.tenantContext.requireTenantId();
      const user = await this.prisma.user.create({
        data: {
          id: supabaseUser.id, // Use Supabase user ID
          tenantId,
          email: supabaseUser.email!,
          name,
          roles,
          isActive: true,
        },
      });

      return {
        user,
        supabaseUser,
      };
    } catch (error) {
      // If user creation fails, try to delete the Supabase user
      await supabase.auth.admin.deleteUser(supabaseUser.id);
      this.logger.error('Error creating user record:', error);
      throw new BadRequestException('Failed to create user record');
    }
  }

  /**
   * Sign in with Supabase Auth
   */
  async signIn(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    // Sign in with Supabase
    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !user || !session) {
      this.logger.warn('Sign in failed:', error?.message);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user from our database with tenant/organization
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: true,
        requestedTickets: {
          select: { id: true, status: true },
        },
        assignedTickets: {
          select: { id: true, status: true },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Log the login action
    try {
      await this.auditLogsService.createAuditLog({
        action: 'LOGIN',
        resource: 'user',
        resourceId: dbUser.id,
        metadata: {
          userRoles: dbUser.roles,
          loginTime: new Date().toISOString(),
        },
        userId: dbUser.id,
      });
    } catch (error) {
      this.logger.error('Failed to create login audit log:', error);
    }

    return {
      user: dbUser,
      session,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
  }

  /**
   * Verify Supabase access token and get user
   */
  async verifyToken(accessToken: string) {
    const supabase = this.supabaseService.getAdminClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Get user from our database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        requestedTickets: {
          select: { id: true, status: true },
        },
        assignedTickets: {
          select: { id: true, status: true },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      supabaseUser: user,
      dbUser,
    };
  }

  /**
   * Refresh Supabase session
   */
  async refreshSession(refreshToken: string) {
    const supabase = this.supabaseService.getClient();

    const {
      data: { session, user },
      error,
    } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !session || !user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      session,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user,
    };
  }

  /**
   * Sign out (revoke session)
   */
  async signOut(accessToken: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Get user from token
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (user) {
      // Sign out all sessions for this user
      await supabase.auth.admin.signOut(user.id);
    }

    return { message: 'Signed out successfully' };
  }

  /**
   * Update user password in Supabase
   */
  async updatePassword(userId: string, newPassword: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      this.logger.error('Error updating password:', error);
      throw new BadRequestException('Failed to update password');
    }

    return { message: 'Password updated successfully' };
  }

  /**
   * Get user metadata from Supabase
   */
  async getUserMetadata(userId: string): Promise<Record<string, any> | null> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: currentUser, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      this.logger.error('Error getting user metadata:', error);
      return null;
    }

    return currentUser?.user?.user_metadata || null;
  }

  /**
   * Update user metadata in Supabase
   */
  async updateUserMetadata(userId: string, metadata: Record<string, any>) {
    const supabase = this.supabaseService.getAdminClient();

    // Get current user metadata to preserve other fields
    const { data: currentUser } = await supabase.auth.admin.getUserById(userId);
    const currentMetadata = currentUser?.user?.user_metadata || {};

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentMetadata,
        ...metadata,
      },
    });

    if (error) {
      this.logger.error('Error updating user metadata:', error);
      throw new BadRequestException('Failed to update user metadata');
    }

    return { message: 'User metadata updated successfully', user: data.user };
  }

  /**
   * Reset password (send reset email)
   */
  async resetPassword(email: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      this.logger.error('Error sending password reset:', error);
      throw new BadRequestException('Failed to send password reset email');
    }

    return { message: 'Password reset email sent' };
  }
}

