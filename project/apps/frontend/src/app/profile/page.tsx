'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Grid,
  Card,
  Stack,
  Avatar,
  Badge,
  Divider,
  Alert,
  Loader,
  Tabs,
  TextInput,
  Select,
  Switch,
  PasswordInput,
} from '@mantine/core';
import {
  IconUser,
  IconShield,
  IconBell,
  IconDeviceFloppy,
  IconCheck,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUpdateUser } from '../../hooks/useUsers';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
// import { UserRole } from '../../types/unified'; // Removed unused import

import { useDynamicTheme } from '../../hooks/useDynamicTheme';

export default function ProfilePage() {
  const { primaryLight, primaryDark, primaryDarkest } = useDynamicTheme();
  const t = useTranslations('profile');
  const { user } = useAuthStore();
  const updateUserMutation = useUpdateUser();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return primaryDarkest;
      case 'SUPPORT_MANAGER':
        return primaryDark;
      case 'SUPPORT_STAFF':
        return primaryDark;
      case 'END_USER':
        return primaryLight;
      default:
        return primaryLight;
    }
  };
  const { validatePassword } = usePasswordValidation();
  const [activeTab, setActiveTab] = useState<string | null>('profile');
  const [saved, setSaved] = useState(false);

  const profileForm = useForm({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    validate: {
      name: (value: string) => (!value ? 'Name is required' : null),
      email: (value: string) =>
        !/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email' : null,
    },
  });

  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: value =>
        !value ? 'Current password is required' : null,
      newPassword: value => {
        if (!value) return 'New password is required';
        return validatePassword(value);
      },
      confirmPassword: (value, values) => {
        if (value !== values.newPassword) return 'Passwords do not match';
        return null;
      },
    },
  });

  const handleProfileUpdate = async (values: {
    name: string;
    email: string;
  }) => {
    if (!user) return;

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: values,
      });

      setSaved(true);
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red',
      });
    }
  };

  const handlePasswordChange = async () => {
    // This would need to be implemented in the backend
    notifications.show({
      title: 'Info',
      message: 'Password change functionality needs backend implementation',
      color: 'red',
    });
  };

  if (!user) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading profile...</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>{t('title')}</Title>
          <Text c='dimmed'>Manage your account settings and preferences</Text>
        </div>
        <Group>
          {updateUserMutation.isPending && <Loader size='sm' />}
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            color={saved ? 'green' : 'red'}
            loading={updateUserMutation.isPending}
            onClick={() => profileForm.onSubmit(handleProfileUpdate)()}
          >
            {saved ? t('saved') : t('saveChanges')}
          </Button>
        </Group>
      </Group>

      {saved && (
        <Alert
          icon={<IconCheck size={16} />}
          title={t('profileUpdated')}
          color='green'
          mb='md'
        >
          {t('profileUpdated')}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value='profile' leftSection={<IconUser size={16} />}>
            {t('personalInfo')}
          </Tabs.Tab>
          <Tabs.Tab value='security' leftSection={<IconShield size={16} />}>
            {t('security')}
          </Tabs.Tab>
          <Tabs.Tab value='notifications' leftSection={<IconBell size={16} />}>
            {t('notifications')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='profile' pt='md'>
          <Grid>
            <Grid.Col span={8}>
              <Card shadow='sm' padding='lg' radius='md' withBorder>
                <Title order={3} mb='md'>
                  Personal Information
                </Title>
                <form onSubmit={profileForm.onSubmit(handleProfileUpdate)}>
                  <Stack gap='md'>
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label={t('fullName')}
                          placeholder='Enter your full name'
                          required
                          {...profileForm.getInputProps('name')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label={t('email')}
                          placeholder='Enter your email'
                          required
                          type='email'
                          {...profileForm.getInputProps('email')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </form>
              </Card>
            </Grid.Col>

            <Grid.Col span={4}>
              <Stack gap='md'>
                <Card shadow='sm' padding='lg' radius='md' withBorder>
                  <Title order={4} mb='md'>
                    Profile Picture
                  </Title>
                  <Stack align='center' gap='md'>
                    <Avatar size={120} radius='xl'>
                      {user.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </Avatar>
                    <Button variant='outline' size='sm'>
                      Change Picture
                    </Button>
                  </Stack>
                </Card>

                <Card shadow='sm' padding='lg' radius='md' withBorder>
                  <Title order={4} mb='md'>
                    Account Information
                  </Title>
                  <Stack gap='sm'>
                    <Group justify='space-between'>
                      <Text size='sm' fw={500}>
                        Role
                      </Text>
                      <Badge
                        color={getRoleColor(user.activeRole)}
                        variant='light'
                      >
                        {user.activeRole.replace('_', ' ')}
                      </Badge>
                    </Group>
                    <Group justify='space-between'>
                      <Text size='sm' fw={500}>
                        Status
                      </Text>
                      <Badge
                        color={user.isActive ? 'green' : 'red'}
                        variant='light'
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Group>
                    <Group justify='space-between'>
                      <Text size='sm' fw={500}>
                        Member Since
                      </Text>
                      <Text size='sm' c='dimmed'>
                        N/A
                      </Text>
                    </Group>
                    <Group justify='space-between'>
                      <Text size='sm' fw={500}>
                        Last Updated
                      </Text>
                      <Text size='sm' c='dimmed'>
                        N/A
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value='security' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Change Password
            </Title>
            <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
              <Stack gap='md'>
                <PasswordInput
                  label={t('currentPassword')}
                  placeholder='Enter current password'
                  required
                  {...passwordForm.getInputProps('currentPassword')}
                />
                <Grid>
                  <Grid.Col span={6}>
                    <PasswordInput
                      label={t('newPassword')}
                      placeholder='Enter new password'
                      required
                      {...passwordForm.getInputProps('newPassword')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <PasswordInput
                      label='Confirm New Password'
                      placeholder='Confirm new password'
                      required
                      {...passwordForm.getInputProps('confirmPassword')}
                    />
                  </Grid.Col>
                </Grid>
                <Group justify='flex-end'>
                  <Button type='submit'>Change Password</Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='notifications' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Notification Preferences
            </Title>
            <Stack gap='md'>
              <Switch
                label={t('emailNotifications')}
                description='Receive notifications via email'
                defaultChecked
              />
              <Switch
                label={t('pushNotifications')}
                description='Receive push notifications in browser'
                defaultChecked
              />
              <Switch
                label='SMS Notifications'
                description='Receive notifications via SMS'
              />
              <Divider />
              <Select
                label={t('notificationFrequency')}
                placeholder='Select frequency'
                data={[
                  { value: 'immediate', label: 'Immediate' },
                  { value: 'hourly', label: 'Hourly Digest' },
                  { value: 'daily', label: 'Daily Digest' },
                  { value: 'weekly', label: 'Weekly Digest' },
                ]}
                defaultValue='immediate'
              />
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
