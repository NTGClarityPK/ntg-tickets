import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../../common/config/system-config.service';
import { ValidationService } from '../../common/validation/validation.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole } from '@prisma/client';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private systemConfigService: SystemConfigService,
    private validationService: ValidationService,
    private auditLogsService: AuditLogsService
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

  async login(
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      activeRole?: string;
    },
    ipAddress?: string,
    userAgent?: string
  ) {
    // If no activeRole is provided, use the first role as default
    const activeRole = user.activeRole || user.roles[0];

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      activeRole: activeRole,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh', activeRole: activeRole },
      { expiresIn: '7d' }
    );

    // Log the login action with role information
    try {
      await this.auditLogsService.createAuditLog({
        action: 'LOGIN',
        resource: 'user',
        resourceId: user.id,
        metadata: {
          userRoles: user.roles,
          activeRole: activeRole,
          loginTime: new Date().toISOString(),
        },
        userId: user.id,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error('Failed to create login audit log:', error);
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        activeRole: activeRole,
      },
    };
  }

  async createOrUpdateUser(userData: {
    id: string;
    email: string;
    name: string;
    password?: string;
    avatar?: string;
    roles?: UserRole[];
  }): Promise<User> {
    try {
      // Validate password if provided
      if (userData.password) {
        const passwordValidation = this.validationService.validatePassword(
          userData.password
        );
        if (!passwordValidation.isValid) {
          throw new BadRequestException(passwordValidation.message);
        }
      }

      // Hash password if provided
      const hashedPassword = userData.password
        ? await bcrypt.hash(userData.password, 12)
        : undefined;

      const user = await this.prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          avatar: userData.avatar,
          roles: userData.roles || [UserRole.END_USER],
          isActive: true,
          updatedAt: new Date(),
          ...(hashedPassword && { password: hashedPassword }),
        },
        create: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          password:
            hashedPassword ||
            (await bcrypt.hash('temp-password-' + Date.now(), 12)), // Temporary password that must be changed
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

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      this.logger.log(`User ${user.email} created/updated successfully`);
      return userWithoutPassword as unknown as User;
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
    roles: UserRole[]
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

      return user;
    } catch (error) {
      this.logger.error('Error getting current user:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<{
    sub: string;
    email: string;
    roles: string[];
    activeRole: string;
    iat: number;
    exp: number;
  }> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error('Error verifying token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async validateJwtToken(token: string): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
    activeRole: string;
    isActive: boolean;
    avatar: string | null;
  } | null> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          isActive: true,
          avatar: true,
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Include activeRole from JWT payload
      return {
        ...user,
        activeRole: decoded.activeRole,
      };
    } catch (error) {
      this.logger.error('JWT validation failed', error);
      return null;
    }
  }

  async validateUserCredentials(
    email: string,
    password: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    roles: string[];
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.error(`User not found in database: ${email}`);
        return null;
      }

      if (!user.isActive) {
        this.logger.error(`User is inactive: ${email}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.logger.error(`Password validation failed for: ${email}`);
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error('Error validating user credentials:', error);
      return null;
    }
  }

  async switchActiveRole(
    userId: string,
    newActiveRole: string,
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

      if (!user.roles.includes(newActiveRole as UserRole)) {
        throw new BadRequestException('User does not have the specified role');
      }

      // Get the previous active role from the current JWT (if available)
      const previousActiveRole = user.roles[0]; // Default to first role as fallback

      const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        activeRole: newActiveRole,
      };

      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, type: 'refresh', activeRole: newActiveRole },
        { expiresIn: '7d' }
      );

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
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
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

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  } | null> {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        this.logger.error(
          `Refresh token - User not found or inactive for ID: ${decoded.sub}, user: ${JSON.stringify(user)}`
        );
        throw new UnauthorizedException('User not found or inactive');
      }

      // Preserve the activeRole from the original token if available
      // Otherwise fall back to the first role
      const activeRole = decoded.activeRole || user.roles[0];

      const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        activeRole: activeRole,
      };

      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, type: 'refresh', activeRole: activeRole },
        { expiresIn: '7d' }
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      return null;
    }
  }
}
