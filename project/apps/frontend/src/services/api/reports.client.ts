import { httpClient } from './http-client';
import {
  ApiResponse,
  ReportFilters,
  ReportData,
  User,
  SlaMetrics,
  SystemMetrics,
  UserDistribution,
} from '../../types/unified';

export interface UserReportResponse {
  users: User[];
  stats: { total: number; active: number; inactive: number };
}

export interface SlaReportResponse {
  slaMetrics: SlaMetrics;
  compliance: number;
  violations: number;
}

export const reportsClient = {
  getTicketReport: (filters?: ReportFilters) =>
    httpClient.get<ApiResponse<ReportData>>('/reports/tickets', {
      params: filters,
    }),

  getUserReport: (filters?: ReportFilters) =>
    httpClient.get<ApiResponse<UserReportResponse>>('/reports/users', {
      params: filters,
    }),

  getSlaReport: (filters?: ReportFilters) =>
    httpClient.get<ApiResponse<SlaReportResponse>>('/reports/sla', {
      params: filters,
    }),

  exportReport: (
    type: string,
    format: string,
    filters?: ReportFilters,
    data?: unknown
  ) =>
    httpClient.post(
      `/reports/export/${type}`,
      {
        format,
        filters,
        data,
      },
      {
        responseType: 'blob',
      }
    ),

  exportReports: (filters?: ReportFilters) =>
    httpClient.post<Blob>('/reports/export', filters, {
      responseType: 'blob',
    }),

  getSystemMetrics: () =>
    httpClient.get<ApiResponse<SystemMetrics>>('/reports/system-metrics'),

  getUserDistribution: () =>
    httpClient.get<ApiResponse<UserDistribution[]>>(
      '/reports/user-distribution'
    ),
};


