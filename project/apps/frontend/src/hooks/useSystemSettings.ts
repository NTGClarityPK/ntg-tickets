import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi, SystemSettings } from '../lib/apiClient';
import { useAuthStore } from '../stores/useAuthStore';

export function useSystemSettings() {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await systemApi.getSettings();
      return response.data.data as SystemSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated && user?.activeRole === 'ADMIN', // Only fetch when user is authenticated and is admin
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const response = await systemApi.updateSettings(settings);
      return response.data.data as SystemSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}
