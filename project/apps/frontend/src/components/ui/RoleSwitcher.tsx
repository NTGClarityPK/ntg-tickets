'use client';

import { useState } from 'react';
import { Button, Menu, Badge, Group, Text, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconRefresh } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../types/unified';
import { authApi } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { notifications } from '@mantine/notifications';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface RoleSwitcherProps {
  userRoles: UserRole[];
  activeRole: UserRole;
  isMobile?: boolean;
}

export function RoleSwitcher({
  userRoles,
  activeRole,
  isMobile = false,
}: RoleSwitcherProps) {
  const { primaryDarkest, primaryLight, primaryDark } = useDynamicTheme();
  const t = useTranslations('auth');
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return primaryDarkest;
      case UserRole.SUPPORT_MANAGER:
        return primaryDark;
      case UserRole.SUPPORT_STAFF:
        return primaryDark;
      case UserRole.END_USER:
        return primaryLight;
      default:
        return primaryLight;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return t('roles.admin');
      case UserRole.SUPPORT_MANAGER:
        return t('roles.support_manager');
      case UserRole.SUPPORT_STAFF:
        return t('roles.support_staff');
      case UserRole.END_USER:
        return t('roles.end_user');
      default:
        return role;
    }
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (newRole === activeRole) return;

    setLoading(true);
    try {
      const result = await authApi.switchRole({ activeRole: newRole });

      // Store the new tokens in localStorage for NextAuth to pick up
      if (result.data.data.access_token) {
        localStorage.setItem('access_token', result.data.data.access_token);
      }
      if (result.data.data.refresh_token) {
        localStorage.setItem('refresh_token', result.data.data.refresh_token);
      }

      // Update the user in the auth store with new tokens
      updateUser({
        ...result.data.data.user,
        roles: result.data.data.user.roles as UserRole[],
        activeRole: newRole,
      });

      // Small delay to ensure token update is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Invalidate all queries that might be affected by role changes
      // This ensures fresh data is fetched with the new role permissions
      await queryClient.invalidateQueries();
      
      // Also specifically invalidate role-dependent queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assigned-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['tickets-with-pagination'] }),
        queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] }),
        queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] }),
        queryClient.invalidateQueries({ queryKey: ['overdue-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['tickets-approaching-sla'] }),
        queryClient.invalidateQueries({ queryKey: ['breached-sla-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['support-staff'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
        queryClient.invalidateQueries({ queryKey: ['auth'] }),
      ]);

      // Force refetch of all active queries to immediately update the UI
      await queryClient.refetchQueries({ 
        type: 'active',
        stale: true 
      });

      notifications.show({
        title: t('roleSwitched'),
        message: t('roleSwitchedMessage', { role: getRoleLabel(newRole) }),
        color: primaryLight,
      });

      // Force NextAuth to think the token is expired so it will refresh
      // This makes NextAuth pick up our new tokens
      const nextAuthToken = localStorage.getItem('next-auth.session-token');
      if (nextAuthToken) {
        try {
          const tokenData = JSON.parse(atob(nextAuthToken.split('.')[1]));
          // Set the token expiration to the past to force refresh
          tokenData.exp = Math.floor(Date.now() / 1000) - 1;
          const newToken = btoa(JSON.stringify(tokenData));
          localStorage.setItem('next-auth.session-token', newToken);
        } catch (e) {
          // Ignore token modification errors
        }
      }

      // Trigger NextAuth session update
      await updateSession();

      // No need to reload the page - API client will use new tokens from localStorage
    } catch (error) {
      notifications.show({
        title: t('roleSwitchFailed'),
        message: t('roleSwitchFailedMessage'),
        color: primaryDark,
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show switcher if user has only one role
  if (userRoles.length <= 1) {
    return (
      <Badge size='xs' color={getRoleBadgeColor(activeRole)}>
        {getRoleLabel(activeRole)}
      </Badge>
    );
  }

  if (isMobile) {
    return (
      <Menu shadow='md' width={200}>
        <Menu.Target>
          <ActionIcon variant='subtle' color='red' size='sm' loading={loading}>
            <IconRefresh size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{t('switchRole')}</Menu.Label>
          {userRoles.map(role => (
            <Menu.Item
              key={role}
              onClick={() => handleRoleSwitch(role)}
              disabled={loading}
              leftSection={
                <Badge
                  size='xs'
                  color={getRoleBadgeColor(role)}
                  variant={role === activeRole ? 'filled' : 'light'}
                >
                  {getRoleLabel(role)}
                </Badge>
              }
            >
              <Text size='sm'>
                {role === activeRole
                  ? `${getRoleLabel(role)} (Current)`
                  : getRoleLabel(role)}
              </Text>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Menu shadow='md' width={250}>
      <Menu.Target>
        <Button
          variant='subtle'
          color='red'
          size='xs'
          rightSection={<IconChevronDown size={12} />}
          loading={loading}
        >
          <Group gap='xs'>
            <Badge size='xs' color={getRoleBadgeColor(activeRole)}>
              {getRoleLabel(activeRole)}
            </Badge>
            <Text size='xs' c='dimmed'>
              {userRoles.length > 1 ? `+${userRoles.length - 1}` : ''}
            </Text>
          </Group>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t('switchRole')}</Menu.Label>
        {userRoles.map(role => (
          <Menu.Item
            key={role}
            onClick={() => handleRoleSwitch(role)}
            disabled={loading}
            leftSection={
              <Badge
                size='xs'
                color={getRoleBadgeColor(role)}
                variant={role === activeRole ? 'filled' : 'light'}
              >
                {getRoleLabel(role)}
              </Badge>
            }
          >
            <Text size='sm'>
              {role === activeRole
                ? `${getRoleLabel(role)} (Current)`
                : getRoleLabel(role)}
            </Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
