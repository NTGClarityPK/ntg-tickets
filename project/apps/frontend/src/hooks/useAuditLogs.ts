import { useQuery } from '@tanstack/react-query';
import { auditLogsClient } from '../services/api';
import { AuditLogsFilters, AuditLog } from '../types/unified';
import { normalizeListResponse, normalizeItemResponse } from '../services/api/response-normalizer';

export function useAuditLogs(
  filters: AuditLogsFilters & { page: number; limit: number }
) {
  return useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const response = await auditLogsClient.getAuditLogs(filters);
      return normalizeListResponse<AuditLog>(response.data);
    },
  });
}

export function useTicketAuditLogs(
  ticketId: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['ticketAuditLogs', ticketId, page, limit],
    queryFn: async () => {
      const response = await auditLogsClient.getTicketAuditLogs(
        ticketId,
        page,
        limit
      );
      return normalizeListResponse<AuditLog>(response.data);
    },
    enabled: !!ticketId,
  });
}

export function useSystemAuditLogs(
  page: number = 1,
  limit: number = 20,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: ['systemAuditLogs', page, limit, dateFrom, dateTo],
    queryFn: async () => {
      const response = await auditLogsClient.getSystemAuditLogs(
        page,
        limit,
        dateFrom,
        dateTo
      );
      return normalizeListResponse<AuditLog>(response.data);
    },
  });
}

export function useUserActivityLogs(
  userId: string,
  page: number = 1,
  limit: number = 20,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: ['userActivityLogs', userId, page, limit, dateFrom, dateTo],
    queryFn: async () => {
      const response = await auditLogsClient.getUserActivityLogs(
        userId,
        page,
        limit,
        dateFrom,
        dateTo
      );
      return normalizeListResponse<AuditLog>(response.data);
    },
    enabled: !!userId,
  });
}

export function useAuditLogStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['auditLogStats', dateFrom, dateTo],
    queryFn: async () => {
      const response = await auditLogsClient.getAuditLogStats(dateFrom, dateTo);
      return normalizeItemResponse(response.data);
    },
  });
}
