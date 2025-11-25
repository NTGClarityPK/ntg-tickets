import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotificationsStore } from '../stores/useNotificationsStore';
import { notificationsApi } from '../lib/apiClient';
import { NotificationType } from '../types/notification';
import { useAuthUser } from '../stores/useAuthStore';

/**
 * Hook to sync the notifications store with API data
 * This ensures the store is initialized with existing notifications
 * and stays in sync with the backend
 */
export function useNotificationsStoreSync() {
  const user = useAuthUser();
  const { syncWithApi, setLoading } = useNotificationsStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      // Check if user is authenticated via Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && user && !hasInitialized) {
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
          setHasInitialized(true);
        } catch (error) {
          // Silently handle error to avoid breaking the app
          // In production, consider using a proper logging service
        } finally {
          setLoading(false);
        }
      }
    };

    initializeNotifications();
  }, [user, hasInitialized, syncWithApi, setLoading]);

  // Note: Periodic refresh is handled by React Query in useNotifications hook
  // No need for duplicate polling here
}
