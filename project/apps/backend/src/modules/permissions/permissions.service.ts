import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface RolePermission {
  role: UserRole;
  permissions: Permission[];
}

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Define role-based permissions
   */
  private getRolePermissions(): RolePermission[] {
    return [
      {
        role: UserRole.ADMIN,
        permissions: [
          {
            id: 'admin-all',
            name: 'Full System Access',
            description: 'Complete access to all system features',
            resource: '*',
            action: '*',
          },
        ],
      },
      {
        role: UserRole.SUPPORT_MANAGER,
        permissions: [
          {
            id: 'manager-tickets',
            name: 'Manage All Tickets',
            description: 'View, create, update, assign, and close all tickets',
            resource: 'tickets',
            action: 'read,create,update,delete,assign',
          },
          {
            id: 'manager-users',
            name: 'Manage Support Staff',
            description: 'View and manage support staff users',
            resource: 'users',
            action: 'read,update',
            conditions: { role: 'SUPPORT_STAFF' },
          },
          {
            id: 'manager-reports',
            name: 'View Reports',
            description: 'Access to all reports and analytics',
            resource: 'reports',
            action: 'read',
          },
          {
            id: 'manager-categories',
            name: 'Manage Categories',
            description: 'Create and update ticket categories',
            resource: 'categories',
            action: 'read,create,update',
          },
        ],
      },
      {
        role: UserRole.SUPPORT_STAFF,
        permissions: [
          {
            id: 'staff-tickets',
            name: 'Manage Assigned Tickets',
            description: 'View and manage assigned tickets',
            resource: 'tickets',
            action: 'read,update,comment',
            conditions: { assignedTo: 'self' },
          },
          {
            id: 'staff-all-tickets',
            name: 'View All Tickets',
            description: 'View all tickets for reference',
            resource: 'tickets',
            action: 'read',
          },
          {
            id: 'staff-users',
            name: 'View Users',
            description: 'View user information',
            resource: 'users',
            action: 'read',
          },
          {
            id: 'staff-reports',
            name: 'View Basic Reports',
            description: 'Access to basic reports',
            resource: 'reports',
            action: 'read',
            conditions: { scope: 'basic' },
          },
        ],
      },
      {
        role: UserRole.END_USER,
        permissions: [
          {
            id: 'user-own-tickets',
            name: 'Manage Own Tickets',
            description: 'Create and view own tickets',
            resource: 'tickets',
            action: 'read,create,update,comment',
            conditions: { requester: 'self' },
          },
          {
            id: 'user-profile',
            name: 'Manage Profile',
            description: 'Update own profile information',
            resource: 'users',
            action: 'read,update',
            conditions: { id: 'self' },
          },
        ],
      },
    ];
  }

  /**
   * Check if user has permission for a specific action
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    activeRole?: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        return false;
      }

      // Use provided activeRole or first role as fallback
      const userActiveRole = activeRole || user.roles[0];

      const rolePermissions = this.getRolePermissions().find(
        rp => rp.role === userActiveRole
      );

      if (!rolePermissions) {
        return false;
      }

      // Check for admin role (full access)
      if (userActiveRole === UserRole.ADMIN) {
        return true;
      }

      // Check specific permissions
      for (const permission of rolePermissions.permissions) {
        if (this.matchesPermission(permission, resource, action, context)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if permission matches the requested resource and action
   */
  private matchesPermission(
    permission: Permission,
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): boolean {
    // Check resource match
    if (permission.resource !== '*' && permission.resource !== resource) {
      return false;
    }

    // Check action match
    const allowedActions = permission.action.split(',');
    if (!allowedActions.includes('*') && !allowedActions.includes(action)) {
      return false;
    }

    // Check conditions
    if (permission.conditions && context) {
      for (const [key, value] of Object.entries(permission.conditions)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all permissions for a role
   */
  getPermissionsForRole(role: UserRole): Permission[] {
    const rolePermissions = this.getRolePermissions().find(
      rp => rp.role === role
    );
    return rolePermissions?.permissions || [];
  }

  /**
   * Get all role permissions
   */
  getAllRolePermissions(): RolePermission[] {
    return this.getRolePermissions();
  }

  /**
   * Check if user can access a specific ticket
   */
  async canAccessTicket(
    userId: string,
    ticketId: string,
    action: string = 'read'
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        return false;
      }

      // Get the user's active role from the request context
      // For now, we'll use the first role as activeRole
      // This should be passed from the JWT token in a real implementation
      const activeRole = user.roles[0];

      // Admin can access all tickets
      if (activeRole === UserRole.ADMIN) {
        return true;
      }

      // Manager can access all tickets
      if (activeRole === UserRole.SUPPORT_MANAGER) {
        return true;
      }

      // Staff can access assigned tickets or all tickets for read
      if (activeRole === UserRole.SUPPORT_STAFF) {
        if (action === 'read') {
          return true; // Can read all tickets
        }

        // For other actions, check if assigned
        const ticket = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { assignedToId: true },
        });

        return ticket?.assignedToId === userId;
      }

      // End user can only access own tickets
      if (activeRole === UserRole.END_USER) {
        const ticket = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { requesterId: true },
        });

        return ticket?.requesterId === userId;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking ticket access:', error);
      return false;
    }
  }

  /**
   * Check if user can access a specific user
   */
  async canAccessUser(
    userId: string,
    targetUserId: string,
    action: string = 'read'
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        return false;
      }

      // Get the user's active role from the request context
      const activeRole = user.roles[0];

      // Admin can access all users
      if (activeRole === UserRole.ADMIN) {
        return true;
      }

      // Manager can access support staff
      if (activeRole === UserRole.SUPPORT_MANAGER) {
        const targetUser = await this.prisma.user.findUnique({
          where: { id: targetUserId },
          select: { roles: true },
        });

        return targetUser?.roles.includes(UserRole.SUPPORT_STAFF);
      }

      // Staff can read all users
      if (activeRole === UserRole.SUPPORT_STAFF && action === 'read') {
        return true;
      }

      // End user can only access own profile
      if (activeRole === UserRole.END_USER) {
        return userId === targetUserId;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking user access:', error);
      return false;
    }
  }
}
