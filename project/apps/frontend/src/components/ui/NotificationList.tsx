'use client';

import {
  Paper,
  Text,
  Group,
  Badge,
  Button,
  ActionIcon,
  Avatar,
  Stack,
  Divider,
  ScrollArea,
  Pagination,
  Select,
  Checkbox,
  useMantineTheme,
} from '@mantine/core';
import {
  IconBell,
  IconCheck,
  IconTrash,
  IconEye,
  IconMessage,
  IconTicket,
  IconAlertCircle,
  IconClock,
  IconUser,
  IconCalendar,
} from '@tabler/icons-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { Notification } from '../../types/notification';
import {
  PAGINATION_CONFIG,
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
} from '../../lib/constants';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onViewTicket?: (ticketId: string) => void;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onViewTicket,
}: NotificationListProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = PAGINATION_CONFIG.NOTIFICATION_PAGE_SIZE;
  const { getNotificationMessage } = useNotificationSettings();

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      IconTicket: <IconTicket size={16} />,
      IconUser: <IconUser size={16} />,
      IconAlertCircle: <IconAlertCircle size={16} />,
      IconMessage: <IconMessage size={16} />,
      IconClock: <IconClock size={16} />,
      IconCalendar: <IconCalendar size={16} />,
    };

    const iconName =
      NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || 'IconBell';
    return iconMap[iconName as keyof typeof iconMap] || <IconBell size={16} />;
  };

  const getNotificationColor = (type: string) => {
    const color = NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS];
    // Map hardcoded colors to theme colors
    if (color === 'red' || !color) return theme.colors[theme.primaryColor][9];
    if (color === 'green') return theme.primaryColor;
    if (color === 'yellow') return theme.colors[theme.primaryColor][4];
    if (color === 'orange') return theme.colors[theme.primaryColor][4];
    return theme.primaryColor; // Default fallback
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(paginatedNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, id]);
    } else {
      setSelectedNotifications(prev => prev.filter(n => n !== id));
    }
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => {
      onMarkAsRead?.(id);
    });
    setSelectedNotifications([]);
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => {
      onDelete?.(id);
    });
    setSelectedNotifications([]);
  };

  return (
    <Paper withBorder p='md' data-testid="notification-list-container">
      <Stack gap='md' data-testid="notification-list-stack">
        {/* Header */}
        <Group justify='space-between' data-testid="notification-list-header">
          <Group data-testid="notification-list-header-left">
            <IconBell size={20} data-testid="notification-list-icon" />
            <Text fw={600} size='lg' data-testid="notification-list-title">
              {t('notifications')}
            </Text>
            <Badge color={theme.colors[theme.primaryColor][9]} variant='light' data-testid="notification-list-unread-badge">
              {notifications.filter(n => !n.isRead).length} {t('unread')}
            </Badge>
            <Text size='xs' c='dimmed' data-testid="notification-list-message">
              {getNotificationMessage()}
            </Text>
          </Group>
          <Group data-testid="notification-list-header-actions">
            <Select
              size='sm'
              data={[
                { value: 'all', label: t('all') },
                { value: 'unread', label: t('unread') },
                { value: 'read', label: t('read') },
              ]}
              value={filter}
              onChange={value => setFilter(value || 'all')}
              data-testid="notification-list-filter"
            />
            <Button
              size='sm'
              variant='light'
              leftSection={<IconCheck size={14} />}
              onClick={onMarkAllAsRead}
              data-testid="notification-list-mark-all-read-button"
            >
              {t('markAllRead')}
            </Button>
          </Group>
        </Group>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <Group data-testid="notification-list-bulk-actions">
            <Checkbox
              checked={
                selectedNotifications.length === paginatedNotifications.length
              }
              onChange={event => handleSelectAll(event.currentTarget.checked)}
              label={`${selectedNotifications.length} ${t('selected')}`}
              data-testid="notification-list-select-all-checkbox"
            />
            <Button
              size='xs'
              variant='light'
              leftSection={<IconCheck size={12} />}
              onClick={handleMarkSelectedAsRead}
              data-testid="notification-list-mark-selected-read-button"
            >
              {t('markAsRead')}
            </Button>
            <Button
              size='xs'
              variant='light'
              color={theme.colors[theme.primaryColor][9]}
              leftSection={<IconTrash size={12} />}
              onClick={handleDeleteSelected}
              data-testid="notification-list-delete-selected-button"
            >
              {t('delete')}
            </Button>
          </Group>
        )}

        <Divider data-testid="notification-list-divider" />

        {/* Notifications List */}
        <ScrollArea h={400} data-testid="notification-list-scroll">
          <Stack gap='xs' data-testid="notification-list-items">
            {paginatedNotifications.length === 0 ? (
              <Text c='dimmed' ta='center' py='xl' data-testid="notification-list-empty">
                {t('noNotificationsFound')}
              </Text>
            ) : (
              paginatedNotifications.map(notification => (
                <Paper
                  key={notification.id}
                  p='sm'
                  withBorder
                  style={{
                    backgroundColor: notification.isRead
                      ? 'transparent'
                      : theme.colors[theme.primaryColor][0],
                    borderLeft: notification.isRead
                      ? 'none'
                      : `3px solid ${theme.colors[theme.primaryColor][6]}`,
                  }}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <Group justify='space-between' align='flex-start' data-testid={`notification-item-content-${notification.id}`}>
                    <Group gap='sm' style={{ flex: 1 }} data-testid={`notification-item-main-${notification.id}`}>
                      <Checkbox
                        checked={selectedNotifications.includes(
                          notification.id
                        )}
                        onChange={event =>
                          handleSelectNotification(
                            notification.id,
                            event.currentTarget.checked
                          )
                        }
                        data-testid={`notification-item-checkbox-${notification.id}`}
                      />
                      <Avatar
                        color={getNotificationColor(notification.type)}
                        size='sm'
                        radius='xl'
                        data-testid={`notification-item-avatar-${notification.id}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                      <div style={{ flex: 1 }} data-testid={`notification-item-text-${notification.id}`}>
                        <Group justify='space-between' align='flex-start' data-testid={`notification-item-header-${notification.id}`}>
                          <div data-testid={`notification-item-details-${notification.id}`}>
                            <Text
                              fw={notification.isRead ? 400 : 600}
                              size='sm'
                              data-testid={`notification-item-title-${notification.id}`}
                            >
                              {notification.title}
                            </Text>
                            <Text size='xs' c='dimmed' mt={2} data-testid={`notification-item-message-${notification.id}`}>
                              {notification.message}
                            </Text>
                            <Group gap='xs' mt={4} data-testid={`notification-item-meta-${notification.id}`}>
                              <Badge
                                color={getNotificationColor(notification.type)}
                                size='xs'
                                variant='light'
                                data-testid={`notification-item-type-badge-${notification.id}`}
                              >
                                {notification.type.replace('_', ' ')}
                              </Badge>
                              <Text size='xs' c='dimmed' data-testid={`notification-item-time-${notification.id}`}>
                                {format(
                                  new Date(notification.createdAt),
                                  'MMM dd, HH:mm'
                                )}
                              </Text>
                            </Group>
                          </div>
                          {!notification.isRead && (
                            <Badge color={theme.colors[theme.primaryColor][9]} size='xs' variant='filled' data-testid={`notification-item-new-badge-${notification.id}`}>
                              {t('new')}
                            </Badge>
                          )}
                        </Group>
                      </div>
                    </Group>
                    <Group gap='xs' data-testid={`notification-item-actions-${notification.id}`}>
                      {!notification.isRead && (
                        <ActionIcon
                          size='sm'
                          variant='light'
                          onClick={() => onMarkAsRead?.(notification.id)}
                          data-testid={`notification-item-mark-read-${notification.id}`}
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      )}
                      {notification.ticketId && (
                        <ActionIcon
                          size='sm'
                          variant='light'
                          onClick={() =>
                            notification.ticketId &&
                            onViewTicket?.(notification.ticketId)
                          }
                          data-testid={`notification-item-view-ticket-${notification.id}`}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        size='sm'
                        variant='light'
                        color={theme.colors[theme.primaryColor][9]}
                        onClick={() => onDelete?.(notification.id)}
                        data-testid={`notification-item-delete-${notification.id}`}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </ScrollArea>

        {/* Pagination */}
        {filteredNotifications.length > itemsPerPage && (
          <Group justify='center' data-testid="notification-list-pagination-group">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={Math.ceil(filteredNotifications.length / itemsPerPage)}
              size='sm'
              data-testid="notification-list-pagination"
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
