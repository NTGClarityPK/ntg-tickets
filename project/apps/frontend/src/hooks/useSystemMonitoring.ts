import { useQuery } from '@tanstack/react-query';
import { systemApi, SystemStats, SystemHealth } from '../lib/apiClient';

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const response = await systemApi.getSystemStats();
      return response.data.data as SystemStats;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await systemApi.getSystemHealth();
      return response.data.data as SystemHealth;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}
