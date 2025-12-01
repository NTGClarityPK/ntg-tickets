import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { themeSettingsApi} from '../lib/apiClient';
import { useAuthStore } from '../stores/useAuthStore';

export interface ThemeSettings {
  id?: string;
  primaryColor?: string;
  logoUrl?: string;
  logoData?: string;
  isActive?: boolean;
}

export function useThemeSettings(): UseQueryResult<ThemeSettings | null, Error> {
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  
  // Include user/tenant in query key so it refetches when user changes
  const tenantId = organization?.id || user?.id;
  
  return useQuery({
    queryKey: ['theme-settings', tenantId],
    queryFn: async (): Promise<ThemeSettings | null> => {
      try {
        const response = await themeSettingsApi.getThemeSettings();
        const themeSettings = response.data.data as ThemeSettings;
        
        // Don't cache in localStorage - always fetch from database to ensure
        // all users in the organization see the same theme
        return themeSettings;
      } catch (error) {
        // If admin endpoint fails, return null to use defaults
        return null;
      }
    },
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 1 * 60 * 1000, // 1 minute - shorter to get updates faster
    retry: false, // Don't retry on failure to avoid blocking the app
    refetchOnWindowFocus: true, // Refetch when switching tabs to get latest theme
  });
}

// Hook for getting theme settings that works for all users
export function usePublicThemeSettings(): UseQueryResult<ThemeSettings | null, Error> {
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  
  // Include user/tenant in query key so it refetches when user changes
  const tenantId = organization?.id || user?.id;
  
  return useQuery({
    queryKey: ['public-theme-settings', tenantId],
    queryFn: async (): Promise<ThemeSettings | null> => {
      try {
        const response = await themeSettingsApi.getPublicThemeSettings();
        const themeSettings = response.data.data;
        
        // Don't cache in localStorage - always fetch from database to ensure
        // all users in the organization see the same theme
        return themeSettings;
      } catch (error) {
        // Don't fallback to localStorage - return null to use defaults
        // This ensures all users always get the latest theme from the database
        return null;
      }
    },
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 1 * 60 * 1000, // 1 minute - shorter to get updates faster
    retry: false,
    refetchOnWindowFocus: true, // Refetch when switching tabs to get latest theme
  });
}
