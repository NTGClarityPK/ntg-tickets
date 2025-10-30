import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotificationsStore } from '../stores/useNotificationsStore';
import { notificationsApi } from '../lib/apiClient';
import { NotificationType } from '../types/notification';
import { TIMING_CONFIG } from '../lib/constants';

/**
 * Hook to sync the notifications store with API data
 * This ensures the store is initialized with existing notifications
 * and stays in sync with the backend
 */
export function useNotificationsStoreSync() {
  const { data: session, status } = useSession();
  const { syncWithApi, setLoading } = useNotificationsStore();

  useEffect(() => {
    const initializeNotifications = async () => {
      if (status === 'authenticated' && session?.accessToken) {
        try {
          setLoading(true);

          // Fetch notifications from API
          const response = await notificationsApi.getNotifications();

          // Transform API response to match store format
          const apiNotifications = response.data.data.map(
            (apiNotification: {
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
            }) => ({
              id: apiNotification.id,
              userId: apiNotification.userId,
              ticketId: apiNotification.ticketId,
              type: apiNotification.type as NotificationType,
              title: apiNotification.title,
              message: apiNotification.message,
              isRead: apiNotification.isRead,
              createdAt: new Date(apiNotification.createdAt),
              ticket: apiNotification.ticket,
            })
          );

          // Sync notifications with store
          syncWithApi(apiNotifications);
        } catch (error) {
          // Silently handle error to avoid breaking the app
          // In production, consider using a proper logging service
        } finally {
          setLoading(false);
        }
      }
    };

    initializeNotifications();
  }, [status, session?.accessToken, syncWithApi, setLoading]);

  // Optional: Set up periodic refresh to keep data in sync
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      const interval = setInterval(async () => {
        try {
          const response = await notificationsApi.getNotifications();
          const apiNotifications = response.data.data.map(
            (apiNotification: {
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
            }) => ({
              id: apiNotification.id,
              userId: apiNotification.userId,
              ticketId: apiNotification.ticketId,
              type: apiNotification.type as NotificationType,
              title: apiNotification.title,
              message: apiNotification.message,
              isRead: apiNotification.isRead,
              createdAt: new Date(apiNotification.createdAt),
              ticket: apiNotification.ticket,
            })
          );

          syncWithApi(apiNotifications);
        } catch (error) {
          // Silently handle error to avoid breaking the app
          // In production, consider using a proper logging service
        }
      }, TIMING_CONFIG.STORE_SYNC_INTERVAL); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [status, session?.accessToken, syncWithApi]);
}
