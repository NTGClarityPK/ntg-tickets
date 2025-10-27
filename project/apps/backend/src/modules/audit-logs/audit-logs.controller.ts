import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'ticketId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('ticketId') ticketId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const result = await this.auditLogsService.getAuditLogs({
      page,
      limit,
      action,
      userId,
      ticketId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });

    return {
      data: result.data,
      pagination: result.pagination,
      message: 'Audit logs retrieved successfully',
    };
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Get audit logs for a specific ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket audit logs retrieved successfully',
  })
  async getTicketAuditLogs(
    @Param('ticketId') ticketId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const result = await this.auditLogsService.getTicketAuditLogs(
      ticketId,
      page,
      limit
    );

    return {
      data: result.data,
      pagination: result.pagination,
      message: 'Ticket audit logs retrieved successfully',
    };
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system-wide audit logs (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System audit logs retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getSystemAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const result = await this.auditLogsService.getSystemAuditLogs(
      page,
      limit,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );

    return {
      data: result.data,
      pagination: result.pagination,
      message: 'System audit logs retrieved successfully',
    };
  }

  @Get('user/:userId/activity')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({
    status: 200,
    description: 'User activity logs retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getUserActivityLogs(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const result = await this.auditLogsService.getUserActivityLogs(
      userId,
      page,
      limit,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );

    return {
      data: result.data,
      pagination: result.pagination,
      message: 'User activity logs retrieved successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({
    status: 200,
    description: 'Audit log statistics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getAuditLogStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const stats = await this.auditLogsService.getAuditLogStats(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );

    return {
      data: stats,
      message: 'Audit log statistics retrieved successfully',
    };
  }
}
