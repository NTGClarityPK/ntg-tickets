import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../lib/apiClient';
import { useSession } from 'next-auth/react';

export function usePublicSettings() {
  const { status } = useSession();

  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await systemApi.getPublicSettings();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: status === 'authenticated', // Only fetch when user is authenticated
  });
}
