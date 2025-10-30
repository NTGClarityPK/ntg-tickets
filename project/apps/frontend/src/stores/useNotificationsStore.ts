import { create } from 'zustand';
import type { Notification } from '../types/notification';

// Notification settings interface
export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  notificationTypes: {
    ticketCreated: boolean;
    ticketAssigned: boolean;
    ticketStatusChanged: boolean;
    commentAdded: boolean;
    slaWarning: boolean;
    slaBreach: boolean;
    ticketDue: boolean;
    ticketEscalated: boolean;
    systemAnnouncement: boolean;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  updateUnreadCount: () => void;
  getRecentNotifications: (limit: number) => Notification[];
  addNotificationWithSettings: (
    notification: Notification,
    settings: NotificationSettings
  ) => void;
  getNotificationsByType: (type: string) => Notification[];
  getUnreadNotifications: () => Notification[];
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  syncWithApi: (apiNotifications: Notification[]) => void;
}

export const useNotificationsStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: notifications => {
    set({ notifications });
    set({ unreadCount: notifications.filter(n => !n.isRead).length });
  },
  addNotification: notification =>
    set(state => {
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.isRead).length,
      };
    }),
  markAsRead: id =>
    set(state => {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
    }),
  markAllAsRead: () =>
    set(state => ({
      notifications: state.notifications.map(notification => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    })),
  removeNotification: id =>
    set(state => {
      const updatedNotifications = state.notifications.filter(
        notification => notification.id !== id
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
    }),
  setLoading: isLoading => set({ isLoading }),
  updateUnreadCount: () => {
    const { notifications } = get();
    set({ unreadCount: notifications.filter(n => !n.isRead).length });
  },
  getRecentNotifications: limit => {
    const { notifications } = get();
    return notifications
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  },
  addNotificationWithSettings: (notification, settings) => {
    const { addNotification } = get();

    // Check if notification type is enabled
    const isNotificationTypeEnabled = (type: string): boolean => {
      switch (type) {
        case 'TICKET_CREATED':
          return settings.notificationTypes.ticketCreated;
        case 'TICKET_ASSIGNED':
          return settings.notificationTypes.ticketAssigned;
        case 'TICKET_STATUS_CHANGED':
          return settings.notificationTypes.ticketStatusChanged;
        case 'COMMENT_ADDED':
          return settings.notificationTypes.commentAdded;
        case 'SLA_WARNING':
          return settings.notificationTypes.slaWarning;
        case 'SLA_BREACH':
          return settings.notificationTypes.slaBreach;
        case 'TICKET_DUE':
          return settings.notificationTypes.ticketDue;
        case 'TICKET_ESCALATED':
          return settings.notificationTypes.ticketEscalated;
        case 'SYSTEM_ANNOUNCEMENT':
          return settings.notificationTypes.systemAnnouncement;
        default:
          return true; // Default to enabled for unknown types
      }
    };

    // Check if we're in quiet hours
    const isInQuietHours = (): boolean => {
      if (!settings.quietHours?.enabled) return false;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = settings.quietHours.start
        .split(':')
        .map(Number);
      const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      return currentTime >= startTime && currentTime <= endTime;
    };

    // Add to store if notification type is enabled
    if (isNotificationTypeEnabled(notification.type)) {
      addNotification(notification);
    }

    // Show push notification if enabled and not in quiet hours
    if (
      settings.pushNotifications &&
      !isInQuietHours() &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }

    // Note: Email and SMS notifications would be handled by the backend
    // based on the system settings
  },
  getNotificationsByType: (type: string) => {
    const { notifications } = get();
    return notifications.filter(notification => notification.type === type);
  },
  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notification => !notification.isRead);
  },
  clearAllNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
  updateNotification: (id: string, updates: Partial<Notification>) =>
    set(state => {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === id ? { ...notification, ...updates } : notification
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
    }),
  syncWithApi: (apiNotifications: Notification[]) =>
    set(state => {
      // Merge API notifications with existing store notifications
      // API notifications take precedence for read status and other updates
      const mergedNotifications = [...state.notifications];

      apiNotifications.forEach(apiNotification => {
        const existingIndex = mergedNotifications.findIndex(
          n => n.id === apiNotification.id
        );

        if (existingIndex >= 0) {
          // Update existing notification
          mergedNotifications[existingIndex] = apiNotification;
        } else {
          // Add new notification
          mergedNotifications.unshift(apiNotification);
        }
      });

      // Sort by creation date (newest first)
      const sortedNotifications = mergedNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        notifications: sortedNotifications,
        unreadCount: sortedNotifications.filter(n => !n.isRead).length,
      };
    }),
}));
