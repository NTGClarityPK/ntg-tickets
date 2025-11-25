import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../lib/apiClient';
import { useAuthStore } from '../stores/useAuthStore';

export function usePublicSettings() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await systemApi.getPublicSettings();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });
}
