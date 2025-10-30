import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../lib/apiClient';
import { AuditLogsFilters } from '../types/unified';

export function useAuditLogs(
  filters: AuditLogsFilters & { page: number; limit: number }
) {
  return useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const response = await auditLogsApi.getAuditLogs(filters);
      return response.data;
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
      const response = await auditLogsApi.getTicketAuditLogs(
        ticketId,
        page,
        limit
      );
      return response.data;
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
      const response = await auditLogsApi.getSystemAuditLogs(
        page,
        limit,
        dateFrom,
        dateTo
      );
      return response.data;
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
      const response = await auditLogsApi.getUserActivityLogs(
        userId,
        page,
        limit,
        dateFrom,
        dateTo
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useAuditLogStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['auditLogStats', dateFrom, dateTo],
    queryFn: async () => {
      const response = await auditLogsApi.getAuditLogStats(dateFrom, dateTo);
      return response.data;
    },
  });
}
