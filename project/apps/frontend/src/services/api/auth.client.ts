import { httpClient } from './http-client';
import { ApiResponse, User } from '../../types/unified';

export interface LoginCredentials {
  email: string;
  password: string;
  activeRole?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface SwitchRoleResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    activeRole: string;
  };
}

export const authClient = {
  login: (credentials: LoginCredentials) =>
    httpClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials),

  getCurrentUser: () => httpClient.get<ApiResponse<User>>('/auth/me'),

  logout: () => httpClient.post<ApiResponse<void>>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    httpClient.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  updateUserRole: (userId: string, role: string) =>
    httpClient.post<ApiResponse<User>>(`/auth/users/${userId}/role`, { role }),

  switchRole: (data: { activeRole: string; refresh_token?: string }) => {
    // Get refresh token from localStorage if not provided
    const refreshToken = data.refresh_token || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
    
    if (!refreshToken) {
      throw new Error('Refresh token is required for role switching. Please log in again.');
    }
    
    return httpClient.post<ApiResponse<SwitchRoleResponse>>('/auth/switch-role', {
      activeRole: data.activeRole,
      refresh_token: refreshToken,
    });
  },

  forgotPassword: (email: string) =>
    httpClient.post<ApiResponse<{ message: string }>>('/auth/supabase/reset-password', {
      email,
    }),
};


