import { httpClient } from './http-client';
import {
  ApiResponse,
  SystemSettings,
  SystemStats,
  SystemHealth,
} from '../../types/unified';

export interface PublicSettings {
  siteName: string;
  siteDescription: string;
  timezone: string;
  language: string;
  dateFormat: string;
}

export const systemClient = {
  getSettings: () =>
    httpClient.get<ApiResponse<SystemSettings>>('/admin/config'),

  getPublicSettings: () =>
    httpClient.get<ApiResponse<PublicSettings>>('/admin/public-config'),

  updateSettings: (data: Partial<SystemSettings>) =>
    httpClient.patch<ApiResponse<SystemSettings>>('/admin/config', data),

  getSystemStats: () =>
    httpClient.get<ApiResponse<SystemStats>>('/admin/stats'),

  getSystemHealth: () =>
    httpClient.get<ApiResponse<SystemHealth>>('/admin/health'),
};


