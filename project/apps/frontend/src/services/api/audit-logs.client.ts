import { httpClient } from './http-client';
import { ApiResponse, AuditLog, AuditLogsFilters } from '../../types/unified';

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByResource: Record<string, number>;
  logsByUser: Array<{ userId: string; userName: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

export const auditLogsClient = {
  getAuditLogs: (filters?: AuditLogsFilters) =>
    httpClient.get<ApiResponse<PaginatedAuditLogsResponse>>('/audit-logs', {
      params: filters,
    }),

  getTicketAuditLogs: (ticketId: string, page?: number, limit?: number) =>
    httpClient.get<ApiResponse<PaginatedAuditLogsResponse>>(
      `/audit-logs/ticket/${ticketId}`,
      { params: { page, limit } }
    ),

  getSystemAuditLogs: (
    page?: number,
    limit?: number,
    dateFrom?: string,
    dateTo?: string
  ) =>
    httpClient.get<ApiResponse<PaginatedAuditLogsResponse>>(
      '/audit-logs/system',
      { params: { page, limit, dateFrom, dateTo } }
    ),

  getUserActivityLogs: (
    userId: string,
    page?: number,
    limit?: number,
    dateFrom?: string,
    dateTo?: string
  ) =>
    httpClient.get<ApiResponse<PaginatedAuditLogsResponse>>(
      `/audit-logs/user/${userId}/activity`,
      { params: { page, limit, dateFrom, dateTo } }
    ),

  getAuditLogStats: (dateFrom?: string, dateTo?: string) =>
    httpClient.get<ApiResponse<AuditLogStats>>('/audit-logs/stats', {
      params: { dateFrom, dateTo },
    }),
};


