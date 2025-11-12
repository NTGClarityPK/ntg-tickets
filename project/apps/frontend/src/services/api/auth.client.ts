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
    httpClient.patch<ApiResponse<User>>(`/auth/users/${userId}/role`, { role }),

  switchRole: (data: { activeRole: string }) =>
    httpClient.post<ApiResponse<SwitchRoleResponse>>('/auth/switch-role', data),
};


