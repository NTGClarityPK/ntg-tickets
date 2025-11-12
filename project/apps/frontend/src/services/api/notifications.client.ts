import { httpClient } from './http-client';
import { ApiResponse } from '../../types/unified';

export interface Notification {
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
}

export const notificationsClient = {
  getNotifications: () =>
    httpClient.get<ApiResponse<Notification[]>>('/notifications'),

  markAsRead: (id: string) =>
    httpClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => httpClient.patch('/notifications/read-all'),

  deleteNotification: (id: string) =>
    httpClient.delete(`/notifications/${id}`),

  sendBulkNotification: (ticketIds: string[], message: string) =>
    httpClient.post<ApiResponse<{ sent: number; failed: number }>>(
      '/notifications/bulk',
      {
        ticketIds,
        message,
      }
    ),
};


