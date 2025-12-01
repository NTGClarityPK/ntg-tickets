import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../../common/config/system-config.service';
import { ValidationService } from '../../common/validation/validation.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { UserRole } from '@prisma/client';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseAuthService: SupabaseAuthService,
    private systemConfigService: SystemConfigService,
    private validationService: ValidationService,
    private auditLogsService: AuditLogsService,
    private tenantContext: TenantContextService
  ) {}

  async validateUser(
    email: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Error validating user:', error);
      return null;
    }
  }

  // Removed - using SupabaseAuthService.signIn() instead

  async createOrUpdateUser(userData: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    roles?: UserRole[];
  }): Promise<User> {
    try {
      // Get tenantId - for OAuth login, user must already exist with a tenant
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });
      
      const tenantId = existingUser?.tenantId || this.tenantContext.getTenantId();
      if (!tenantId) {
        throw new BadRequestException('User must be associated with an organization. Please sign up first.');
      }

      const user = await this.prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          avatar: userData.avatar,
          roles: userData.roles || [UserRole.END_USER],
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          id: userData.id,
          tenantId,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          roles: userData.roles || [UserRole.END_USER],
          isActive: true,
        },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      this.logger.log(`User ${user.email} created/updated successfully`);
      return user as unknown as User;
    } catch (error) {
      this.logger.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async validatePassword(
    password: string
  ): Promise<{ isValid: boolean; message?: string }> {
    return this.validationService.validatePassword(password);
  }

  async getPasswordRequirements(): Promise<string[]> {
    return this.validationService.getPasswordRequirements();
  }

  async updateUserRoles(
    userId: string,
    roles: UserRole[],
    currentUserId?: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      // Get the current user's roles before update
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true, email: true },
      });

      if (!currentUser) {
        throw new BadRequestException('User not found');
      }

      const hadAdminRole = currentUser.roles.includes(UserRole.ADMIN);
      const willHaveAdminRole = roles.includes(UserRole.ADMIN);

      // Check if admin is trying to remove their own admin role
      if (currentUserId && userId === currentUserId && hadAdminRole && !willHaveAdminRole) {
        throw new BadRequestException(
          'You cannot remove your own admin role. Please ask another admin to perform this action.'
        );
      }

      // Check if removing admin role would leave system with no admins
      if (hadAdminRole && !willHaveAdminRole) {
        const adminCount = await this.prisma.user.count({
          where: {
            roles: { has: UserRole.ADMIN },
            isActive: true,
          },
        });

        // If this user was the only admin, prevent removal
        if (adminCount === 1) {
          throw new BadRequestException(
            'Cannot remove admin role. This would leave the system with no administrators. Please assign admin role to another user first.'
          );
        }
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { roles, updatedAt: new Date() },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      this.logger.log(
        `User ${user.email} roles updated to ${roles.join(', ')}`
      );
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error updating user roles:', error);
      throw error;
    }
  }

  async addUserRole(
    userId: string,
    role: UserRole
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.roles.includes(role)) {
        const updatedRoles = [...user.roles, role];
        return this.updateUserRoles(userId, updatedRoles);
      }

      return this.getCurrentUser(userId);
    } catch (error) {
      this.logger.error('Error adding user role:', error);
      throw error;
    }
  }

  async removeUserRole(
    userId: string,
    role: UserRole
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.roles.length <= 1) {
        throw new BadRequestException('User must have at least one role');
      }

      const updatedRoles = user.roles.filter(r => r !== role);
      return this.updateUserRoles(userId, updatedRoles);
    } catch (error) {
      this.logger.error('Error removing user role:', error);
      throw error;
    }
  }

  async deactivateUser(
    userId: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  }> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      this.logger.log(`User ${user.email} deactivated`);
      return user;
    } catch (error) {
      this.logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  async getCurrentUser(
    userId: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    activeRole?: string;
    isActive: boolean;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          requestedTickets: {
            select: { id: true, status: true },
          },
          assignedTickets: {
            select: { id: true, status: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Return user with activeRole (use first role as default)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((r) => r.toString()),
        activeRole: user.roles[0]?.toString() || 'END_USER',
        isActive: user.isActive,
      };
    } catch (error) {
      this.logger.error('Error getting current user:', error);
      throw error;
    }
  }

  // Removed - using SupabaseAuthService.verifyToken() instead

  async validateUserCredentials(
    email: string,
    password: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
  } | null> {
    // This method is deprecated - passwords are now managed by Supabase Auth
    // Use SupabaseAuthService.signIn() instead
    this.logger.warn('validateUserCredentials is deprecated. Use SupabaseAuthService.signIn() instead.');
    return null;
  }

  async switchActiveRole(
    userId: string,
    newActiveRole: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      activeRole: string;
    };
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      if (!user.roles.map(r => r.toString()).includes(newActiveRole)) {
        throw new BadRequestException('User does not have the specified role');
      }

      // Get the previous active role from Supabase user metadata (before updating)
      let previousActiveRole: string = user.roles[0]?.toString() || 'END_USER'; // Default to first role as fallback
      try {
        const metadata = await this.supabaseAuthService.getUserMetadata(userId);
        if (metadata?.activeRole) {
          previousActiveRole = metadata.activeRole as string;
        }
      } catch (error) {
        this.logger.warn('Could not get previous active role from Supabase', error);
      }

      // Update activeRole in Supabase user metadata
      await this.supabaseAuthService.updateUserMetadata(userId, {
        activeRole: newActiveRole,
      });

      // Refresh the session to get new tokens with updated metadata
      // Note: Supabase metadata updates are immediate, so we can refresh right away
      const refreshedSession = await this.supabaseAuthService.refreshSession(refreshToken);
      
      // Log the role switch action with role information
      try {
        await this.auditLogsService.createAuditLog({
          action: 'UPDATE',
          resource: 'user',
          resourceId: user.id,
          fieldName: 'activeRole',
          oldValue: previousActiveRole,
          newValue: newActiveRole,
          metadata: {
            userRoles: user.roles,
            previousActiveRole: previousActiveRole,
            newActiveRole: newActiveRole,
            switchTime: new Date().toISOString(),
          },
          userId: user.id,
          ipAddress,
          userAgent,
        });
      } catch (error) {
        this.logger.error('Failed to create role switch audit log:', error);
      }

      return {
        access_token: refreshedSession.access_token,
        refresh_token: refreshedSession.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          activeRole: newActiveRole,
        },
      };
    } catch (error) {
      this.logger.error('Error switching active role:', error);
      throw error;
    }
  }

  // Removed - using SupabaseAuthService.refreshSession() instead
}
