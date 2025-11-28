import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Get ticket analytics report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async getTicketReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string
  ): Promise<{ data: unknown; message: string }> {
    const report = await this.reportsService.getTicketReport({
      startDate: dateFrom || startDate,
      endDate: dateTo || endDate,
      userId: assignedTo || userId,
      status,
      priority,
      category,
    });

    return {
      data: report,
      message: 'Report generated successfully',
    };
  }

  @Get('system-metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
  })
  async getSystemMetrics(): Promise<{ data: unknown; message: string }> {
    const metrics = await this.reportsService.getSystemMetrics();

    return {
      data: metrics,
      message: 'System metrics retrieved successfully',
    };
  }

  @Get('user-distribution')
  @ApiOperation({ summary: 'Get user distribution by role' })
  @ApiResponse({
    status: 200,
    description: 'User distribution retrieved successfully',
  })
  async getUserDistribution(): Promise<{ data: unknown; message: string }> {
    const distribution = await this.reportsService.getUserDistribution();

    return {
      data: distribution,
      message: 'User distribution retrieved successfully',
    };
  }

  @Get('sla')
  @ApiOperation({ summary: 'Get SLA metrics report' })
  @ApiResponse({
    status: 200,
    description: 'SLA report generated successfully',
  })
  async getSlaReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string
  ): Promise<{ data: unknown; message: string }> {
    const report = await this.reportsService.getSlaReport({
      startDate: dateFrom || startDate,
      endDate: dateTo || endDate,
      status,
      priority,
      category,
    });

    return {
      data: report,
      message: 'SLA report generated successfully',
    };
  }

  // GET export endpoint removed - frontend uses POST /reports/export/:type instead
  // This consolidates export functionality into a single POST endpoint

  @Post('export/:type')
  @ApiOperation({ summary: 'Export structured report by type (POST)' })
  @ApiResponse({
    status: 200,
    description: 'Structured report exported successfully',
  })
  async exportStructuredReport(
    @Param('type') type: string,
    @Body()
    body: {
      format: 'excel' | 'pdf' | 'csv';
      filters?: Record<string, unknown>;
      data?: AdminReportExportData;
    },
    @Res() res: Response
  ): Promise<void> {
    try {
      this.logger.log('🚀 exportStructuredReport called with type:', type);
      this.logger.log('Structured export request received:', {
        type,
        format: body.format,
        hasData: !!body.data,
      });
      this.logger.log(
        '🔍 Type check - type:',
        type,
        'type === "tickets":',
        type === 'tickets'
      );
      this.logger.log(
        '🔍 Type details - length:',
        type.length,
        'charCodeAt(0):',
        type.charCodeAt(0)
      );
      this.logger.log('🔍 Full request body:', JSON.stringify(body, null, 2));

      if (type === 'admin-report' && body.format === 'excel') {
        await this.exportAdminReport(body.data, res);
        return;
      }

      // Handle tickets export with filters from POST body
      if (
        type === 'tickets' ||
        type.toLowerCase() === 'tickets' ||
        type.includes('ticket')
      ) {
        this.logger.log('Handling tickets export request - matched condition');
        await this.exportTicketsFromPost(body, res);
        return;
      }

      // For other types, fall back to the original GET method logic
      this.logger.error(
        '🚨 Type did not match any condition. Type received:',
        type
      );
      throw new Error(`Unsupported structured export type: ${type}`);
    } catch (error) {
      this.logger.error('Structured export error:', error);
      res.status(500).json({
        message: 'Failed to export structured report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async exportTicketsFromPost(
    body: {
      format: 'excel' | 'pdf' | 'csv';
      filters?: Record<string, unknown>;
    },
    res: Response
  ): Promise<void> {
    try {
      this.logger.log('🚀 exportTicketsFromPost method called');
      this.logger.log('Exporting tickets from POST body:', {
        format: body.format,
        filters: body.filters,
      });

      // Extract filters from the body
      const filters = body.filters || {};
      const {
        dateFrom,
        dateTo,
        requesterId,
        assignedTo,
        status,
        priority,
        category,
        monthYear,
      } = filters;

      this.logger.log('Raw filters received from frontend:', filters);
      this.logger.log('Extracted filter values:', {
        dateFrom,
        dateTo,
        requesterId,
        assignedTo,
        status,
        priority,
        category,
        monthYear,
      });

      // Convert filters to the format expected by the service
      const exportParams = {
        startDate: dateFrom as string,
        endDate: dateTo as string,
        userId: (requesterId || assignedTo) as string, // Support both requesterId and assignedTo
        requesterId: requesterId as string, // Pass requesterId explicitly
        assignedTo: assignedTo as string, // Pass assignedTo explicitly
        status: Array.isArray(status) ? status.join(',') : (status as string),
        priority: Array.isArray(priority)
          ? priority.join(',')
          : (priority as string),
        category: Array.isArray(category)
          ? category.join(',')
          : (category as string),
        userRole: (filters as { userRole?: string }).userRole as string, // Pass userRole for filename
      };

      this.logger.log('Export parameters being sent to service:', exportParams);

      // Get the report data
      const report = await this.reportsService.exportTicketReport(exportParams);

      this.logger.log('Report data received:', {
        total: report?.data?.length || 0,
      });

      if (!report || !report.data || !Array.isArray(report.data)) {
        throw new Error('Invalid report data received from service');
      }

      // Generate content based on format
      let content: Buffer;
      let mimeType: string;
      let fileExtension: string;

      switch (body.format) {
        case 'csv': {
          const csvContent = [
            // CSV header
            'Ticket Number,Title,Status,Priority,Requester,Assigned To,Category,Subcategory,Created At,Updated At',
            // CSV rows
            ...report.data.map(
              (ticket: Record<string, unknown>) =>
                `"${ticket.ticketNumber}","${ticket.title}","${ticket.status}","${ticket.priority}","${ticket.requester}","${ticket.assignedTo}","${ticket.category}","${ticket.subcategory}","${ticket.createdAt}","${ticket.updatedAt}"`
            ),
          ].join('\n');
          content = Buffer.from(csvContent, 'utf8');
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        }

        case 'excel': {
          // Create structured Excel file with multiple sheets
          const workbook = XLSX.utils.book_new();

          // Get user role from filters to determine export structure
          const userRole = (body.filters as { userRole?: string })?.userRole;

          // Calculate breakdowns
          const totalTickets = report.data.length;
          const statusBreakdown = report.data.reduce(
            (acc: Record<string, number>, ticket: Record<string, unknown>) => {
              const status = ticket.status as string;
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {}
          );

          // For END_USER, only show the 4 basic metrics that match the UI
          if (userRole === 'END_USER') {
            const openTickets = (statusBreakdown['NEW'] || 0) + (statusBreakdown['OPEN'] || 0) + (statusBreakdown['IN_PROGRESS'] || 0);
            const resolvedTickets = statusBreakdown['RESOLVED'] || 0;
            const closedTickets = statusBreakdown['CLOSED'] || 0;

            // Single sheet with only the 4 metrics shown in the UI
            const endUserData = [
              { Metric: 'Total Tickets', Value: totalTickets },
              { Metric: 'Open Tickets', Value: openTickets },
              { Metric: 'Resolved Tickets', Value: resolvedTickets },
              { Metric: 'Closed Tickets', Value: closedTickets },
            ];

            const endUserSheet = XLSX.utils.json_to_sheet(endUserData);
            XLSX.utils.book_append_sheet(workbook, endUserSheet, 'My Ticket Summary');
          } else {
            // For Support Staff and Managers, show detailed breakdowns
            const priorityBreakdown = report.data.reduce(
              (acc: Record<string, number>, ticket: Record<string, unknown>) => {
                const priority = ticket.priority as string;
                acc[priority] = (acc[priority] || 0) + 1;
                return acc;
              },
              {}
            );

            const categoryBreakdown = report.data.reduce(
              (acc: Record<string, number>, ticket: Record<string, unknown>) => {
                const category = ticket.category as string;
                acc[category] = (acc[category] || 0) + 1;
                return acc;
              },
              {}
            );

            const impactBreakdown = report.data.reduce(
              (acc: Record<string, number>, ticket: Record<string, unknown>) => {
                const impact =
                  (ticket as { impact?: string }).impact || 'UNKNOWN';
                acc[impact] = (acc[impact] || 0) + 1;
                return acc;
              },
              {}
            );

            // Calculate SLA metrics
            const openTickets = statusBreakdown['OPEN'] || 0;
            const inProgressTickets = statusBreakdown['IN_PROGRESS'] || 0;
            const resolvedTickets = statusBreakdown['RESOLVED'] || 0;
            const closedTickets = statusBreakdown['CLOSED'] || 0;
            const overdueTickets = report.data.filter(
              (ticket: Record<string, unknown>) => {
                if (!ticket.dueDate) return false;
                return (
                  new Date(ticket.dueDate as string) < new Date() &&
                  !['RESOLVED', 'CLOSED'].includes(ticket.status as string)
                );
              }
            ).length;

            const slaBreachedTickets = report.data.filter(
              (ticket: Record<string, unknown>) => {
                if (!ticket.dueDate || !ticket.closedAt) return false;
                return (
                  new Date(ticket.closedAt as string) >
                  new Date(ticket.dueDate as string)
                );
              }
            ).length;

            // Sheet 1: Summary Cards
            const summaryCardsData = [
              { Metric: 'Total Tickets', Value: totalTickets },
              { Metric: 'Open Tickets', Value: openTickets },
              { Metric: 'In Progress', Value: inProgressTickets },
              { Metric: 'Resolved', Value: resolvedTickets },
              { Metric: 'Closed', Value: closedTickets },
              { Metric: 'Overdue Tickets', Value: overdueTickets },
              {
                Metric: 'Critical Priority',
                Value: priorityBreakdown['CRITICAL'] || 0,
              },
              { Metric: 'High Priority', Value: priorityBreakdown['HIGH'] || 0 },
              {
                Metric: 'Medium Priority',
                Value: priorityBreakdown['MEDIUM'] || 0,
              },
              { Metric: 'Low Priority', Value: priorityBreakdown['LOW'] || 0 },
              { Metric: 'Major Impact', Value: impactBreakdown['MAJOR'] || 0 },
            ];

            const summaryCardsSheet = XLSX.utils.json_to_sheet(summaryCardsData);
            XLSX.utils.book_append_sheet(
              workbook,
              summaryCardsSheet,
              'Summary Cards'
            );

            // Sheet 2: SLA Performance
            const slaPerformanceData = [
              {
                Metric: 'Response Time (Last 30 days)',
                Value: '85%',
                Status: 'Within SLA',
              },
              {
                Metric: 'Resolution Time (Last 30 days)',
                Value: '78%',
                Status: 'Within SLA',
              },
              {
                Metric: 'Customer Satisfaction',
                Value: '4.2/5.0',
                Status: 'Good',
              },
              {
                Metric: 'SLA Compliance Rate',
                Value: `${Math.round(((totalTickets - slaBreachedTickets) / totalTickets) * 100)}%`,
                Status: 'Compliant',
              },
            ];
            // Sheet 3: Tickets by Category
            const categoryData = Object.entries(categoryBreakdown).map(
              ([category, count]) => ({
                Category: category,
                Count: count,
                Percentage: `${((count / totalTickets) * 100).toFixed(1)}%`,
              })
            );
            const categorySheet = XLSX.utils.json_to_sheet(categoryData);
            XLSX.utils.book_append_sheet(
              workbook,
              categorySheet,
              'Tickets by Category'
            );

            // Sheet 4: Tickets by Status
            const statusData = Object.entries(statusBreakdown).map(
              ([status, count]) => ({
                Status: status,
                Count: count,
                Percentage: `${((count / totalTickets) * 100).toFixed(1)}%`,
              })
            );
            const statusSheet = XLSX.utils.json_to_sheet(statusData);
            XLSX.utils.book_append_sheet(
              workbook,
              statusSheet,
              'Tickets by Status'
            );

            // Sheet 5: Tickets by Impact
            const impactData = Object.entries(impactBreakdown).map(
              ([impact, count]) => ({
                Impact: impact,
                Count: count,
                Percentage: `${((count / totalTickets) * 100).toFixed(1)}%`,
              })
            );
            const impactSheet = XLSX.utils.json_to_sheet(impactData);
            XLSX.utils.book_append_sheet(
              workbook,
              impactSheet,
              'Tickets by Impact'
            );

            // Sheet 6: Tickets by Priority
            const priorityData = Object.entries(priorityBreakdown).map(
              ([priority, count]) => ({
                Priority: priority,
                Count: count,
                Percentage: `${((count / totalTickets) * 100).toFixed(1)}%`,
              })
            );
            const prioritySheet = XLSX.utils.json_to_sheet(priorityData);
            XLSX.utils.book_append_sheet(
              workbook,
              prioritySheet,
              'Tickets by Priority'
            );
          }

          content = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        }

        case 'pdf': {
          // Create proper PDF
          const doc = new jsPDF();

          // Get user role from filters to determine export structure
          const userRole = (body.filters as { userRole?: string })?.userRole;

          // Add title
          doc.setFontSize(16);
          doc.text(userRole === 'END_USER' ? 'MY TICKET SUMMARY' : 'TICKET REPORT', 20, 20);

          // Add generation info
          doc.setFontSize(10);
          doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
          doc.text(`Total Tickets: ${report.data.length}`, 20, 35);

          if (userRole === 'END_USER') {
            // For end users, show only the 4 metrics in a simple format
            const statusBreakdown = report.data.reduce(
              (acc: Record<string, number>, ticket: Record<string, unknown>) => {
                const status = ticket.status as string;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              },
              {}
            );

            const openTickets = (statusBreakdown['NEW'] || 0) + (statusBreakdown['OPEN'] || 0) + (statusBreakdown['IN_PROGRESS'] || 0);
            const resolvedTickets = statusBreakdown['RESOLVED'] || 0;
            const closedTickets = statusBreakdown['CLOSED'] || 0;

            // Add summary metrics
            doc.setFontSize(12);
            doc.text('Summary Metrics:', 20, 50);
            
            doc.setFontSize(10);
            doc.text(`Total Tickets: ${report.data.length}`, 20, 65);
            doc.text(`Open Tickets: ${openTickets}`, 20, 75);
            doc.text(`Resolved Tickets: ${resolvedTickets}`, 20, 85);
            doc.text(`Closed Tickets: ${closedTickets}`, 20, 95);
          } else {
            // For Support Staff and Managers, show detailed table
            // Add table headers
            doc.setFontSize(8);
            let yPosition = 50;
            const colWidths = [25, 40, 20, 20, 30, 30, 20, 20];
            const headers = [
              'Ticket #',
              'Title',
              'Status',
              'Priority',
              'Requester',
              'Assigned To',
              'Category',
              'Created',
            ];

            // Draw table headers
            let xPosition = 20;
            headers.forEach((header, index) => {
              doc.rect(xPosition, yPosition - 5, colWidths[index], 8);
              doc.text(header, xPosition + 2, yPosition);
              xPosition += colWidths[index];
            });

            yPosition += 10;

            // Add ticket data
            report.data.forEach((ticket: Record<string, unknown>) => {
              // Check if we need a new page
              if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
              }

              xPosition = 20;
              const rowData = [
                ticket.ticketNumber,
                (ticket.title as string).length > 30
                  ? (ticket.title as string).substring(0, 30) + '...'
                  : ticket.title,
                ticket.status,
                ticket.priority,
                (ticket.requester as string).length > 20
                  ? (ticket.requester as string).substring(0, 20) + '...'
                  : ticket.requester,
                (ticket.assignedTo as string).length > 20
                  ? (ticket.assignedTo as string).substring(0, 20) + '...'
                  : ticket.assignedTo,
                ticket.category,
                new Date(ticket.createdAt as string).toLocaleDateString(),
              ];

              rowData.forEach((cell, cellIndex) => {
                doc.rect(xPosition, yPosition - 5, colWidths[cellIndex], 8);
                doc.text(cell.toString(), xPosition + 2, yPosition);
                xPosition += colWidths[cellIndex];
              });

              yPosition += 10;
            });
          }

          content = Buffer.from(doc.output('arraybuffer'));
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        }

        default:
          throw new Error(`Unsupported export format: ${body.format}`);
      }

      // Get user role from request (we'll need to pass this from frontend)
      const userRole =
        (body.filters as { userRole?: string })?.userRole || 'USER';
      // Debug logging removed for production
      const filename = `${userRole}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      // Set response headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Content-Length', content.length);

      // Send the file content
      res.end(content);
    } catch (error) {
      this.logger.error('Tickets export from POST error:', error);
      throw error;
    }
  }

  private async exportAdminReport(
    data: AdminReportExportData,
    res: Response
  ): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Cards Sheet
      if (data.summaryCards) {
        const summarySheet = XLSX.utils.json_to_sheet(
          data.summaryCards.map(card => ({
            Metric: card.title,
            Value: card.value,
          }))
        );
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Cards');
      }

      // Users by Role Sheet
      if (data.usersByRole) {
        const roleSheet = XLSX.utils.json_to_sheet(
          data.usersByRole.map(item => ({
            Role: item.role.replace('_', ' '),
            Count: item.count,
          }))
        );
        XLSX.utils.book_append_sheet(workbook, roleSheet, 'Users by Role');
      }

      // Users by Registration Period Sheet
      if (data.usersByRegistrationPeriod) {
        const registrationSheet = XLSX.utils.json_to_sheet(
          data.usersByRegistrationPeriod.map(item => ({
            'Registration Period': item.monthYear,
            'New Users': item.count,
          }))
        );
        XLSX.utils.book_append_sheet(
          workbook,
          registrationSheet,
          'Registration Trends'
        );
      }

      // Users by Status Sheet
      if (data.usersByStatus) {
        const statusSheet = XLSX.utils.json_to_sheet(
          data.usersByStatus.map(item => ({
            Status: item.status,
            Count: item.count,
          }))
        );
        XLSX.utils.book_append_sheet(workbook, statusSheet, 'Users by Status');
      }

      // Tickets by Priority Sheet
      if (data.ticketsByPriority) {
        const prioritySheet = XLSX.utils.json_to_sheet(
          data.ticketsByPriority.map(item => ({
            Priority: item.priority,
            Count: item.count,
          }))
        );
        XLSX.utils.book_append_sheet(
          workbook,
          prioritySheet,
          'Tickets by Priority'
        );
      }

      // Tickets by Category Sheet
      if (data.ticketsByCategory) {
        const categorySheet = XLSX.utils.json_to_sheet(
          data.ticketsByCategory.map(item => ({
            Category: item.category,
            Count: item.count,
          }))
        );
        XLSX.utils.book_append_sheet(
          workbook,
          categorySheet,
          'Tickets by Category'
        );
      }

      // Login Activity Sheet
      if (data.loginActivity) {
        const loginSheet = XLSX.utils.json_to_sheet(
          data.loginActivity.map(item => ({
            Metric: item.metric,
            Count: item.count,
            Status: item.status,
          }))
        );
        XLSX.utils.book_append_sheet(workbook, loginSheet, 'Login Activity');
      }

      // Audit Trail Sheet
      if (data.auditTrail) {
        const auditSheet = XLSX.utils.json_to_sheet(
          data.auditTrail.map(item => ({
            'Activity Type': item.activityType,
            Count: item.count,
            'Last Activity': item.lastActivity,
          }))
        );
        XLSX.utils.book_append_sheet(workbook, auditSheet, 'Audit Trail');
      }

      const content = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });
      const mimeType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const filename = `ADMIN-report-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Set response headers for file download
      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Content-Length', content.length);

      // Send the file content
      res.end(content);
    } catch (error) {
      this.logger.error('Admin report export error:', error);
      throw error;
    }
  }
}

// Types for admin structured export payload
interface SummaryCardItem {
  title: string;
  value: number;
}

interface RoleCountItem {
  role: string;
  count: number;
}

interface RegistrationPeriodItem {
  monthYear: string;
  count: number;
}

interface StatusCountItem {
  status: string;
  count: number;
}

interface PriorityCountItem {
  priority: string;
  count: number;
}

interface CategoryCountItem {
  category: string;
  count: number;
}

interface LoginActivityItem {
  metric: string;
  count: number;
  status: string;
}

interface AuditTrailItem {
  activityType: string;
  count: number;
  lastActivity: string;
}

interface AdminReportExportData {
  summaryCards?: SummaryCardItem[];
  usersByRole?: RoleCountItem[];
  usersByRegistrationPeriod?: RegistrationPeriodItem[];
  usersByStatus?: StatusCountItem[];
  ticketsByPriority?: PriorityCountItem[];
  ticketsByCategory?: CategoryCountItem[];
  loginActivity?: LoginActivityItem[];
  auditTrail?: AuditTrailItem[];
}
