import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from '../lib/apiClient';

export function useUsers(filters?: UserFilters) {
  return useQuery<User[]>({
    queryKey: ['users', filters],
    queryFn: async (): Promise<User[]> => {
      try {
        const response = await userApi.getUsers(filters);
        // Extract users from response, exactly like useTickets pattern
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else {
          return [];
        }
      } catch (error) {
        // Handle error fetching users
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await userApi.getUser(id);
      return response.data.data as User;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await userApi.createUser(data);
      return response.data.data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await userApi.updateUser(id, data);
      return response.data.data as User;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await userApi.deleteUser(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useSupportStaff() {
  return useQuery({
    queryKey: ['support-staff'],
    queryFn: async () => {
      const response = await userApi.getSupportStaff();
      return response.data.data as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
