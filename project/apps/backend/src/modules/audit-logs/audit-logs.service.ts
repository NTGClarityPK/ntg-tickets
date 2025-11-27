import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, AuditAction } from '@prisma/client';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

export interface AuditLogFilters {
  page: number;
  limit: number;
  action?: string;
  userId?: string;
  ticketId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.JsonValue;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService
  ) {}

  /**
   * Get audit logs with pagination and filters
   */
  async getAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
    try {
      const { page, limit, action, userId, ticketId, dateFrom, dateTo } =
        filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.AuditLogWhereInput = {};

      if (action) {
        where.action = action as Prisma.AuditLogWhereInput['action'];
      }

      if (userId) {
        where.userId = userId;
      }

      if (ticketId) {
        where.resourceId = ticketId;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }
        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      // Get total count
      const total = await this.prisma.auditLog.count({ where });

      // Get audit logs with user information
      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          fieldName: log.fieldName,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          userId: log.userId,
          user: log.user,
          createdAt: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific ticket
   */
  async getTicketAuditLogs(
    ticketId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedAuditLogs> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.AuditLogWhereInput = {
        resource: 'ticket',
        resourceId: ticketId,
      };

      const total = await this.prisma.auditLog.count({ where });

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          fieldName: log.fieldName,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          userId: log.userId,
          user: log.user,
          createdAt: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Error getting ticket audit logs:', error);
      throw error;
    }
  }

  /**
   * Get system-wide audit logs (admin only)
   */
  async getSystemAuditLogs(
    page: number = 1,
    limit: number = 20,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<PaginatedAuditLogs> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.AuditLogWhereInput = {
        resource: {
          in: ['system', 'user', 'settings', 'integration', 'permission'],
        },
      };

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }
        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      const total = await this.prisma.auditLog.count({ where });

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          fieldName: log.fieldName,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          userId: log.userId,
          user: log.user,
          createdAt: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Error getting system audit logs:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 20,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<PaginatedAuditLogs> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.AuditLogWhereInput = {
        userId,
      };

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }
        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      const total = await this.prisma.auditLog.count({ where });

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          fieldName: log.fieldName,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          userId: log.userId,
          user: log.user,
          createdAt: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Error getting user activity logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByResource: Record<string, number>;
    logsByUser: Array<{ userId: string; userName: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const where: Prisma.AuditLogWhereInput = {};

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }
        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      // Get total logs count
      const totalLogs = await this.prisma.auditLog.count({ where });

      // Get logs by action
      const logsByActionData = await this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      });

      const logsByAction = logsByActionData.reduce(
        (acc, item) => {
          acc[item.action] = item._count.action;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get logs by resource
      const logsByResourceData = await this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
      });

      const logsByResource = logsByResourceData.reduce(
        (acc, item) => {
          acc[item.resource] = item._count.resource;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get logs by user
      const logsByUserData = await this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      });

      const logsByUser = await Promise.all(
        logsByUserData.map(async item => {
          const user = await this.prisma.user.findUnique({
            where: { id: item.userId },
            select: { name: true },
          });
          return {
            userId: item.userId,
            userName: user?.name || 'Unknown',
            count: item._count.userId,
          };
        })
      );

      // Get daily activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyActivityData = await this.prisma.auditLog.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: { createdAt: true },
      });

      const dailyActivity = dailyActivityData.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count.createdAt,
      }));

      return {
        totalLogs,
        logsByAction,
        logsByResource,
        logsByUser,
        dailyActivity,
      };
    } catch (error) {
      this.logger.error('Error getting audit log stats:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    action: string;
    resource: string;
    resourceId?: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    metadata?: Prisma.JsonValue;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    tenantId?: string;
  }): Promise<AuditLog> {
    try {
      const tenantId = data.tenantId || this.tenantContext.getTenantId();
      if (!tenantId) {
        this.logger.warn('No tenant context available for audit log, skipping');
        return {
          id: '',
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          fieldName: data.fieldName,
          oldValue: data.oldValue,
          newValue: data.newValue,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata,
          userId: data.userId,
          createdAt: new Date(),
        };
      }
      
      const auditLog = await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: data.action as AuditAction,
          resource: data.resource,
          resourceId: data.resourceId,
          fieldName: data.fieldName,
          oldValue: data.oldValue,
          newValue: data.newValue,
          metadata: data.metadata,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Audit log created: ${auditLog.action} by ${auditLog.userId}`
      );

      return {
        id: auditLog.id,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        fieldName: auditLog.fieldName,
        oldValue: auditLog.oldValue,
        newValue: auditLog.newValue,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata,
        userId: auditLog.userId,
        user: auditLog.user,
        createdAt: auditLog.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating audit log:', error);
      throw error;
    }
  }
}
