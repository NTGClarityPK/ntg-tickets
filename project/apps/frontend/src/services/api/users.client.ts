import { httpClient } from './http-client';
import {
  ApiResponse,
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from '../../types/unified';

export interface PaginatedUsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersClient = {
  getUsers: (filters?: UserFilters) =>
    httpClient.get<ApiResponse<PaginatedUsersResponse>>('/users', {
      params: filters,
    }),

  getUser: (id: string) => httpClient.get<ApiResponse<User>>(`/users/${id}`),

  createUser: (data: CreateUserInput) =>
    httpClient.post<ApiResponse<User>>('/users', data),

  updateUser: (id: string, data: UpdateUserInput) =>
    httpClient.patch<ApiResponse<User>>(`/users/${id}`, data),

  deleteUser: (id: string) => httpClient.delete(`/users/${id}`),

  getSupportStaff: () =>
    httpClient.get<ApiResponse<User[]>>('/users/support-staff'),
};


