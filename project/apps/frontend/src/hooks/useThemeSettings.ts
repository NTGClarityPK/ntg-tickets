import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { themeSettingsApi} from '../lib/apiClient';

export interface ThemeSettings {
  id?: string;
  primaryColor?: string;
  logoUrl?: string;
  logoData?: string;
  isActive?: boolean;
}

export function useThemeSettings(): UseQueryResult<ThemeSettings | null, Error> {
  return useQuery({
    queryKey: ['theme-settings'],
    queryFn: async (): Promise<ThemeSettings | null> => {
      try {
        const response = await themeSettingsApi.getThemeSettings();
        const themeSettings = response.data.data as ThemeSettings;
        
        // Cache theme settings in localStorage for persistence across sessions
        if (themeSettings) {
          localStorage.setItem('theme-settings', JSON.stringify(themeSettings));
        }
        
        return themeSettings;
      } catch (error) {
        // If admin endpoint fails, return null to use defaults
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure to avoid blocking the app
  });
}

// Hook for getting theme settings that works for all users
export function usePublicThemeSettings(): UseQueryResult<ThemeSettings | null, Error> {
  return useQuery({
    queryKey: ['public-theme-settings'],
    queryFn: async (): Promise<ThemeSettings | null> => {
      try {
        const response = await themeSettingsApi.getPublicThemeSettings();
        const themeSettings = response.data.data;
        
        // Cache theme settings in localStorage for persistence across sessions
        if (themeSettings) {
          localStorage.setItem('theme-settings', JSON.stringify(themeSettings));
        }
        
        return themeSettings;
      } catch (error) {
        // Fallback to cached theme settings if API fails
        const cachedSettings = localStorage.getItem('theme-settings');
        if (cachedSettings) {
          try {
            return JSON.parse(cachedSettings);
          } catch (parseError) {
          }
        }
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
