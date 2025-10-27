import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, User } from '../lib/apiClient';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data.data as User;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await authApi.logout();
      return response.data.data;
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await authApi.updateUserRole(userId, role);
      return response.data.data as User;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['support-staff'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}
