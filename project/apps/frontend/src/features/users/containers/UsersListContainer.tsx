'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Alert, useMantineTheme } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useUsers, useDeleteUser } from '../../../hooks/useUsers';
import { User } from '../../../lib/apiClient';
import { useAuthUser } from '../../../stores/useAuthStore';
import { UserRole } from '../../../types/unified';
import { notifications } from '@mantine/notifications';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useDebounce } from '../../../hooks/useDebounce';
import { UsersListPresenter } from '../presenters/UsersListPresenter';
import {
  UsersListMetrics,
  UsersListState,
  UsersListColors,
  UsersListHandlers,
} from '../types/users.types';

export function UsersListContainer() {
  const theme = useMantineTheme();
  const router = useRouter();
  const { primaryLight, primaryLighter, primaryDark, primaryDarkest } =
    useDynamicTheme();
  const user = useAuthUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Debounce search term to avoid API calls on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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

  const filters = useMemo(
    () => ({
      page: currentPage,
      limit: 20,
      search: debouncedSearchTerm || undefined,
      role: roleFilter || undefined,
      isActive: statusFilter ? statusFilter === 'true' : undefined,
    }),
    [currentPage, debouncedSearchTerm, roleFilter, statusFilter]
  );

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

  const getRoleColor = (role: UserRole): string => {
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

  const metrics: UsersListMetrics = {
    users,
    totalCount: users.length,
  };

  const state: UsersListState = {
    searchTerm,
    roleFilter,
    statusFilter,
    currentPage,
    selectedUser,
    deleteModalOpen,
  };

  const colors: UsersListColors = {
    roleColors: {
      [UserRole.ADMIN]: primaryDarkest,
      [UserRole.SUPPORT_MANAGER]: primaryDark,
      [UserRole.SUPPORT_STAFF]: primaryDark,
      [UserRole.END_USER]: primaryLight,
    },
    activeColor: primaryLighter,
    inactiveColor: primaryDark,
  };

  const handlers: UsersListHandlers = {
    onCreateUser: handleCreateUser,
    onViewUser: handleViewUser,
    onEditUser: handleEditUser,
    onDeleteUser: handleDeleteUser,
    onPageChange: setCurrentPage,
    onSearchChange: setSearchTerm,
    onRoleFilterChange: setRoleFilter,
    onStatusFilterChange: setStatusFilter,
    onDeleteModalClose: () => setDeleteModalOpen(false),
  };


  if (error) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]}>
          Failed to load users: {String(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <UsersListPresenter
      metrics={metrics}
      state={state}
      colors={colors}
      handlers={handlers}
      isLoading={isLoading}
      onSetSelectedUser={(user) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
      }}
      getRoleColor={getRoleColor}
    />
  );
}

