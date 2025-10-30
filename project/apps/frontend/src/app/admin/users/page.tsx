'use client';

import { useState, useEffect } from 'react';
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
  Pagination,
  Loader,
  Alert,
  Table,
  ActionIcon,
  Menu,
  Modal,
  Avatar,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconUsers,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useUsers, useDeleteUser } from '../../../hooks/useUsers';
import { User } from '../../../lib/apiClient';
import { useAuthStore } from '../../../stores/useAuthStore';
import { UserRole } from '../../../types/unified';
import { notifications } from '@mantine/notifications';

import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function UsersPage() {
  const { primaryLight, primaryLighter, primaryDark, primaryDarkest } = useDynamicTheme();
  const t = useTranslations('common');
  const tUsers = useTranslations('users');
  const router = useRouter();
  const { user } = useAuthStore();

  const getRoleColor = (role: UserRole) => {
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

  // Check if user has admin role
  useEffect(() => {
    if (user && user.activeRole !== UserRole.ADMIN) {
      notifications.show({
        title: 'Access Denied',
        message: 'Only administrators can manage users',
        color: primaryDark,
      });
      router.push('/dashboard');
    }
  }, [user, router, primaryDark]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const filters = {
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter ? statusFilter === 'true' : undefined,
  };

  const { data: usersData, isLoading, error } = useUsers(filters);
  const deleteUserMutation = useDeleteUser();

  const users = usersData || [];

  const handleCreateUser = () => {
    router.push('/users/create');
  };

  const handleViewUser = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      setDeleteModalOpen(false);
    } catch (error) {
      // Handle delete error silently or show user notification
    }
  };

  // Users are already filtered by the API, no need for client-side filtering
  const filteredUsers = users;

  if (isLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading users...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md'>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t('error')}
          color='red'
        >
          Failed to load users: {String(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>{tUsers('title')}</Title>
          <Text c='dimmed'>{tUsers('manageUsersPermissions')}</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateUser}>
          {tUsers('addUser')}
        </Button>
      </Group>

      <Grid mb='md'>
        <Grid.Col span={6}>
          <TextInput
            placeholder={tUsers('searchUsers')}
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
            value={roleFilter}
            onChange={setRoleFilter}
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
            value={statusFilter}
            onChange={setStatusFilter}
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
            {filteredUsers && Array.isArray(filteredUsers)
              ? filteredUsers.map((user: User) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap='sm'>
                        <Avatar size='sm' radius='xl'>
                          {(() => {
                            const nameParts = user.name.split(' ').filter((n: string) => n.length > 0);
                            if (nameParts.length === 0) return '';
                            
                            const getInitial = (name: string) => {
                              if (name.includes('-')) {
                                const hyphenIndex = name.indexOf('-');
                                return name[hyphenIndex + 1] || name[0];
                              }
                              return name[0];
                            };
                            
                            if (nameParts.length === 1) return getInitial(nameParts[0]).toUpperCase();
                            return getInitial(nameParts[0]).toUpperCase() + getInitial(nameParts[nameParts.length - 1]).toUpperCase();
                          })()}
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
                        color={user.isActive ? primaryLighter : primaryDark}
                        variant='light'
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        {new Date(user.createdAt).toLocaleDateString()}
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
                            onClick={() => handleViewUser(user.id)}
                          >
                            View
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleEditUser(user.id)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color='red'
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteModalOpen(true);
                            }}
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

      {filteredUsers &&
        Array.isArray(filteredUsers) &&
        filteredUsers.length === 0 && (
          <Card shadow='sm' padding='xl' radius='md' withBorder mt='md'>
            <Stack align='center' gap='md'>
              <IconUsers size={48} color='var(--mantine-color-dimmed)' />
              <Text size='lg' fw={500}>
                No users found
              </Text>
              <Text c='dimmed' ta='center'>
                No users match your current filters.
              </Text>
              <Button onClick={handleCreateUser}>Add your first user</Button>
            </Stack>
          </Card>
        )}

      {/* Pagination temporarily disabled - need to implement separate hook for paginated users */}
      {false && (
        <Group justify='center' mt='xl'>
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={1} // Pagination disabled
          />
        </Group>
      )}

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete User'
        centered
      >
        <Text mb='md'>
          Are you sure you want to delete user "{selectedUser?.name}"? This
          action cannot be undone.
        </Text>
        <Group justify='flex-end'>
          <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            color='red'
            onClick={() =>
              selectedUser?.id && handleDeleteUser(selectedUser.id)
            }
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
