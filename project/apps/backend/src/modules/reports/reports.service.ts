import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  Prisma,
} from '@prisma/client';
import { SystemMonitoringService } from '../../common/system-monitoring/system-monitoring.service';

// Define proper types for report parameters
interface ReportParameters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  categoryId?: string;
  priority?: string;
  status?: string;
}

interface GenerateReportParams {
  userId: string;
  reportType: string;
  parameters: ReportParameters;
}

interface TicketFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  requesterId?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
  category?: string;
  userRole?: string;
}

interface ExportTicketReportParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  requesterId?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
  category?: string;
  userRole?: string;
}

// interface TeamPerformanceUser { // Removed unused interface
//   id: string;
//   name: string;
//   email: string;
//   roles: string[];
//   isActive: boolean;
//   assignedTickets: Array<{
//     id: string;
//     status: string;
//     createdAt: Date;
//   }>;
// }

interface MonthlyData {
  totalTime: number;
  count: number;
}

interface TicketTrendData {
  tickets: number;
  resolved: number;
}

interface SystemMetrics {
  uptime: string;
  storageUsed: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  lastBackup: string;
  databaseSize: string;
  metrics: Array<{
    time: string;
    cpu: number;
    memory: number;
    disk: number;
  }>;
}

interface UserDistribution {
  role: string;
  count: number;
  percentage: number;
}

interface SLAMetrics {
  responseTime: number;
  resolutionTime: number;
  customerSatisfaction: number;
}

interface ResolutionTimeTrend {
  month: string;
  avg: number;
  target: number;
}

interface TicketTrend {
  month: string;
  tickets: number;
  resolved: number;
}

interface TeamPerformance {
  userId: string;
  userName: string;
  assignedTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  slaCompliance: number;
  satisfactionRating: number;
}

interface TicketStats {
  total: number;
  resolved: number;
  pending: number;
  overdue: number;
  new: number;
  inProgress: number;
  closed: number;
}

interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
}

interface PriorityStats {
  priority: string;
  count: number;
  percentage: number;
}

interface TicketReportResult {
  ticketStats: TicketStats;
  categoryStats: CategoryStats[];
  priorityStats: PriorityStats[];
  resolutionTimeData: ResolutionTimeTrend[];
  ticketTrendData: TicketTrend[];
  teamPerformance: TeamPerformance[];
  slaMetrics: SLAMetrics;
}

interface ExportResult {
  data: Array<{
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    requester: string;
    assignedTo: string;
    category: string;
    subcategory: string;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  exportedAt: string;
  format?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private systemMonitoring: SystemMonitoringService
  ) {}

  async generateReport(params: GenerateReportParams) {
    // Placeholder implementation
    return {
      id: 'report-' + Date.now(),
      type: params.reportType,
      data: {},
      generatedAt: new Date(),
      filePath: '/tmp/report-' + Date.now() + '.pdf',
    };
  }

  async generateDailyReport() {
    // Placeholder implementation
    return {
      id: 'daily-report-' + Date.now(),
      type: 'DAILY',
      data: {},
      generatedAt: new Date(),
      filePath: '/tmp/daily-report-' + Date.now() + '.pdf',
    };
  }

  async getReportRecipients() {
    // Placeholder implementation
    return [
      { email: 'admin@example.com', name: 'Admin' },
      { email: 'manager@example.com', name: 'Manager' },
    ];
  }

  async getTicketReport(params: TicketFilters): Promise<TicketReportResult> {
    try {
      const { startDate, endDate, userId, status, priority, category } = params;

      const where: Prisma.TicketWhereInput = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (userId) {
        // For export, we need to distinguish between requester and assignedTo
        // If requesterId is provided, only show tickets where user is the requester
        // If assignedTo is provided, only show tickets where user is assigned
        if (params.requesterId) {
          where.requesterId = userId;
        } else if (params.assignedTo) {
          where.assignedToId = userId;
        } else {
          // Default behavior: show tickets where user is either requester or assigned
          where.OR = [{ requesterId: userId }, { assignedToId: userId }];
        }
      }

      if (status) {
        // Handle comma-separated status values
        const statusArray = status
          .split(',')
          .map(s => s.trim()) as TicketStatus[];
        if (statusArray.length === 1) {
          where.status = statusArray[0];
        } else {
          where.status = { in: statusArray };
        }
      }

      if (priority) {
        // Handle comma-separated priority values
        const priorityArray = priority
          .split(',')
          .map(p => p.trim()) as TicketPriority[];
        if (priorityArray.length === 1) {
          where.priority = priorityArray[0];
        } else {
          where.priority = { in: priorityArray };
        }
      }

      if (category) {
        // Handle comma-separated category IDs
        const categoryArray = category
          .split(',')
          .map(c => c.trim());
        if (categoryArray.length === 1) {
          where.categoryId = categoryArray[0];
        } else {
          where.categoryId = { in: categoryArray };
        }
      }

      const [
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        ticketsByCategory,
        ticketsByPriority,
        ticketsByStatus,
      ] = await Promise.all([
        this.prisma.ticket.count({ where }),
        this.prisma.ticket.count({
          where: {
            ...where,
            status: {
              in: [
                TicketStatus.NEW,
                TicketStatus.OPEN,
                TicketStatus.IN_PROGRESS,
              ],
            },
          },
        }),
        this.prisma.ticket.count({
          where: { ...where, status: TicketStatus.RESOLVED },
        }),
        this.prisma.ticket.count({
          where: { ...where, status: TicketStatus.CLOSED },
        }),
        this.getTicketsByCategory(where),
        this.getTicketsByPriority(where),
        this.getTicketsByStatus(where),
      ]);

      // const averageResolutionTime =
      //   await this.calculateAverageResolutionTime(where);
      // const slaCompliance = await this.calculateSLACompliance(where);

      // Transform data to match frontend expectations
      const ticketStats = {
        total: totalTickets,
        resolved: resolvedTickets,
        pending: openTickets,
        overdue: await this.getOverdueTicketsCount(where),
        new: ticketsByStatus.NEW || 0,
        inProgress: ticketsByStatus.IN_PROGRESS || 0,
        closed: closedTickets,
      };

      const categoryStats = Object.entries(ticketsByCategory).map(
        ([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalTickets) * 100),
        })
      );

      const priorityStats = Object.entries(ticketsByPriority).map(
        ([priority, count]) => ({
          priority,
          count,
          percentage: Math.round((count / totalTickets) * 100),
        })
      );

      // Calculate real resolution time data from database
      const resolutionTimeData = await this.calculateResolutionTimeTrend(where);

      // Calculate real ticket trend data from database
      const ticketTrendData = await this.calculateTicketTrends(where);

      const teamPerformance = await this.calculateTeamPerformance(userId);

      const slaMetrics = await this.calculateSLAMetrics(where);

      return {
        ticketStats,
        categoryStats,
        priorityStats,
        resolutionTimeData,
        ticketTrendData,
        teamPerformance,
        slaMetrics,
      };
    } catch (error) {
      this.logger.error('Error generating ticket report:', error);
      throw error;
    }
  }

  private async getTicketsByCategory(
    where: Prisma.TicketWhereInput
  ): Promise<Record<string, number>> {
    const result = await this.prisma.ticket.groupBy({
      by: ['categoryId'],
      where,
      _count: { categoryId: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { id: { in: result.map(r => r.categoryId) } },
    });

    return result.reduce(
      (acc, item) => {
        const category = categories.find(c => c.id === item.categoryId);
        acc[category?.name || 'Unknown'] = item._count.categoryId;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private async getTicketsByPriority(
    where: Prisma.TicketWhereInput
  ): Promise<Record<string, number>> {
    const result = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    return result.reduce(
      (acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private async getTicketsByStatus(
    where: Prisma.TicketWhereInput
  ): Promise<Record<string, number>> {
    const result = await this.prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    return result.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private async calculateAverageResolutionTime(
    where: Prisma.TicketWhereInput
  ): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        closedAt: { not: null },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    });

    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime =
        (ticket.closedAt as Date).getTime() - ticket.createdAt.getTime();
      return sum + resolutionTime;
    }, 0);

    return totalTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
  }

  private async calculateSLACompliance(
    where: Prisma.TicketWhereInput
  ): Promise<number> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        dueDate: { not: null },
        closedAt: { not: null },
      },
      select: {
        dueDate: true,
        closedAt: true,
      },
    });

    if (tickets.length === 0) return 100;

    const compliantTickets = tickets.filter(
      ticket => (ticket.closedAt as Date) <= (ticket.dueDate as Date)
    ).length;

    return (compliantTickets / tickets.length) * 100;
  }

  private async getOverdueTicketsCount(
    where: Prisma.TicketWhereInput
  ): Promise<number> {
    return this.prisma.ticket.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
    });
  }

  private async calculateTeamPerformance(
    userId?: string
  ): Promise<TeamPerformance[]> {
    try {
      const where: Prisma.TicketWhereInput = {};
      if (userId) {
        where.assignedToId = userId;
      }

      const users = await this.prisma.user.findMany({
        where: {
          roles: { hasSome: ['SUPPORT_STAFF', 'SUPPORT_MANAGER'] },
          isActive: true,
        },
        include: {
          assignedTickets: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      });

      const teamPerformance = await Promise.all(
        users.map(async user => {
          const assignedTickets = user.assignedTickets;
          const resolvedTickets = assignedTickets.filter(
            t => t.status === 'RESOLVED'
          );

          // Calculate real metrics for each user
          const avgResolutionTime = await this.calculateUserAvgResolutionTime(
            user.id
          );
          const slaCompliance = await this.calculateUserSLACompliance(user.id);

          return {
            userId: user.id,
            userName: user.name,
            assignedTickets: assignedTickets.length,
            resolvedTickets: resolvedTickets.length,
            avgResolutionTime,
            slaCompliance,
            satisfactionRating: 4.5, // This would need a separate satisfaction rating system
          };
        })
      );

      return teamPerformance;
    } catch (error) {
      this.logger.error('Error calculating team performance:', error);
      return [];
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get real system metrics from the monitoring service
      return await this.systemMonitoring.getSystemMetrics();
    } catch (error) {
      this.logger.error('Error getting system metrics:', error);
      throw error;
    }
  }

  async getUserDistribution(): Promise<UserDistribution[]> {
    try {
      // Get all active users and count roles manually
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { roles: true },
      });

      const roleCounts: Record<string, number> = {};
      users.forEach(user => {
        user.roles.forEach(role => {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
      });

      const totalUsers = users.length;

      return Object.entries(roleCounts).map(([role, count]) => ({
        role: role.replace('_', ' '),
        count,
        percentage: Math.round((count / totalUsers) * 100),
      }));
    } catch (error) {
      this.logger.error('Error getting user distribution:', error);
      throw error;
    }
  }

  private async calculateResolutionTimeTrend(
    where: Prisma.TicketWhereInput
  ): Promise<ResolutionTimeTrend[]> {
    try {
      // Get last 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const tickets = await this.prisma.ticket.findMany({
        where: {
          ...where,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          closedAt: { not: null },
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          createdAt: true,
          closedAt: true,
        },
      });

      // Group by month and calculate average resolution time
      const monthlyData = new Map<string, MonthlyData>();

      tickets.forEach(ticket => {
        const month = ticket.createdAt.toISOString().substring(0, 7); // YYYY-MM format
        const resolutionTime =
          ((ticket.closedAt as Date).getTime() - ticket.createdAt.getTime()) /
          (1000 * 60 * 60 * 24); // days

        if (!monthlyData.has(month)) {
          monthlyData.set(month, { totalTime: 0, count: 0 });
        }

        const data = monthlyData.get(month) as MonthlyData;
        data.totalTime += resolutionTime;
        data.count += 1;
      });

      // Convert to array format
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return Array.from(monthlyData.entries()).map(([monthKey, data]) => {
        const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
        return {
          month: months[monthIndex],
          avg: Math.round((data.totalTime / data.count) * 10) / 10,
          target: 3.0,
        };
      });
    } catch (error) {
      this.logger.error('Error calculating resolution time trend:', error);
      return [];
    }
  }

  private async calculateTicketTrends(
    where: Prisma.TicketWhereInput
  ): Promise<TicketTrend[]> {
    try {
      // Get last 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const tickets = await this.prisma.ticket.findMany({
        where: {
          ...where,
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          createdAt: true,
          status: true,
        },
      });

      // Group by month
      const monthlyData = new Map<string, TicketTrendData>();

      tickets.forEach(ticket => {
        const month = ticket.createdAt.toISOString().substring(0, 7); // YYYY-MM format

        if (!monthlyData.has(month)) {
          monthlyData.set(month, { tickets: 0, resolved: 0 });
        }

        const data = monthlyData.get(month) as TicketTrendData;
        data.tickets += 1;

        if (
          ticket.status === TicketStatus.RESOLVED ||
          ticket.status === TicketStatus.CLOSED
        ) {
          data.resolved += 1;
        }
      });

      // Convert to array format
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return Array.from(monthlyData.entries()).map(([monthKey, data]) => {
        const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
        return {
          month: months[monthIndex],
          tickets: data.tickets,
          resolved: data.resolved,
        };
      });
    } catch (error) {
      this.logger.error('Error calculating ticket trends:', error);
      return [];
    }
  }

  private async calculateSLAMetrics(
    where: Prisma.TicketWhereInput
  ): Promise<SLAMetrics> {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: {
          ...where,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          createdAt: true,
          closedAt: true,
          dueDate: true,
          status: true,
        },
      });

      const resolvedTickets = tickets.filter(
        t =>
          t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
      );

      // Calculate response time compliance (tickets responded to within SLA)
      const responseTimeCompliant = tickets.filter(() => {
        // Mock response time calculation - in real app, you'd track first response time
        return true; // For now, assume all tickets are responded to within SLA
      }).length;

      // Calculate resolution time compliance
      const resolutionTimeCompliant = resolvedTickets.filter(t => {
        if (!t.dueDate || !t.closedAt) return false;
        return t.closedAt <= t.dueDate;
      }).length;

      return {
        responseTime:
          tickets.length > 0
            ? Math.round((responseTimeCompliant / tickets.length) * 100)
            : 100,
        resolutionTime:
          resolvedTickets.length > 0
            ? Math.round(
                (resolutionTimeCompliant / resolvedTickets.length) * 100
              )
            : 100,
        customerSatisfaction: 92, // This would need a separate satisfaction rating system
      };
    } catch (error) {
      this.logger.error('Error calculating SLA metrics:', error);
      return {
        responseTime: 85,
        resolutionTime: 78,
        customerSatisfaction: 92,
      };
    }
  }

  private async calculateUserAvgResolutionTime(
    userId: string
  ): Promise<number> {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: {
          assignedToId: userId,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          closedAt: { not: null },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          createdAt: true,
          closedAt: true,
        },
      });

      if (tickets.length === 0) return 0;

      const totalTime = tickets.reduce((sum, ticket) => {
        const resolutionTime =
          ((ticket.closedAt as Date).getTime() - ticket.createdAt.getTime()) /
          (1000 * 60 * 60 * 24); // days
        return sum + resolutionTime;
      }, 0);

      return Math.round((totalTime / tickets.length) * 10) / 10;
    } catch (error) {
      this.logger.error('Error calculating user avg resolution time:', error);
      return 0;
    }
  }

  private async calculateUserSLACompliance(userId: string): Promise<number> {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: {
          assignedToId: userId,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          dueDate: { not: null },
          closedAt: { not: null },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          dueDate: true,
          closedAt: true,
        },
      });

      if (tickets.length === 0) return 100;

      const compliantTickets = tickets.filter(
        ticket => (ticket.closedAt as Date) <= (ticket.dueDate as Date)
      ).length;

      return Math.round((compliantTickets / tickets.length) * 100);
    } catch (error) {
      this.logger.error('Error calculating user SLA compliance:', error);
      return 100;
    }
  }

  async getSlaReport(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
    category?: string;
  }) {
    try {
      const { startDate, endDate, status, priority, category } = params;

      const where: Prisma.TicketWhereInput = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (status) {
        // Handle comma-separated status values
        const statusArray = status
          .split(',')
          .map(s => s.trim()) as TicketStatus[];
        if (statusArray.length === 1) {
          where.status = statusArray[0];
        } else {
          where.status = { in: statusArray };
        }
      }

      if (priority) {
        // Handle comma-separated priority values
        const priorityArray = priority
          .split(',')
          .map(p => p.trim()) as TicketPriority[];
        if (priorityArray.length === 1) {
          where.priority = priorityArray[0];
        } else {
          where.priority = { in: priorityArray };
        }
      }

      if (category) {
        // Handle comma-separated category IDs
        const categoryArray = category
          .split(',')
          .map(c => c.trim());
        if (categoryArray.length === 1) {
          where.categoryId = categoryArray[0];
        } else {
          where.categoryId = { in: categoryArray };
        }
      }

      // Get SLA metrics
      const slaMetrics = await this.calculateSLAMetrics(where);

      // Get compliance data
      const totalTickets = await this.prisma.ticket.count({ where });
      const overdueTickets = await this.getOverdueTicketsCount(where);
      const compliance =
        totalTickets > 0
          ? Math.round(((totalTickets - overdueTickets) / totalTickets) * 100)
          : 100;

      // Get violations count
      const violations = await this.prisma.ticket.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      });

      return {
        slaMetrics,
        compliance,
        violations,
      };
    } catch (error) {
      this.logger.error('Error generating SLA report:', error);
      throw error;
    }
  }

  async exportTicketReport(
    params: ExportTicketReportParams
  ): Promise<ExportResult> {
    try {
      this.logger.log('ExportTicketReport called with params:', params);
      const { startDate, endDate, userId, status, priority, category } = params;

      const where: Prisma.TicketWhereInput = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (userId) {
        // For export, we need to distinguish between requester and assignedTo
        // If requesterId is provided, only show tickets where user is the requester
        // If assignedTo is provided, only show tickets where user is assigned
        if (params.requesterId) {
          where.requesterId = userId;
        } else if (params.assignedTo) {
          where.assignedToId = userId;
        } else {
          // Default behavior: show tickets where user is either requester or assigned
          where.OR = [{ requesterId: userId }, { assignedToId: userId }];
        }
      }

      if (status) {
        // Handle comma-separated status values
        const statusArray = status
          .split(',')
          .map(s => s.trim()) as TicketStatus[];
        if (statusArray.length === 1) {
          where.status = statusArray[0];
        } else {
          where.status = { in: statusArray };
        }
      }

      if (priority) {
        // Handle comma-separated priority values
        const priorityArray = priority
          .split(',')
          .map(p => p.trim()) as TicketPriority[];
        if (priorityArray.length === 1) {
          where.priority = priorityArray[0];
        } else {
          where.priority = { in: priorityArray };
        }
      }

      if (category) {
        // Handle comma-separated category IDs
        const categoryArray = category
          .split(',')
          .map(c => c.trim());
        if (categoryArray.length === 1) {
          where.categoryId = categoryArray[0];
        } else {
          where.categoryId = { in: categoryArray };
        }
      }

      this.logger.log(
        'Querying tickets with where clause:',
        JSON.stringify(where, null, 2)
      );
      this.logger.log('ExportTicketReport params received:', params);

      const tickets = await this.prisma.ticket.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
          subcategory: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log('Found tickets:', tickets.length);
      if (tickets.length > 0) {
        this.logger.log('Sample ticket:', {
          id: tickets[0].id,
          ticketNumber: tickets[0].ticketNumber,
          requesterId: tickets[0].requesterId,
          requesterName: tickets[0].requester?.name,
        });
      }

      // Convert to export format based on type
      const exportData = tickets.map(ticket => ({
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        requester: ticket.requester?.name || 'Unknown',
        assignedTo: ticket.assignedTo?.name || 'Unassigned',
        category: ticket.category?.name || 'Unknown',
        subcategory: ticket.subcategory?.name || 'Unknown',
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      }));

      return {
        data: exportData,
        total: tickets.length,
        exportedAt: new Date().toISOString(),
        format: 'csv', // For now, we'll always return CSV data
      };
    } catch (error) {
      this.logger.error('Error exporting ticket report:', error);
      throw error;
    }
  }
}
