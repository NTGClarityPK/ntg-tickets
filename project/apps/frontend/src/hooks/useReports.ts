import { useQuery, useMutation } from '@tanstack/react-query';
import {
  reportsApi,
  ReportFilters,
  ReportData,
  SystemMetrics,
  UserDistribution,
} from '../lib/apiClient';

export function useTicketReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['ticket-report', filters],
    queryFn: async () => {
      const response = await reportsApi.getTicketReport(filters);
      return response.data.data as ReportData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['user-report', filters],
    queryFn: async () => {
      const response = await reportsApi.getUserReport(filters);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const response = await reportsApi.getSystemMetrics();
      return response.data.data as SystemMetrics;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUserDistribution() {
  return useQuery({
    queryKey: ['user-distribution'],
    queryFn: async () => {
      const response = await reportsApi.getUserDistribution();
      return response.data.data as UserDistribution[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      type,
      format,
      filters,
      data,
    }: {
      type: string;
      format: string;
      filters?: ReportFilters;
      data?: unknown;
    }) => {
      const response = await reportsApi.exportReport(
        type,
        format,
        filters,
        data
      );
      return response.data as Blob;
    },
  });
}

// useExportReports removed - use useExportReport with explicit type parameter instead
// This consolidates export functionality and matches backend endpoint structure
