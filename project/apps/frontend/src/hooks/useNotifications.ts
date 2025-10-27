import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/apiClient';
import { useNotificationsStore } from '../stores/useNotificationsStore';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications();
      return response.data.data as Array<{
        id: string;
        message: string;
        type: string;
        isRead: boolean;
        createdAt: string;
      }>;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { markAsRead } = useNotificationsStore();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markAsRead(id);
    },
    onSuccess: (_, id) => {
      // Update Zustand store immediately
      markAsRead(id);
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotificationsStore();

  return useMutation({
    mutationFn: async () => {
      await notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      // Update Zustand store immediately
      markAllAsRead();
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { removeNotification } = useNotificationsStore();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.deleteNotification(id);
    },
    onSuccess: (_, id) => {
      // Update Zustand store immediately
      removeNotification(id);
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
    },
  });
}
