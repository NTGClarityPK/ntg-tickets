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
  Switch,
  Select,
  Divider,
  Alert,
  Loader,
  Tabs,
} from '@mantine/core';
import {
  IconBell,
  IconShield,
  IconPalette,
  IconDeviceFloppy,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTheme } from '../../hooks/useTheme';

interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: string;
  ticketUpdates: boolean;
  comments: boolean;
  statusChanges: boolean;
  slaWarnings: boolean;

  // Privacy
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  profileVisibility: string;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string | null>('appearance');
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserSettings>({
    initialValues: {
      // Appearance
      theme: theme || 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',

      // Notifications
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationFrequency: 'immediate',
      ticketUpdates: true,
      comments: true,
      statusChanges: true,
      slaWarnings: true,

      // Privacy
      showOnlineStatus: true,
      allowDirectMessages: true,
      profileVisibility: 'public',
    },
  });

  const handleSave = async (values: UserSettings) => {
    setIsLoading(true);
    try {
      // Update theme if changed
      if (values.theme !== theme) {
        setTheme(values.theme);
      }

      // Here you would typically save to backend
      // await updateUserSettings(values);

      setSaved(true);
      notifications.show({
        title: 'Success',
        message: 'Settings saved successfully',
        color: 'green',
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save settings',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading settings...</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>{t('title')}</Title>
          <Text c='dimmed'>Customize your experience and preferences</Text>
        </div>
        <Group>
          {isLoading && <Loader size='sm' />}
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            color={saved ? 'green' : 'blue'}
            loading={isLoading}
            onClick={() => form.onSubmit(handleSave)()}
          >
            {saved ? 'Saved!' : t('saveChanges')}
          </Button>
        </Group>
      </Group>

      {saved && (
        <Alert
          icon={<IconCheck size={16} />}
          title='Settings Saved'
          color='green'
          mb='md'
        >
          Your settings have been saved successfully.
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value='appearance' leftSection={<IconPalette size={16} />}>
            {t('appearance')}
          </Tabs.Tab>
          <Tabs.Tab value='notifications' leftSection={<IconBell size={16} />}>
            {t('notifications')}
          </Tabs.Tab>
          <Tabs.Tab value='privacy' leftSection={<IconShield size={16} />}>
            {t('privacy')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='appearance' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Appearance Settings
            </Title>
            <form onSubmit={form.onSubmit(handleSave)}>
              <Stack gap='md'>
                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label='Theme'
                      placeholder='Select theme'
                      data={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'auto', label: 'Auto (System)' },
                      ]}
                      {...form.getInputProps('theme')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label='Language'
                      placeholder='Select language'
                      data={[
                        { value: 'en', label: 'English' },
                        { value: 'ar', label: 'العربية' },
                      ]}
                      {...form.getInputProps('language')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label='Timezone'
                      placeholder='Select timezone'
                      data={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'EST', label: 'Eastern Time' },
                        { value: 'PST', label: 'Pacific Time' },
                        { value: 'GMT', label: 'Greenwich Mean Time' },
                      ]}
                      {...form.getInputProps('timezone')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label='Date Format'
                      placeholder='Select date format'
                      data={[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                      ]}
                      {...form.getInputProps('dateFormat')}
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label='Time Format'
                      placeholder='Select time format'
                      data={[
                        { value: '12h', label: '12 Hour (AM/PM)' },
                        { value: '24h', label: '24 Hour' },
                      ]}
                      {...form.getInputProps('timeFormat')}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='notifications' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Notification Settings
            </Title>
            <form onSubmit={form.onSubmit(handleSave)}>
              <Stack gap='md'>
                <Switch
                  label='Email Notifications'
                  description='Receive notifications via email'
                  {...form.getInputProps('emailNotifications', {
                    type: 'checkbox',
                  })}
                />
                <Switch
                  label='Push Notifications'
                  description='Receive push notifications in browser'
                  {...form.getInputProps('pushNotifications', {
                    type: 'checkbox',
                  })}
                />
                <Switch
                  label='SMS Notifications'
                  description='Receive notifications via SMS'
                  {...form.getInputProps('smsNotifications', {
                    type: 'checkbox',
                  })}
                />

                <Divider />

                <Select
                  label='Notification Frequency'
                  placeholder='Select frequency'
                  data={[
                    { value: 'immediate', label: 'Immediate' },
                    { value: 'hourly', label: 'Hourly Digest' },
                    { value: 'daily', label: 'Daily Digest' },
                    { value: 'weekly', label: 'Weekly Digest' },
                  ]}
                  {...form.getInputProps('notificationFrequency')}
                />

                <Divider />

                <Text size='sm' fw={500} mb='sm'>
                  What to notify me about:
                </Text>

                <Switch
                  label='Ticket Updates'
                  description='When tickets are updated or modified'
                  {...form.getInputProps('ticketUpdates', { type: 'checkbox' })}
                />
                <Switch
                  label='New Comments'
                  description='When new comments are added to tickets'
                  {...form.getInputProps('comments', { type: 'checkbox' })}
                />
                <Switch
                  label='Status Changes'
                  description='When ticket status changes'
                  {...form.getInputProps('statusChanges', { type: 'checkbox' })}
                />
                <Switch
                  label='SLA Warnings'
                  description='When tickets are approaching SLA deadlines'
                  {...form.getInputProps('slaWarnings', { type: 'checkbox' })}
                />
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='privacy' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Privacy Settings
            </Title>
            <form onSubmit={form.onSubmit(handleSave)}>
              <Stack gap='md'>
                <Switch
                  label='Show Online Status'
                  description='Let others see when you are online'
                  {...form.getInputProps('showOnlineStatus', {
                    type: 'checkbox',
                  })}
                />
                <Switch
                  label='Allow Direct Messages'
                  description='Allow other users to send you direct messages'
                  {...form.getInputProps('allowDirectMessages', {
                    type: 'checkbox',
                  })}
                />

                <Select
                  label='Profile Visibility'
                  placeholder='Select visibility'
                  data={[
                    { value: 'public', label: 'Public' },
                    { value: 'team', label: 'Team Only' },
                    { value: 'private', label: 'Private' },
                  ]}
                  {...form.getInputProps('profileVisibility')}
                />

                <Alert icon={<IconAlertCircle size={16} />} color='red'>
                  <Text size='sm'>
                    These settings control how your information is displayed to
                    other users. Changes may take a few minutes to take effect.
                  </Text>
                </Alert>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
