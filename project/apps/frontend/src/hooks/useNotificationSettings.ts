import { useSystemSettings } from './useSystemSettings';
import { useAuthStore } from '../stores/useAuthStore';
import { useEffect } from 'react';

export function useNotificationSettings() {
  const { user } = useAuthStore();
  const { data: settings } = useSystemSettings();

  // Only use system settings if user is admin, otherwise use defaults
  const isAdmin = user?.activeRole === 'ADMIN';
  const emailNotifications = isAdmin
    ? settings?.emailNotifications || false
    : true;
  const pushNotifications = isAdmin
    ? settings?.pushNotifications || false
    : true;
  const smsNotifications = isAdmin
    ? settings?.smsNotifications || false
    : false;
  const notificationFrequency = isAdmin
    ? settings?.notificationFrequency || 'immediate'
    : 'immediate';

  // Request notification permission if push notifications are enabled
  useEffect(() => {
    if (pushNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [pushNotifications]);

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!pushNotifications || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      return true;
    }

    return false;
  };

  const canShowPushNotification = () => {
    return (
      pushNotifications &&
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  };

  const getNotificationMessage = () => {
    const methods = [];
    if (emailNotifications) methods.push('email');
    if (pushNotifications) methods.push('push notifications');
    if (smsNotifications) methods.push('SMS');

    if (methods.length === 0) {
      return 'Notifications are disabled';
    }

    return `Notifications enabled via ${methods.join(', ')}`;
  };

  return {
    emailNotifications,
    pushNotifications,
    smsNotifications,
    notificationFrequency,
    showNotification,
    canShowPushNotification,
    getNotificationMessage,
  };
}
