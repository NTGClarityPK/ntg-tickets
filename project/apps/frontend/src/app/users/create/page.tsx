'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Alert,
  useMantineTheme,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { RTLArrowLeft } from '../../../components/ui/RTLIcon';
import { notifications } from '@mantine/notifications';
import { UserForm } from '../../../components/forms/UserForm';
import { useCreateUser } from '../../../hooks/useUsers';
import { UserFormData, UserRole } from '../../../types/unified';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function CreateUserPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const t = useTranslations('users');
  const router = useRouter();
  const createUserMutation = useCreateUser();

  const handleSubmit = async (data: UserFormData) => {
    try {
      await createUserMutation.mutateAsync({
        ...data,
        roles: data.roles as UserRole[],
        password: data.password || '',
      });
      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: primaryLight,
      });
      router.push('/admin/users');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user. Please check the form and try again.';
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: primaryDark,
      });
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  return (
    <Container size='md' py='md'>
      <Group mb='xl'>
        <Button
          variant='subtle'
          leftSection={<RTLArrowLeft size={16} />}
          onClick={handleCancel}
        >
          {t('backToUsers')}
        </Button>
        <div>
          <Title order={1}>{t('createUser')}</Title>
          <Text c='dimmed'>Add a new user to the system</Text>
        </div>
      </Group>

      <Card shadow='sm' padding='lg' radius='md' withBorder>
        <UserForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={false}
        />
      </Card>

      {createUserMutation.isError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title='Error'
          color={theme.colors[theme.primaryColor][9]}
          mt='md'
        >
          Failed to create user. Please check the form and try again.
        </Alert>
      )}
    </Container>
  );
}
