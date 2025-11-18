'use client';

import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconWifiOff } from '@tabler/icons-react';
import { UI_CONFIG } from '../../lib/constants';
import { useDynamicTheme } from '@ntg/shared-library';

export const GlobalErrorHandler = () => {
  const { primaryLight, primaryDark } = useDynamicTheme();
  
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle unhandled promise rejection

      // Show user-friendly notification
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: primaryDark,
        icon: <IconAlertTriangle size={16} />,
        autoClose: 5000,
      });

      // Prevent the default browser behavior
      event.preventDefault();
    };

    // Handle global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      // Handle global error

      // Only show notification for non-network errors to avoid spam
      if (
        !event.message?.includes('fetch') &&
        !event.message?.includes('network')
      ) {
        notifications.show({
          title: 'Error',
          message: 'An unexpected error occurred. Please refresh the page.',
          color: primaryDark,
          icon: <IconAlertTriangle size={16} />,
          autoClose: UI_CONFIG.TOAST_DURATION.ERROR,
        });
      }
    };

    // Handle network status changes
    const handleOnline = () => {
      notifications.show({
        title: 'Connection Restored',
        message: 'You are back online.',
        color: primaryLight,
        autoClose: UI_CONFIG.TOAST_DURATION.SUCCESS,
      });
    };

    const handleOffline = () => {
      notifications.show({
        title: 'Connection Lost',
        message: 'You are currently offline. Some features may not work.',
        color: 'orange',
        icon: <IconWifiOff size={16} />,
        autoClose: false,
      });
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('error', handleError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [primaryLight, primaryDark]);

  return null;
};
