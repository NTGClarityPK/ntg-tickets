import { useQuery } from '@tanstack/react-query';
import { systemClient } from '../services/api';
import { SystemStats, SystemHealth } from '../types/unified';
import { normalizeItemResponse } from '../services/api/response-normalizer';

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const response = await systemClient.getSystemStats();
      return normalizeItemResponse<SystemStats>(response.data);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await systemClient.getSystemHealth();
      return normalizeItemResponse<SystemHealth>(response.data);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}
