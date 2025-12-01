import { httpClient } from './http-client';
import { ApiResponse } from '../../types/unified';

export interface ThemeSettings {
  id: string;
  primaryColor: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface PublicThemeSettings {
  id: string;
  primaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  logoData?: string;
  faviconData?: string;
  isActive: boolean;
}

export interface UpdateThemeSettingsInput {
  primaryColor?: string | null;
  logoUrl?: string | null;
  logoData?: string | null;
}

export interface UpdateThemeSettingsResponse {
  id: string;
  primaryColor: string;
  logoUrl?: string;
  logoData?: string;
  isActive: boolean;
}

export const themeSettingsClient = {
  getThemeSettings: () =>
    httpClient.get<ApiResponse<ThemeSettings>>('/admin/theme-settings'),

  getPublicThemeSettings: () =>
    httpClient.get<ApiResponse<PublicThemeSettings>>(
      '/admin/public-theme-settings'
    ),

  updateThemeSettings: (data: UpdateThemeSettingsInput) =>
    httpClient.patch<ApiResponse<UpdateThemeSettingsResponse>>(
      '/admin/theme-settings',
      data
    ),
};


