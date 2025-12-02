'use client';

import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Grid,
  Card,
  Badge,
  Stack,
  Table,
  ActionIcon,
  Menu,
  Modal,
  Avatar,
  useMantineTheme,
  Skeleton,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconUsers,
} from '@tabler/icons-react';
import { User, UserRole } from '../../../types/unified';
import { UsersListPresenterProps } from '../types/users.types';
import { getUserInitials } from '../utils/user.utils';
import { formatShortDate } from '../../../lib/utils';

interface ExtendedUsersListPresenterProps extends Omit<UsersListPresenterProps, 'error'> {
  onSetSelectedUser: (user: User | null) => void;
  getRoleColor: (role: UserRole) => string;
}

export function UsersListPresenter({
  metrics,
  state,
  colors,
  handlers,
  isLoading,
  onSetSelectedUser,
  getRoleColor,
}: ExtendedUsersListPresenterProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const tUsers = useTranslations('users');

  return (
    <Container size='xl' py='md' data-testid="users-list-page-container">
      <Group justify='space-between' mb='xl' data-testid="users-list-header">
        <div data-testid="users-list-header-text">
          <Title order={1} data-testid="users-list-title">{tUsers('title')}</Title>
          <Text c='dimmed' data-testid="users-list-subtitle">{tUsers('manageUsersPermissions')}</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handlers.onCreateUser} data-testid="add-user-button">
          {tUsers('addUser')}
        </Button>
      </Group>

      <Grid mb='md' data-testid="users-list-filters-grid">
        <Grid.Col span={6}>
          <TextInput
            placeholder={tUsers('searchUsers')}
            leftSection={<IconSearch size={16} />}
            value={state.searchTerm}
            onChange={e => handlers.onSearchChange(e.target.value)}
            data-testid="users-list-search-input"
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            placeholder={tUsers('role')}
            data={[
              { value: 'ADMIN', label: t('administrator') },
              { value: 'SUPPORT_MANAGER', label: t('supportManager') },
              { value: 'SUPPORT_STAFF', label: t('supportStaff') },
              { value: 'END_USER', label: t('endUser') },
            ]}
            value={state.roleFilter}
            onChange={handlers.onRoleFilterChange}
            clearable
            data-testid="users-list-role-filter"
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            placeholder={tUsers('status')}
            data={[
              { value: 'true', label: t('active') },
              { value: 'false', label: t('inactive') },
            ]}
            value={state.statusFilter}
            onChange={handlers.onStatusFilterChange}
            clearable
            data-testid="users-list-status-filter"
          />
        </Grid.Col>
      </Grid>

      <Card shadow='sm' padding='lg' radius='md' withBorder data-testid="users-list-card">
        <Table data-testid="users-list-table">
          <Table.Thead data-testid="users-list-table-head">
            <Table.Tr>
              <Table.Th>{tUsers('user')}</Table.Th>
              <Table.Th>{tUsers('role')}</Table.Th>
              <Table.Th>{tUsers('status')}</Table.Th>
              <Table.Th>{tUsers('lastLogin')}</Table.Th>
              <Table.Th>{tUsers('created')}</Table.Th>
              <Table.Th>{t('actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody data-testid="users-list-table-body">
            {isLoading ? (
              [...Array(5)].map((_, index) => (
                <Table.Tr key={index} data-testid={`users-list-skeleton-row-${index}`}>
                  <Table.Td>
                    <Group gap='sm'>
                      <Skeleton height={32} width={32} circle data-testid={`users-list-skeleton-avatar-${index}`} />
                      <div>
                        <Skeleton height={16} width={150} mb={4} data-testid={`users-list-skeleton-name-${index}`} />
                        <Skeleton height={14} width={200} data-testid={`users-list-skeleton-email-${index}`} />
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={24} width={100} data-testid={`users-list-skeleton-role-${index}`} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={24} width={70} data-testid={`users-list-skeleton-status-${index}`} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width={100} data-testid={`users-list-skeleton-lastlogin-${index}`} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width={100} data-testid={`users-list-skeleton-created-${index}`} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={28} width={28} circle data-testid={`users-list-skeleton-actions-${index}`} />
                  </Table.Td>
                </Table.Tr>
              ))
            ) : metrics.users && Array.isArray(metrics.users)
              ? metrics.users.map((user: User) => (
                  <Table.Tr key={user.id} data-testid={`users-list-row-${user.id}`}>
                    <Table.Td data-testid={`users-list-user-cell-${user.id}`}>
                      <Group gap='sm'>
                        <Avatar size='sm' radius='xl' data-testid={`users-list-avatar-${user.id}`}>
                          {getUserInitials(user.name)}
                        </Avatar>
                        <div data-testid={`users-list-user-info-${user.id}`}>
                          <Text fw={500} data-testid={`users-list-user-name-${user.id}`}>{user.name}</Text>
                          <Text size='sm' c='dimmed' data-testid={`users-list-user-email-${user.id}`}>
                            {user.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td data-testid={`users-list-role-cell-${user.id}`}>
                      <Group gap='xs'>
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge
                              key={role}
                              color={getRoleColor(role as UserRole)}
                              variant='light'
                              size='sm'
                              data-testid={`users-list-role-badge-${user.id}-${role.toLowerCase()}`}
                            >
                              {role.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <Badge color='gray' variant='light' data-testid={`users-list-role-badge-${user.id}-unknown`}>
                            Unknown
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td data-testid={`users-list-status-cell-${user.id}`}>
                      <Badge
                        color={user.isActive ? colors.activeColor : colors.inactiveColor}
                        variant='light'
                        data-testid={`users-list-status-badge-${user.id}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td data-testid={`users-list-lastlogin-cell-${user.id}`}>
                      <Text size='sm' data-testid={`users-list-lastlogin-text-${user.id}`}>
                        {formatShortDate(user.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td data-testid={`users-list-created-cell-${user.id}`}>
                      <Text size='sm' data-testid={`users-list-created-text-${user.id}`}>
                        {formatShortDate(user.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td data-testid={`users-list-actions-cell-${user.id}`}>
                      <Menu shadow='md' width={200} data-testid={`users-list-menu-${user.id}`}>
                        <Menu.Target>
                          <ActionIcon variant='subtle' data-testid={`users-list-menu-button-${user.id}`}>
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown data-testid={`users-list-menu-dropdown-${user.id}`}>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => handlers.onViewUser(user.id)}
                            data-testid={`users-list-view-${user.id}`}
                          >
                            View
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handlers.onEditUser(user.id)}
                            data-testid={`users-list-edit-${user.id}`}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Divider data-testid={`users-list-menu-divider-${user.id}`} />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color={theme.colors[theme.primaryColor][9]}
                            onClick={() => onSetSelectedUser(user)}
                            data-testid={`users-list-delete-${user.id}`}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              : null}
          </Table.Tbody>
        </Table>
      </Card>

      {!isLoading &&
        metrics.users &&
        Array.isArray(metrics.users) &&
        metrics.users.length === 0 && (
          <Card shadow='sm' padding='xl' radius='md' withBorder mt='md' data-testid="no-users-found-card">
            <Stack align='center' gap='md' data-testid="no-users-found-stack">
              <IconUsers size={48} color='var(--mantine-color-dimmed)' data-testid="no-users-found-icon" />
              <Text size='lg' fw={500} data-testid="no-users-found-message">
                No users found
              </Text>
              <Text c='dimmed' ta='center' data-testid="no-users-found-hint">
                No users match your current filters.
              </Text>
              <Button onClick={handlers.onCreateUser} data-testid="no-users-add-first-button">Add your first user</Button>
            </Stack>
          </Card>
        )}

      <Modal
        opened={state.deleteModalOpen}
        onClose={handlers.onDeleteModalClose}
        title='Delete User'
        centered
        data-testid="delete-user-modal"
      >
        <Text mb='md' data-testid="delete-user-modal-message">
          Are you sure you want to delete user "{state.selectedUser?.name}"? This
          action cannot be undone.
        </Text>
        <Group justify='flex-end' data-testid="delete-user-modal-actions">
          <Button variant='light' onClick={handlers.onDeleteModalClose} data-testid="delete-user-modal-cancel-button">
            Cancel
          </Button>
          <Button
            color={theme.colors[theme.primaryColor][9]}
            onClick={() =>
              state.selectedUser?.id && handlers.onDeleteUser(state.selectedUser.id)
            }
            data-testid="delete-user-modal-confirm-button"
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

