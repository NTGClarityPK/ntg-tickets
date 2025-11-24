'use client';

// import { useState } from 'react'; // Removed unused import
import { useTranslations } from 'next-intl';
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  Card,
  Badge,
  ThemeIcon,
  Box,
  Alert,
  ActionIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  IconUser,
  IconShield,
  IconUsers,
  IconSettings,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import { UserRole } from '../../types/unified';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface RoleSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  roles: UserRole[];
  activeRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  loading: boolean;
  error: string | null;
}

export function RoleSelectionModal({
  opened,
  onClose,
  roles,
  onRoleSelect,
  // loading, // Removed unused parameter
  error,
}: RoleSelectionModalProps) {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark, primaryDarkest } = useDynamicTheme();
  const t = useTranslations('auth');

  const modalRoleConfig = {
    [UserRole.END_USER]: {
      icon: IconUser,
      color: primaryLight,
      title: 'End User',
      description: 'Submit and track your support tickets',
      permissions: ['Create tickets', 'View own tickets', 'Add comments'],
    },
    [UserRole.SUPPORT_STAFF]: {
      icon: IconUsers,
      color: primaryDark,
      title: 'Support Staff',
      description: 'Handle assigned tickets and provide support',
      permissions: ['View assigned tickets', 'Resolve tickets', 'Add comments'],
    },
    [UserRole.SUPPORT_MANAGER]: {
      icon: IconShield,
      color: primaryDark,
      title: 'Support Manager',
      description: 'Manage team and oversee ticket operations',
      permissions: [
        'Assign tickets',
        'View all tickets',
        'Manage team',
        'Generate reports',
      ],
    },
    [UserRole.ADMIN]: {
      icon: IconSettings,
      color: primaryDarkest,
      title: 'Administrator',
      description: 'Full system access and user management',
      permissions: [
        'Manage users',
        'System settings',
        'View all data',
        'Admin functions',
      ],
    },
  };

  const handleRoleClick = (role: UserRole) => {
    onRoleSelect(role);
  };

  const availableRoles = roles.map(role => ({
    role,
    ...modalRoleConfig[role],
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify='space-between' w='100%'>
          <Title order={3} fw={600}>
            {t('selectRole')}
          </Title>
          <ActionIcon variant='subtle' color='gray' onClick={onClose} size='sm'>
            <IconX size={16} />
          </ActionIcon>
        </Group>
      }
      size='lg'
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Stack gap='lg'>
        <Box>
          <Text size='sm' c='dimmed' mb='md'>
            {t('youHaveMultipleRoles')}
          </Text>
          {error && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              color={theme.colors[theme.primaryColor][9]}
              variant='light'
              radius='md'
              mb='md'
            >
              <Text size='sm'>{error}</Text>
            </Alert>
          )}
        </Box>

        <Stack gap='md'>
          {availableRoles.map(
            ({ role, icon: Icon, color, title, description, permissions }) => (
              <Card
                key={role}
                shadow='sm'
                padding='lg'
                radius='md'
                withBorder
                style={{
                  cursor: 'pointer',
                  borderWidth:  1,
                  opacity: 1,
                }}
                onClick={() => handleRoleClick(role)}
              >
                <Group justify='space-between' mb='sm'>
                  <Group gap='sm'>
                    <ThemeIcon
                      size='lg'
                      radius='md'
                      variant='light'
                      color={color}
                    >
                      <Icon size={20} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={600} size='lg'>
                        {title}
                      </Text>
                      <Text size='sm' c='dimmed'>
                        {description}
                      </Text>
                    </Box>
                  </Group>
                  <Badge
                    color={color}
                    variant='light'
                    size='sm'
                  >
                    {role.replace('_', ' ')}
                  </Badge>
                </Group>

                <Text size='xs' c='dimmed' mb='xs'>
                  Permissions:
                </Text>
                <Group gap='xs'>
                  {permissions.map(permission => (
                    <Badge
                      key={permission}
                      size='xs'
                      variant='outline'
                      color={color}
                    >
                      {permission}
                    </Badge>
                  ))}
                </Group>
              </Card>
            )
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
