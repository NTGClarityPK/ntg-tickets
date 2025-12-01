'use client';

import {
  AppShell,
  Group,
  Text,
  Button,
  Menu,
  Avatar,
  Badge,
  ActionIcon,
  Burger,
  Image,
  Stack,
  useMantineTheme,
  Box,
} from '@mantine/core';
import {
  IconBell,
  IconLogout,
  IconUser,
  IconHelp,
  IconPalette,
  // IconCheck, // Removed unused import
} from '@tabler/icons-react';
import { RTLChevronDown } from '../ui/RTLIcon';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotificationsStore } from '../../stores/useNotificationsStore';
import { useSiteBranding } from '../../hooks/useSiteBranding';
import { useMarkNotificationAsRead } from '../../hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { signOut as supabaseSignOut } from '../../lib/supabase-auth';
import { useQueryClient } from '@tanstack/react-query';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LanguageSwitcher } from '../language/LanguageSwitcher';
import { authApi } from '../../lib/apiClient';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { UserRole } from '../../types/unified';
import { notifications } from '@mantine/notifications';
import { RoleSelectionModal } from '../modals/RoleSelectionModal';
import { useState } from 'react';
import { getRoleColor, getRoleLabel } from '../../lib/roleConfig';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { Logo } from '../common/Logo';

interface AppHeaderProps {
  onHelpClick?: () => void;
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function AppHeader({
  onHelpClick,
  mobileOpened,
  toggleMobile,
}: AppHeaderProps) {
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  const { user, organization, logout, updateUser } = useAuthStore();
  const { unreadCount, getRecentNotifications } = useNotificationsStore();
  const { siteName } = useSiteBranding();
  // Use organization name if available (from store or user object), otherwise fallback to siteName
  const displayName = organization?.name || user?.organization?.name || siteName;
  const router = useRouter();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const markAsReadMutation = useMarkNotificationAsRead();
  const queryClient = useQueryClient();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [logoImageError, setLogoImageError] = useState(false);
  const { primary, themeSettings, primaryLight, primaryLighter, primaryLightest, primaryDark, primaryDarker, primaryDarkest, isDark } = useDynamicTheme();

  // Debug log
  // Debug logging removed for production

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint using the project's API pattern
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if backend call fails
    }

    // Clear local auth store first (this also clears auth-storage)
    logout();

    // Sign out from Supabase (clears Supabase session)
    try {
      await supabaseSignOut();
    } catch (error) {
      // Continue with logout even if Supabase signout fails
    }

    // Clear all auth-related storage (comprehensive cleanup)
    if (typeof window !== 'undefined') {
      // Clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear Zustand persisted auth storage (in case logout() didn't catch it)
      localStorage.removeItem('auth-storage');
      
      // Clear any Supabase storage keys (they start with 'sb-')
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear React Query cache
      queryClient.clear();
    }

    // Use hard redirect to ensure navigation works
    window.location.href = '/auth/signin';
  };


  const getRoleLabelText = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return tAuth('roles.admin');
      case UserRole.SUPPORT_MANAGER:
        return tAuth('roles.support_manager');
      case UserRole.SUPPORT_STAFF:
        return tAuth('roles.support_staff');
      case UserRole.END_USER:
        return tAuth('roles.end_user');
      default:
        return role;
    }
  };

  const handleRoleSelect = async (selectedRole: UserRole) => {
    if (selectedRole === user?.activeRole) {
      setShowRoleModal(false);
      return;
    }

    try {
      const result = await authApi.switchRole({ activeRole: selectedRole });

      // Store the new tokens in localStorage for NextAuth to pick up
      if (result.data.data.access_token) {
        localStorage.setItem('access_token', result.data.data.access_token);
      }
      if (result.data.data.refresh_token) {
        localStorage.setItem('refresh_token', result.data.data.refresh_token);
      }

      // Update the auth store with new user data
      updateUser({
        ...user,
        activeRole: selectedRole,
      });

      // Invalidate role-specific queries to ensure fresh data with new role
      await queryClient.invalidateQueries({ queryKey: ['assigned-tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['tickets-with-pagination'] });
      await queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] });
      await queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] });
      await queryClient.invalidateQueries({ queryKey: ['overdue-tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['tickets-approaching-sla'] });
      await queryClient.invalidateQueries({ queryKey: ['breached-sla-tickets'] });
      await queryClient.invalidateQueries({ queryKey: ['support-staff'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      notifications.show({
        title: tAuth('roleSwitched'),
        message: tAuth('roleSwitchedMessage', {
          role: getRoleLabel(selectedRole),
        }),
        color: primaryLight,
      });

      setShowRoleModal(false);
      // No need to reload - the role has been switched successfully
    } catch (error) {
      // Error logging removed for production
      notifications.show({
        title: tAuth('roleSwitchFailed'),
        message: tAuth('roleSwitchFailedMessage'),
        color: primaryDark,
      });
    }
  };

  return (
    <AppShell.Header style={{ overflow: 'visible' }}>
      <Group h='100%' px='md' justify='space-between' style={{ overflow: 'visible' }}>
        {/* Left side - Logo and Brand */}
        <Group>
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom='sm'
            size='sm'
          />
          <Group
            gap='xs'
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/')}
          >
            {/* Logo */}
            {(() => {
              const logoSrc = themeSettings?.logoData 
                ? `data:image/png;base64,${themeSettings.logoData}`
                : themeSettings?.logoUrl || null;
              
              if (logoSrc && !logoImageError) {
                return (
                  <Image
                    src={logoSrc}
                    alt='NTG Ticket Logo'
                    w={32}
                    h={32}
                    style={{ objectFit: 'contain', backgroundColor: 'transparent' }}
                    onError={() => setLogoImageError(true)}
                  />
                );
              }
              
              return <Logo size={32} variant="icon" />;
            })()}
            {!isMobile && (
              <Text fw={700} size='lg' style={{ color: primary }}>
                {displayName}
              </Text>
            )}
          </Group>
        </Group>

        {/* Right side - Actions */}
        <Group gap='xs' style={{ overflow: 'visible' }}>
          {/* Notifications - Always visible (most important) */}
          <Menu shadow='md' width={400}>
            <Menu.Target>
              <Box style={{ position: 'relative', overflow: 'visible', display: 'inline-block' }}>
                <ActionIcon 
                  variant='subtle' 
                  style={{ 
                    color: primary,
                    overflow: 'visible',
                    position: 'relative'
                  }} 
                  size='lg'
                >
                  <IconBell size={20} />
                </ActionIcon>
                {unreadCount > 0 && (
                  <Badge
                    size='xs'
                    style={{ 
                      backgroundColor: primary, 
                      color: 'white', 
                      minWidth: 18, 
                      height: 18,
                      padding: '0 4px',
                      fontSize: '10px',
                      lineHeight: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '9px',
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Box>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t('notifications')}</Menu.Label>

              {/* Show recent notifications (up to 5) */}
              {getRecentNotifications(5).length > 0 ? (
                getRecentNotifications(5).map(notification => (
                  <Menu.Item
                    key={notification.id}
                    leftSection={<IconBell size={14} />}
                    onClick={() => {
                      // Mark as read if unread using API
                      if (!notification.isRead) {
                        markAsReadMutation.mutate(notification.id);
                      }
                      // Navigate to notification or related page
                      router.push('/notifications');
                    }}
                    style={{
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                      marginBottom: '4px',
                      backgroundColor: notification.isRead
                        ? 'transparent'
                        : isDark
                          ? primaryDark
                          : primaryLightest,
                      color: !notification.isRead
                        ? isDark
                          ? '#ffffff'
                          : '#212529'
                        : undefined,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = isDark
                        ? primaryDark
                        : primaryLightest;
                      e.currentTarget.style.color = isDark
                        ? '#ffffff'
                        : '#212529';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = notification.isRead
                        ? 'transparent'
                        : isDark
                          ? primaryDark
                          : primaryLightest;
                      if (!notification.isRead) {
                        e.currentTarget.style.color = isDark
                          ? '#ffffff'
                          : '#212529';
                      } else {
                        e.currentTarget.style.color = '';
                      }
                    }}
                  >
                    <Stack gap={4}>
                      <Group justify='space-between'>
                        <Text 
                          size='sm' 
                          fw={notification.isRead ? 400 : 600}
                          style={{ 
                            color: 'inherit',
                          }}
                        >
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <Badge size='xs' style={{ backgroundColor: primary, color: 'white' }} variant='filled'>
                            New
                          </Badge>
                        )}
                      </Group>
                      <Text 
                        size='xs' 
                        style={{ 
                          color: 'inherit',
                          opacity: 0.9,
                        }}
                        lineClamp={2}
                      >
                        {notification.message}
                      </Text>
                      <Text 
                        size='xs' 
                        style={{ 
                          color: 'inherit',
                          opacity: 0.9,
                        }}
                      >
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                  </Menu.Item>
                ))
              ) : (
                <Menu.Item disabled>
                  <Text size='sm' c='dimmed'>
                    No notifications
                  </Text>
                </Menu.Item>
              )}

              {/* View all notifications */}
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconBell size={14} />}
                onClick={() => router.push('/notifications')}
                style={{
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                  marginBottom: '4px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark
                    ? primaryDark
                    : primaryLightest;
                  e.currentTarget.style.color = isDark
                    ? '#ffffff'
                    : '#212529';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '';
                }}
              >
                <Group justify='space-between'>
                  <Text 
                    size='sm'
                    style={{ color: 'inherit' }}
                  >
                    {t('viewAllNotifications')}
                  </Text>
                  {unreadCount > 0 && (
                    <Badge size='xs' style={{ backgroundColor: primary, color: 'white' }} variant='filled'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Group>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* User Profile - Always visible (personal) */}
          <Menu shadow='md' width={isMobile ? 200 : 250}>
            <Menu.Target>
              {isMobile ? (
                <ActionIcon variant='subtle' style={{ color: primary }} size='lg'>
                  <Avatar size='sm' src={user?.avatar} />
                </ActionIcon>
              ) : (
                <Button
                  variant='subtle'
                  style={{ color: primary }}
                  leftSection={<Avatar size='sm' src={user?.avatar} />}
                >
                  <Group gap='xs'>
                    <div>
                      <Text size='sm' fw={500}>
                        {user?.name}
                      </Text>
                      <Badge
                        size='xs'
                        color={getRoleColor(
                          user?.activeRole || UserRole.END_USER,
                          { primaryLighter, primaryDark, primaryDarker, primaryDarkest }
                        )}
                      >
                        {getRoleLabelText(
                          user?.activeRole || UserRole.END_USER
                        )}
                      </Badge>
                    </div>
                    <RTLChevronDown size={14} />
                  </Group>
                </Button>
              )}
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t('account')}</Menu.Label>
              {isMobile && (
                <Menu.Item>
                  <Text size='sm' fw={500}>
                    {user?.name}
                  </Text>
                  <Badge
                    size='xs'
                    color={getRoleColor(
                      user?.activeRole || UserRole.END_USER,
                      { primaryLighter, primaryDark, primaryDarker, primaryDarkest }
                    )}
                  >
                    {getRoleLabelText(user?.activeRole || UserRole.END_USER)}
                  </Badge>
                </Menu.Item>
              )}

              {/* Role Switching - Only show if user has multiple roles */}
              {user?.roles && user.roles.length > 1 && (
                <>
                  <Menu.Item
                    leftSection={<IconUser size={14} />}
                    onClick={() => {
                      // Debug logging removed for production
                      setShowRoleModal(true);
                    }}
                    style={{
                      transition: 'background-color 0.2s ease',
                      marginBottom: '4px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = isDark
                        ? primaryDark
                        : primaryLight;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Text size='sm'>{tAuth('switchRole')}</Text>
                  </Menu.Item>
                  <Menu.Divider />
                </>
              )}

              <Menu.Item
                leftSection={<IconUser size={14} />}
                onClick={() => router.push('/profile')}
                style={{
                  transition: 'background-color 0.2s ease',
                  marginBottom: '4px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark
                    ? primaryDark
                    : primaryLight;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Text size='sm'>{t('profile')}</Text>
              </Menu.Item>

              {/* Theme Settings - Admin Only */}
              {user?.activeRole === UserRole.ADMIN && (
                <Menu.Item
                  leftSection={<IconPalette size={14} />}
                  onClick={() => router.push('/admin/theme-settings')}
                  style={{
                    transition: 'background-color 0.2s ease',
                    marginBottom: '4px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = isDark
                      ? primaryDark
                      : primaryLight;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Text size='sm'>Theme Settings</Text>
                </Menu.Item>
              )}
              {isMobile && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconHelp size={14} />}
                    onClick={onHelpClick}
                    style={{
                      transition: 'background-color 0.2s ease',
                      marginBottom: '4px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = isDark
                        ? primaryDark
                        : primaryLight;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Text size='sm'>{t('helpSupport')}</Text>
                  </Menu.Item>
                </>
              )}
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                onClick={handleLogout}
                style={{
                  transition: 'background-color 0.2s ease',
                  marginBottom: '4px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark
                    ? primaryDark
                    : primaryLight;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Desktop-only elements - Preferences and Support */}
          {!isMobile && (
            <>
              {/* Help & Support */}
              <ActionIcon
                variant='subtle'
                style={{ color: primary }}
                size='lg'
                onClick={onHelpClick}
                title='Help & Support'
              >
                <IconHelp size={20} />
              </ActionIcon>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Theme Toggle */}
              <ThemeToggle />
            </>
          )}
        </Group>
      </Group>

      {/* Role Selection Modal */}
      {user?.roles && user.roles.length > 1 && (
        <RoleSelectionModal
          opened={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          roles={user.roles}
          activeRole={user.activeRole}
          onRoleSelect={handleRoleSelect}
          loading={false}
          error={null}
        />
      )}
    </AppShell.Header>
  );
}
