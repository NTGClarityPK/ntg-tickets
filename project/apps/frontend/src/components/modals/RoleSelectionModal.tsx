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
    },
    [UserRole.SUPPORT_STAFF]: {
      icon: IconUsers,
      color: primaryDark,
      title: 'Support Staff',
      description: 'Handle assigned tickets and provide support',
    },
    [UserRole.SUPPORT_MANAGER]: {
      icon: IconShield,
      color: primaryDark,
      title: 'Support Manager',
      description: 'Manage team and oversee ticket operations',
    },
    [UserRole.ADMIN]: {
      icon: IconSettings,
      color: primaryDarkest,
      title: 'Administrator',
      description: 'Full system access and user management',
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
          <ActionIcon variant='subtle' color='gray' onClick={onClose} size='sm' data-testid="role-modal-close">
            <IconX size={16} />
          </ActionIcon>
        </Group>
      }
      size='lg'
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      data-testid="role-selection-modal"
    >
      <Stack gap='lg' data-testid="role-selection-modal-stack">
        <Box data-testid="role-selection-modal-header">
          <Text size='sm' c='dimmed' mb='md' data-testid="role-selection-modal-description">
            {t('youHaveMultipleRoles')}
          </Text>
          {error && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              color={theme.colors[theme.primaryColor][9]}
              variant='light'
              radius='md'
              mb='md'
              data-testid="role-selection-modal-error-alert"
            >
              <Text size='sm' data-testid="role-selection-modal-error-text">{error}</Text>
            </Alert>
          )}
        </Box>

        <Stack gap='md' data-testid="role-selection-modal-roles-stack">
          {availableRoles.map(
            ({ role, icon: Icon, color, title, description }) => (
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
                data-testid={`role-card-${role}`}
              >
                <Group justify='space-between' mb='sm' data-testid={`role-card-content-${role}`}>
                  <Group gap='sm' data-testid={`role-card-info-${role}`}>
                    <ThemeIcon
                      size='lg'
                      radius='md'
                      variant='light'
                      color={color}
                      data-testid={`role-card-icon-${role}`}
                    >
                      <Icon size={20} />
                    </ThemeIcon>
                    <Box data-testid={`role-card-text-${role}`}>
                      <Text fw={600} size='lg' data-testid={`role-card-title-${role}`}>
                        {title}
                      </Text>
                      <Text size='sm' c='dimmed' data-testid={`role-card-description-${role}`}>
                        {description}
                      </Text>
                    </Box>
                  </Group>
                  <Badge
                    color={color}
                    variant='light'
                    size='sm'
                    data-testid={`role-card-badge-${role}`}
                  >
                    {role.replace('_', ' ')}
                  </Badge>
                </Group>
              </Card>
            )
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
