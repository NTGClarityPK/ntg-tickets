import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../../common/config/system-config.service';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private systemConfigService: SystemConfigService,
    private readonly appConfig: AppConfigService
  ) {}

  async getSystemStats() {
    try {
      const [
        totalTickets,
        openTickets,
        closedTickets,
        totalUsers,
        activeUsers,
        totalCategories,
        totalComments,
        totalAttachments,
        slaCompliance,
        avgResolutionTime,
        ticketsByStatus,
        ticketsByPriority,
        ticketsByCategory,
        recentActivity,
      ] = await Promise.all([
        this.prisma.ticket.count(),
        this.prisma.ticket.count({
          where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
        }),
        this.prisma.ticket.count({
          where: { status: { in: ['RESOLVED', 'CLOSED'] } },
        }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.category.count({ where: { isActive: true } }),
        this.prisma.comment.count(),
        this.prisma.attachment.count(),
        this.getSLACompliance(),
        this.getAverageResolutionTime(),
        this.getTicketsByStatus(),
        this.getTicketsByPriority(),
        this.getTicketsByCategory(),
        this.getRecentActivity(),
      ]);

      return {
        overview: {
          totalTickets,
          openTickets,
          closedTickets,
          totalUsers,
          activeUsers,
          totalCategories,
          totalComments,
          totalAttachments,
        },
        performance: {
          slaCompliance,
          avgResolutionTime,
        },
        analytics: {
          ticketsByStatus,
          ticketsByPriority,
          ticketsByCategory,
        },
        recentActivity,
      };
    } catch (error) {
      this.logger.error('Error getting system stats:', error);
      throw error;
    }
  }

  async getSystemHealth() {
    try {
      const healthChecks = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkElasticsearchHealth(),
        this.checkEmailHealth(),
      ]);

      const health = {
        database:
          healthChecks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        redis: healthChecks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        elasticsearch:
          healthChecks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        email: healthChecks[3].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      };

      const overallHealth = Object.values(health).every(
        status => status === 'healthy'
      )
        ? 'healthy'
        : 'degraded';

      return {
        overall: overallHealth,
        services: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error checking system health:', error);
      return {
        overall: 'unhealthy',
        services: {
          database: 'unknown',
          redis: 'unknown',
          elasticsearch: 'unknown',
          email: 'unknown',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getSystemConfiguration() {
    return this.systemConfigService.getConfig();
  }

  async getPublicConfiguration() {
    const config = this.systemConfigService.getConfig();
    const themeSettings = await this.getThemeSettings();
    
    // Return only public settings that don't require admin access
    return {
      siteName: config.siteName,
      siteDescription: config.siteDescription,
      timezone: config.timezone,
      language: config.language,
      dateFormat: config.dateFormat,
      theme: {
        primaryColor: themeSettings?.primaryColor,
        logoUrl: themeSettings?.logoUrl,
        faviconUrl: themeSettings?.faviconUrl,
        logoData: themeSettings?.logoData,
        faviconData: themeSettings?.faviconData,
      },
    };
  }

  async updateSystemConfiguration(config: Record<string, unknown>) {
    await this.systemConfigService.updateConfig(config);
    return {
      message: 'System configuration updated successfully',
      config,
    };
  }

  private async getSLACompliance() {
    try {
      const resolvedTickets = await this.prisma.ticket.findMany({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          dueDate: { not: null },
          closedAt: { not: null },
        },
        select: {
          dueDate: true,
          closedAt: true,
        },
      });

      if (resolvedTickets.length === 0) return 100;

      const compliantTickets = resolvedTickets.filter(
        ticket => new Date(ticket.closedAt) <= new Date(ticket.dueDate)
      );

      return Math.round(
        (compliantTickets.length / resolvedTickets.length) * 100
      );
    } catch (error) {
      this.logger.error('Error calculating SLA compliance:', error);
      return 0;
    }
  }

  private async getAverageResolutionTime() {
    try {
      const resolvedTickets = await this.prisma.ticket.findMany({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          closedAt: { not: null },
        },
        select: {
          createdAt: true,
          closedAt: true,
        },
      });

      if (resolvedTickets.length === 0) return 0;

      const totalHours = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt);
        const closed = new Date(ticket.closedAt);
        const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      return Math.round(totalHours / resolvedTickets.length);
    } catch (error) {
      this.logger.error('Error calculating average resolution time:', error);
      return 0;
    }
  }

  private async getTicketsByStatus() {
    try {
      const statusCounts = await this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
      });

      return statusCounts.map(item => ({
        status: item.status,
        count: item._count.status,
      }));
    } catch (error) {
      this.logger.error('Error getting tickets by status:', error);
      return [];
    }
  }

  private async getTicketsByPriority() {
    try {
      const priorityCounts = await this.prisma.ticket.groupBy({
        by: ['priority'],
        _count: { priority: true },
        orderBy: { _count: { priority: 'desc' } },
      });

      return priorityCounts.map(item => ({
        priority: item.priority,
        count: item._count.priority,
      }));
    } catch (error) {
      this.logger.error('Error getting tickets by priority:', error);
      return [];
    }
  }

  private async getTicketsByCategory() {
    try {
      const tickets = await this.prisma.ticket.findMany({
        select: { category: true },
      });

      const categoryCounts = tickets.reduce(
        (acc, ticket) => {
          const category = String(ticket.category);
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
      }));
    } catch (error) {
      this.logger.error('Error getting tickets by category:', error);
      return [];
    }
  }

  private async getRecentActivity(limit: number = 10) {
    try {
      const activities = await this.prisma.ticket.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return activities.map(ticket => ({
        id: ticket.id,
        action: 'TICKET_CREATED',
        entityType: 'TICKET',
        entityId: ticket.id,
        createdAt: ticket.createdAt,
        user: ticket.requester,
        details: `Ticket ${ticket.ticketNumber} created`,
      }));
    } catch (error) {
      this.logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  private async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkRedisHealth() {
    try {
      // Check if Redis is configured
      const redisConfig = this.appConfig.redis;

      if (!redisConfig.host || !redisConfig.port) {
        this.logger.warn('Redis not configured - skipping health check');
        return true; // Redis is optional
      }

      // Try to connect to Redis
      const { createClient } = await import('redis');
      const client = createClient({
        url: `redis://${redisConfig.host}:${redisConfig.port}`,
        password: redisConfig.password || undefined,
        socket: {
          connectTimeout: 5000,
        },
      });

      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          client.quit();
          resolve(false);
        }, 5000);

        client.on('connect', () => {
          clearTimeout(timeout);
          client.quit();
          resolve(true);
        });

        client.on('error', err => {
          clearTimeout(timeout);
          this.logger.error('Redis connection error:', err);
          client.quit();
          resolve(false);
        });

        client.connect();
      });
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  private async checkElasticsearchHealth() {
    try {
      const elasticsearchUrl = this.appConfig.elasticsearchUrl;

      if (!elasticsearchUrl) {
        this.logger.warn(
          'Elasticsearch not configured - skipping health check'
        );
        return true; // Elasticsearch is optional
      }

      // Check Elasticsearch cluster health
      const response = await fetch(`${elasticsearchUrl}/_cluster/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        this.logger.error(
          `Elasticsearch health check failed: ${response.status} ${response.statusText}`
        );
        return false;
      }

      const health = await response.json();
      const isHealthy = health.status === 'green' || health.status === 'yellow';

      if (!isHealthy) {
        this.logger.warn(`Elasticsearch cluster status: ${health.status}`);
      }

      return isHealthy;
    } catch (error) {
      this.logger.error('Elasticsearch health check failed:', error);
      return false;
    }
  }

  private async checkEmailHealth() {
    try {
      // Check if email is configured
      const emailConfig = this.systemConfigService.getEmailConfig();
      const fallbackSmtp = this.appConfig.smtp;

      const smtpHost = emailConfig.host || fallbackSmtp.host;
      const smtpPort = emailConfig.port || fallbackSmtp.port;
      const smtpUser = emailConfig.username || fallbackSmtp.user;
      const smtpPass = emailConfig.password || fallbackSmtp.pass;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        this.logger.warn('Email not configured - skipping health check');
        return true; // Email is optional
      }

      // Test SMTP connection
      const { createTransport } = await import('nodemailer');
      const transporter = createTransport({
        host: smtpHost,
        port: parseInt(String(smtpPort)),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      // Verify connection
      await transporter.verify();
      this.logger.log('Email service health check passed');
      return true;
    } catch (error) {
      this.logger.error('Email health check failed:', error);
      return false;
    }
  }

  async getFieldConfig() {
    try {
      const [categories, subcategories, customFields] = await Promise.all([
        this.prisma.category.findMany({
          where: { isActive: true },
          include: {
            subcategories: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.subcategory.findMany({
          where: { isActive: true },
          include: {
            category: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.customField.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
        }),
      ]);

      return {
        categories,
        subcategories,
        customFields,
        fieldOptions: {
          priorities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          impacts: ['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'],
          urgencies: ['LOW', 'NORMAL', 'HIGH', 'IMMEDIATE'],
          slaLevels: ['STANDARD', 'PREMIUM', 'CRITICAL_SUPPORT'],
          statuses: [
            'NEW',
            'OPEN',
            'IN_PROGRESS',
            'ON_HOLD',
            'RESOLVED',
            'CLOSED',
            'REOPENED',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Error getting field configuration:', error);
      throw error;
    }
  }

  async updateFieldConfig(fieldConfig: Record<string, unknown>) {
    try {
      const { categories, subcategories, customFields } = fieldConfig;
      const results: Record<string, string> = {};

      // Update categories if provided
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          if (category.id) {
            await this.prisma.category.update({
              where: { id: category.id },
              data: {
                name: category.name,
                description: category.description,
                isActive: category.isActive,
              },
            });
          } else {
            await this.prisma.category.create({
              data: {
                name: category.name,
                description: category.description,
                isActive: category.isActive ?? true,
                createdBy: 'system', // This should be the current user ID
              },
            });
          }
        }
        results.categories = 'Updated successfully';
      }

      // Update subcategories if provided
      if (subcategories && Array.isArray(subcategories)) {
        for (const subcategory of subcategories) {
          if (subcategory.id) {
            await this.prisma.subcategory.update({
              where: { id: subcategory.id },
              data: {
                name: subcategory.name,
                description: subcategory.description,
                isActive: subcategory.isActive,
              },
            });
          } else {
            await this.prisma.subcategory.create({
              data: {
                name: subcategory.name,
                description: subcategory.description,
                isActive: subcategory.isActive ?? true,
                categoryId: subcategory.categoryId,
                createdBy: 'system', // This should be the current user ID
              },
            });
          }
        }
        results.subcategories = 'Updated successfully';
      }

      // Update custom fields if provided
      if (customFields && Array.isArray(customFields)) {
        for (const field of customFields) {
          if (field.id) {
            await this.prisma.customField.update({
              where: { id: field.id },
              data: {
                name: field.name,
                fieldType: field.fieldType,
                options: field.options,
                isRequired: field.isRequired,
                isActive: field.isActive,
              },
            });
          } else {
            await this.prisma.customField.create({
              data: {
                name: field.name,
                fieldType: field.fieldType,
                options: field.options,
                isRequired: field.isRequired ?? false,
                isActive: field.isActive ?? true,
              },
            });
          }
        }
        results.customFields = 'Updated successfully';
      }

      return results;
    } catch (error) {
      this.logger.error('Error updating field configuration:', error);
      throw error;
    }
  }

  async getThemeSettings() {
    try {
      const themeSettings = await (this.prisma as any).themeSettings.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });

      return themeSettings || {
        id: null,
        primaryColor: null,
        logoUrl: null,
        faviconUrl: null,
        isActive: true,
      };
    } catch (error) {
      this.logger.error('Error getting theme settings:', error);
      throw error;
    }
  }

  async updateThemeSettings(themeData: {
    primaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    logoData?: string;
    faviconData?: string;
  }) {
    try {
      // Validate base64 data size
      if (themeData.logoData && themeData.logoData.length > 500000) { // ~375KB base64 = ~500KB original
        throw new Error('Logo data too large. Please use a smaller image.');
      }
      
      if (themeData.faviconData && themeData.faviconData.length > 100000) { // ~75KB base64 = ~100KB original
        throw new Error('Favicon data too large. Please use a smaller image.');
      }

      // Get current theme settings to preserve existing data
      const currentSettings = await (this.prisma as any).themeSettings.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });

      // Deactivate all existing theme settings
      await (this.prisma as any).themeSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Merge new data with existing data, preserving existing values when new ones are not provided
      const mergedData: any = {
        isActive: true,
      };

      // Only set fields that are explicitly provided in the request
      if (themeData.primaryColor !== undefined) {
        mergedData.primaryColor = themeData.primaryColor;
      } else if (currentSettings?.primaryColor !== undefined) {
        mergedData.primaryColor = currentSettings.primaryColor;
      }

      // Handle logo data and URL - if logoData is provided, clear logoUrl
      if (themeData.logoData !== undefined) {
        if (themeData.logoData === '') {
          // Empty string means clear the logo data
          mergedData.logoData = null;
        } else {
          mergedData.logoData = themeData.logoData;
        }
        mergedData.logoUrl = null; // Clear URL when file data is provided
      } else if (currentSettings?.logoData !== undefined) {
        mergedData.logoData = currentSettings.logoData;
      }

      if (themeData.logoUrl !== undefined) {
        if (themeData.logoUrl === '') {
          // Empty string means clear the logo URL
          mergedData.logoUrl = null;
        } else {
          mergedData.logoUrl = themeData.logoUrl;
        }
      } else if (currentSettings?.logoUrl !== undefined && themeData.logoData === undefined) {
        // Only preserve logoUrl if no new logoData is being provided
        mergedData.logoUrl = currentSettings.logoUrl;
      }

      // Handle favicon data and URL - if faviconData is provided, clear faviconUrl
      if (themeData.faviconData !== undefined) {
        if (themeData.faviconData === '') {
          // Empty string means clear the favicon data
          mergedData.faviconData = null;
        } else {
          mergedData.faviconData = themeData.faviconData;
        }
        mergedData.faviconUrl = null; // Clear URL when file data is provided
      } else if (currentSettings?.faviconData !== undefined) {
        mergedData.faviconData = currentSettings.faviconData;
      }

      if (themeData.faviconUrl !== undefined) {
        if (themeData.faviconUrl === '') {
          // Empty string means clear the favicon URL
          mergedData.faviconUrl = null;
        } else {
          mergedData.faviconUrl = themeData.faviconUrl;
        }
      } else if (currentSettings?.faviconUrl !== undefined && themeData.faviconData === undefined) {
        // Only preserve faviconUrl if no new faviconData is being provided
        mergedData.faviconUrl = currentSettings.faviconUrl;
      }

      console.log('Merging theme data:', {
        incoming: themeData,
        current: currentSettings,
        merged: mergedData
      });

      // Additional logging for debugging
      console.log('Logo data preservation check:', {
        incomingLogoData: themeData.logoData,
        incomingLogoDataType: typeof themeData.logoData,
        incomingLogoDataUndefined: themeData.logoData === undefined,
        currentLogoData: currentSettings?.logoData,
        finalLogoData: mergedData.logoData,
        logoDataPreserved: mergedData.logoData === currentSettings?.logoData
      });

      console.log('URL clearing check:', {
        logoDataProvided: themeData.logoData !== undefined,
        faviconDataProvided: themeData.faviconData !== undefined,
        logoUrlCleared: themeData.logoData !== undefined,
        faviconUrlCleared: themeData.faviconData !== undefined,
        finalLogoUrl: mergedData.logoUrl,
        finalFaviconUrl: mergedData.faviconUrl
      });

      // Additional logging for reset operations
      console.log('Reset operation check:', {
        isReset: themeData.logoData === '' && themeData.faviconData === '' && themeData.logoUrl === '' && themeData.faviconUrl === '',
        logoDataEmpty: themeData.logoData === '',
        faviconDataEmpty: themeData.faviconData === '',
        logoUrlEmpty: themeData.logoUrl === '',
        faviconUrlEmpty: themeData.faviconUrl === ''
      });

      // Create new theme settings with merged data
      const newThemeSettings = await (this.prisma as any).themeSettings.create({
        data: mergedData,
      });

      return {
        message: 'Theme settings updated successfully',
        data: newThemeSettings,
      };
    } catch (error) {
      this.logger.error('Error updating theme settings:', error);
      throw error;
    }
  }

}
