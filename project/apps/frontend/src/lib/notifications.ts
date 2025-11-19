import { notifications } from '@mantine/notifications';
import { UI_CONFIG } from './constants';

export interface NotificationOptions {
  title: string;
  message: string;
  color?:
    | 'red'
    | 'green'
    | 'blue'
    | 'yellow'
    | 'orange'
    | 'grape'
    | 'violet'
    | 'indigo'
    | 'cyan'
    | 'teal'
    | 'lime'
    | 'pink'
    | 'dynamic';
  autoClose?: number | false;
  icon?: React.ReactNode;
}

export const showNotification = (options: NotificationOptions) => {
  const { title, message, color = 'dynamic', autoClose, icon } = options;

  // Determine autoClose duration based on color if not specified
  let defaultAutoClose: number | false;
  if (autoClose !== undefined) {
    defaultAutoClose = autoClose;
  } else {
    switch (color) {
      case 'green':
        defaultAutoClose = UI_CONFIG.TOAST_DURATION.SUCCESS;
        break;
      case 'red':
        defaultAutoClose = UI_CONFIG.TOAST_DURATION.ERROR;
        break;
      case 'orange':
      case 'yellow':
        defaultAutoClose = UI_CONFIG.TOAST_DURATION.INFO;
        break;
      default:
        defaultAutoClose = UI_CONFIG.TOAST_DURATION.INFO;
    }
  }

  return notifications.show({
    title,
    message,
    color,
    autoClose: defaultAutoClose,
    icon,
  });
};

// Convenience functions for common notification types
export const showSuccessNotification = (
  title: string,
  message: string,
  icon?: React.ReactNode
) => {
  return showNotification({
    title,
    message,
    color: 'green',
    icon,
  });
};

export const showErrorNotification = (
  title: string,
  message: string,
  icon?: React.ReactNode
) => {
  return showNotification({
    title,
    message,
    color: 'red',
    icon,
  });
};

export const showWarningNotification = (
  title: string,
  message: string,
  icon?: React.ReactNode
) => {
  return showNotification({
    title,
    message,
    color: 'orange',
    icon,
  });
};

export const showInfoNotification = (
  title: string,
  message: string,
  icon?: React.ReactNode
) => {
  return showNotification({
    title,
    message,
    color: 'dynamic',
    icon,
  });
};

// For critical notifications that should not auto-close
export const showCriticalNotification = (
  title: string,
  message: string,
  icon?: React.ReactNode
) => {
  return showNotification({
    title,
    message,
    color: 'red',
    autoClose: false,
    icon,
  });
};
