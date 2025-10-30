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
    return (
      NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] || 'red'
    );
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
    <Paper withBorder p='md'>
      <Stack gap='md'>
        {/* Header */}
        <Group justify='space-between'>
          <Group>
            <IconBell size={20} />
            <Text fw={600} size='lg'>
              {t('notifications')}
            </Text>
            <Badge color='red' variant='light'>
              {notifications.filter(n => !n.isRead).length} {t('unread')}
            </Badge>
            <Text size='xs' c='dimmed'>
              {getNotificationMessage()}
            </Text>
          </Group>
          <Group>
            <Select
              size='sm'
              data={[
                { value: 'all', label: t('all') },
                { value: 'unread', label: t('unread') },
                { value: 'read', label: t('read') },
              ]}
              value={filter}
              onChange={value => setFilter(value || 'all')}
            />
            <Button
              size='sm'
              variant='light'
              leftSection={<IconCheck size={14} />}
              onClick={onMarkAllAsRead}
            >
              {t('markAllRead')}
            </Button>
          </Group>
        </Group>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <Group>
            <Checkbox
              checked={
                selectedNotifications.length === paginatedNotifications.length
              }
              onChange={event => handleSelectAll(event.currentTarget.checked)}
              label={`${selectedNotifications.length} ${t('selected')}`}
            />
            <Button
              size='xs'
              variant='light'
              leftSection={<IconCheck size={12} />}
              onClick={handleMarkSelectedAsRead}
            >
              {t('markAsRead')}
            </Button>
            <Button
              size='xs'
              variant='light'
              color='red'
              leftSection={<IconTrash size={12} />}
              onClick={handleDeleteSelected}
            >
              {t('delete')}
            </Button>
          </Group>
        )}

        <Divider />

        {/* Notifications List */}
        <ScrollArea h={400}>
          <Stack gap='xs'>
            {paginatedNotifications.length === 0 ? (
              <Text c='dimmed' ta='center' py='xl'>
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
                      : 'var(--mantine-color-red-0)',
                    borderLeft: notification.isRead
                      ? 'none'
                      : '3px solid var(--mantine-color-red-6)',
                  }}
                >
                  <Group justify='space-between' align='flex-start'>
                    <Group gap='sm' style={{ flex: 1 }}>
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
                      />
                      <Avatar
                        color={getNotificationColor(notification.type)}
                        size='sm'
                        radius='xl'
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Group justify='space-between' align='flex-start'>
                          <div>
                            <Text
                              fw={notification.isRead ? 400 : 600}
                              size='sm'
                            >
                              {notification.title}
                            </Text>
                            <Text size='xs' c='dimmed' mt={2}>
                              {notification.message}
                            </Text>
                            <Group gap='xs' mt={4}>
                              <Badge
                                color={getNotificationColor(notification.type)}
                                size='xs'
                                variant='light'
                              >
                                {notification.type.replace('_', ' ')}
                              </Badge>
                              <Text size='xs' c='dimmed'>
                                {format(
                                  new Date(notification.createdAt),
                                  'MMM dd, HH:mm'
                                )}
                              </Text>
                            </Group>
                          </div>
                          {!notification.isRead && (
                            <Badge color='red' size='xs' variant='filled'>
                              {t('new')}
                            </Badge>
                          )}
                        </Group>
                      </div>
                    </Group>
                    <Group gap='xs'>
                      {!notification.isRead && (
                        <ActionIcon
                          size='sm'
                          variant='light'
                          onClick={() => onMarkAsRead?.(notification.id)}
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
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        size='sm'
                        variant='light'
                        color='red'
                        onClick={() => onDelete?.(notification.id)}
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
          <Group justify='center'>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={Math.ceil(filteredNotifications.length / itemsPerPage)}
              size='sm'
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
