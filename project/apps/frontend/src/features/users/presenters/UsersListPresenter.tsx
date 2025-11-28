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
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>{tUsers('title')}</Title>
          <Text c='dimmed'>{tUsers('manageUsersPermissions')}</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handlers.onCreateUser}>
          {tUsers('addUser')}
        </Button>
      </Group>

      <Grid mb='md'>
        <Grid.Col span={6}>
          <TextInput
            placeholder={tUsers('searchUsers')}
            leftSection={<IconSearch size={16} />}
            value={state.searchTerm}
            onChange={e => handlers.onSearchChange(e.target.value)}
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
          />
        </Grid.Col>
      </Grid>

      <Card shadow='sm' padding='lg' radius='md' withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{tUsers('user')}</Table.Th>
              <Table.Th>{tUsers('role')}</Table.Th>
              <Table.Th>{tUsers('status')}</Table.Th>
              <Table.Th>{tUsers('lastLogin')}</Table.Th>
              <Table.Th>{tUsers('created')}</Table.Th>
              <Table.Th>{t('actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              [...Array(5)].map((_, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Group gap='sm'>
                      <Skeleton height={32} width={32} circle />
                      <div>
                        <Skeleton height={16} width={150} mb={4} />
                        <Skeleton height={14} width={200} />
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={24} width={100} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={24} width={70} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width={100} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width={100} />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={28} width={28} circle />
                  </Table.Td>
                </Table.Tr>
              ))
            ) : metrics.users && Array.isArray(metrics.users)
              ? metrics.users.map((user: User) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap='sm'>
                        <Avatar size='sm' radius='xl'>
                          {getUserInitials(user.name)}
                        </Avatar>
                        <div>
                          <Text fw={500}>{user.name}</Text>
                          <Text size='sm' c='dimmed'>
                            {user.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap='xs'>
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge
                              key={role}
                              color={getRoleColor(role as UserRole)}
                              variant='light'
                              size='sm'
                            >
                              {role.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <Badge color='gray' variant='light'>
                            Unknown
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={user.isActive ? colors.activeColor : colors.inactiveColor}
                        variant='light'
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        {formatShortDate(user.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        {formatShortDate(user.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow='md' width={200}>
                        <Menu.Target>
                          <ActionIcon variant='subtle'>
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => handlers.onViewUser(user.id)}
                          >
                            View
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handlers.onEditUser(user.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color={theme.colors[theme.primaryColor][9]}
                            onClick={() => onSetSelectedUser(user)}
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
          <Card shadow='sm' padding='xl' radius='md' withBorder mt='md'>
            <Stack align='center' gap='md'>
              <IconUsers size={48} color='var(--mantine-color-dimmed)' />
              <Text size='lg' fw={500}>
                No users found
              </Text>
              <Text c='dimmed' ta='center'>
                No users match your current filters.
              </Text>
              <Button onClick={handlers.onCreateUser}>Add your first user</Button>
            </Stack>
          </Card>
        )}

      <Modal
        opened={state.deleteModalOpen}
        onClose={handlers.onDeleteModalClose}
        title='Delete User'
        centered
      >
        <Text mb='md'>
          Are you sure you want to delete user "{state.selectedUser?.name}"? This
          action cannot be undone.
        </Text>
        <Group justify='flex-end'>
          <Button variant='light' onClick={handlers.onDeleteModalClose}>
            Cancel
          </Button>
          <Button
            color={theme.colors[theme.primaryColor][9]}
            onClick={() =>
              state.selectedUser?.id && handlers.onDeleteUser(state.selectedUser.id)
            }
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

