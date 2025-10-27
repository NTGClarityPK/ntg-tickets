'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Card,
  Badge,
  ActionIcon,
  Menu,
  Loader,
  Alert,
  Tabs,
} from '@mantine/core';
import {
  IconBell,
  IconDots,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconTicket,
  IconUser,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

// Type for the actual data returned by useNotifications hook (matches API response)
type NotificationData = {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const notificationIcons: Record<
  string,
  React.ComponentType<{ size?: number }>
> = {
  ticket: IconTicket,
  user: IconUser,
  system: IconBell,
  warning: IconAlertCircle,
  default: IconBell,
};

const notificationColors: Record<string, string> = {
  ticket: 'red',
  user: 'green',
  system: 'gray',
  warning: 'orange',
  error: 'red',
  default: 'red',
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const { data: notificationsData, isLoading, error } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const allNotifications = notificationsData || [];
  const unreadNotifications = allNotifications.filter(
    (n: NotificationData) => !n.isRead
  );
  const readNotifications = allNotifications.filter(
    (n: NotificationData) => n.isRead
  );

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      notifications.show({
        title: 'Success',
        message: 'Notification marked as read',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to mark notification as read',
        color: 'red',
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      notifications.show({
        title: 'Success',
        message: 'Notification deleted',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete notification',
        color: 'red',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = unreadNotifications.map((n: NotificationData) => n.id);
      await Promise.all(
        unreadIds.map((id: string) => markAsReadMutation.mutateAsync(id))
      );
      notifications.show({
        title: 'Success',
        message: 'All notifications marked as read',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to mark all notifications as read',
        color: 'red',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id =>
          deleteNotificationMutation.mutateAsync(id)
        )
      );
      setSelectedNotifications([]);
      notifications.show({
        title: 'Success',
        message: 'Selected notifications deleted',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete selected notifications',
        color: 'red',
      });
    }
  };

  const getNotificationColor = (type: string) => {
    return notificationColors[type] || notificationColors.default;
  };

  const renderNotification = (notification: NotificationData) => {
    const IconComponent =
      notificationIcons[notification.type] || notificationIcons.default;

    return (
      <Card
        key={notification.id}
        shadow='sm'
        padding='md'
        radius='md'
        withBorder
        style={{
          opacity: notification.isRead ? 0.7 : 1,
          borderLeft: `4px solid var(--mantine-color-${getNotificationColor(notification.type)}-6)`,
        }}
      >
        <Group justify='space-between' mb='sm'>
          <Group gap='sm'>
            <IconComponent size={20} />
            <div>
              <Text fw={500} size='sm'>
                {notification.message}
              </Text>
              <Text size='xs' c='dimmed'>
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </Text>
            </div>
          </Group>
          <Group gap='xs'>
            {!notification.isRead && (
              <Badge size='xs' color='red' variant='dot'>
                New
              </Badge>
            )}
            <Menu shadow='md' width={200}>
              <Menu.Target>
                <ActionIcon variant='subtle'>
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {!notification.isRead && (
                  <Menu.Item
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color='red'
                  onClick={() => handleDeleteNotification(notification.id)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
        <Text size='sm' c='dimmed'>
          {notification.message}
        </Text>
      </Card>
    );
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications;
      case 'read':
        return readNotifications;
      default:
        return allNotifications;
    }
  };

  if (isLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading notifications...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color='red'>
          Failed to load notifications: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>Notifications</Title>
          <Text c='dimmed'>
            {unreadNotifications.length > 0
              ? `${unreadNotifications.length} unread notifications`
              : 'All caught up!'}
          </Text>
        </div>
        <Group>
          {unreadNotifications.length > 0 && (
            <Button
              variant='outline'
              leftSection={<IconCheck size={16} />}
              onClick={handleMarkAllAsRead}
              loading={markAsReadMutation.isPending}
            >
              Mark All Read
            </Button>
          )}
          {selectedNotifications.length > 0 && (
            <Button
              color='red'
              leftSection={<IconTrash size={16} />}
              onClick={handleBulkDelete}
              loading={deleteNotificationMutation.isPending}
            >
              Delete Selected ({selectedNotifications.length})
            </Button>
          )}
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value='all'>All ({allNotifications.length})</Tabs.Tab>
          <Tabs.Tab value='unread'>
            Unread ({unreadNotifications.length})
          </Tabs.Tab>
          <Tabs.Tab value='read'>Read ({readNotifications.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={activeTab || 'unread'} pt='md'>
          <Stack gap='md'>
            {getFilteredNotifications().length === 0 ? (
              <Card shadow='sm' padding='xl' radius='md' withBorder>
                <Stack align='center' gap='md'>
                  <IconBell size={48} color='var(--mantine-color-dimmed)' />
                  <Text size='lg' fw={500}>
                    {activeTab === 'unread'
                      ? 'No unread notifications'
                      : activeTab === 'read'
                        ? 'No read notifications'
                        : 'No notifications yet'}
                  </Text>
                  <Text c='dimmed' ta='center'>
                    {activeTab === 'unread'
                      ? 'You are all caught up!'
                      : activeTab === 'read'
                        ? 'No notifications have been read yet'
                        : 'You will see notifications here when they arrive.'}
                  </Text>
                </Stack>
              </Card>
            ) : (
              getFilteredNotifications().map((notification: NotificationData) =>
                renderNotification(notification)
              )
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
