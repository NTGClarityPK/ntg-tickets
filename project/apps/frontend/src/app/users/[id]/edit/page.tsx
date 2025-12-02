'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Alert,
  Loader,
  useMantineTheme,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { RTLArrowLeft } from '../../../../components/ui/RTLIcon';
import { notifications } from '@mantine/notifications';
import { UserForm } from '../../../../components/forms/UserForm';
import { useUser, useUpdateUser } from '../../../../hooks/useUsers';
import { UserFormData, UserRole } from '../../../../types/unified';
import { useDynamicTheme } from '../../../../hooks/useDynamicTheme';

export default function EditUserPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useUser(userId);
  const updateUserMutation = useUpdateUser();

  const handleSubmit = async (data: UserFormData) => {
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: {
          ...data,
          roles: data.roles as UserRole[],
        },
      });
      notifications.show({
        title: 'Success',
        message: 'User updated successfully',
        color: primaryLight,
      });
      router.push(`/users/${userId}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update user',
        color: primaryDark,
      });
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  if (isLoading) {
    return (
      <Container size='md' py='md' data-testid="edit-user-page-loading">
        <Group justify='center' mt='xl' data-testid="edit-user-page-loading-group">
          <Loader size='lg' data-testid="edit-user-page-loader" />
          <Text data-testid="edit-user-page-loading-text">Loading user details...</Text>
        </Group>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container size='md' py='md' data-testid="edit-user-page-error">
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]} data-testid="edit-user-page-error-alert">
          Failed to load user: {error?.message || 'User not found'}
        </Alert>
        <Group mt='md' data-testid="edit-user-page-error-actions">
          <Button
            variant='outline'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.push('/admin/users')}
            data-testid="edit-user-page-error-back-button"
          >
            Back to Users
          </Button>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='md' py='md' data-testid="edit-user-page">
      <Group mb='xl' data-testid="edit-user-page-header">
        <Button
          variant='subtle'
          leftSection={<RTLArrowLeft size={16} />}
          onClick={handleCancel}
          data-testid="edit-user-page-back-button"
        >
          Back to Users
        </Button>
        <div data-testid="edit-user-page-header-content">
          <Title order={1} data-testid="edit-user-page-title">Edit User</Title>
          <Text c='dimmed' data-testid="edit-user-page-subtitle">Update user information and settings</Text>
        </div>
      </Group>

      <Card shadow='sm' padding='lg' radius='md' withBorder data-testid="edit-user-page-card">
        <UserForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={user}
          isEditing={true}
        />
      </Card>

      {updateUserMutation.isError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title='Error'
          color={theme.colors[theme.primaryColor][9]}
          mt='md'
          data-testid="edit-user-page-update-error-alert"
        >
          Failed to update user. Please check the form and try again.
        </Alert>
      )}
    </Container>
  );
}
