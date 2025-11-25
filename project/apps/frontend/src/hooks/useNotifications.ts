import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/apiClient';
import { useNotificationsStore } from '../stores/useNotificationsStore';
import { NotificationType } from '../types/notification';
import { useEffect } from 'react';

export function useNotifications() {
  const { syncWithApi } = useNotificationsStore();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications();
      return response.data.data as Array<{
        id: string;
        userId: string;
        ticketId?: string;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: string;
        ticket?: {
          id: string;
          ticketNumber: string;
          title: string;
        };
      }>;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Sync fetched notifications to Zustand store
  useEffect(() => {
    if (query.data) {
      const apiNotifications = query.data.map((apiNotification) => ({
        id: apiNotification.id,
        userId: apiNotification.userId,
        ticketId: apiNotification.ticketId,
        type: apiNotification.type as NotificationType,
        title: apiNotification.title || apiNotification.message,
        message: apiNotification.message,
        isRead: apiNotification.isRead,
        createdAt: new Date(apiNotification.createdAt),
        ticket: apiNotification.ticket,
      }));

      syncWithApi(apiNotifications);
    }
  }, [query.data, syncWithApi]);

  return query;
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
