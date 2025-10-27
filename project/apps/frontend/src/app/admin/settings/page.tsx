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
  TextInput,
  Select,
  Switch,
  NumberInput,
  Divider,
  Tabs,
  Alert,
  Loader,
} from '@mantine/core';
import {
  IconSettings,
  IconBell,
  IconShield,
  IconDatabase,
  IconMail,
  IconDeviceFloppy,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from '../../../hooks/useSystemSettings';
import { notifications } from '@mantine/notifications';
import { SYSTEM_DEFAULTS } from '../../../lib/constants';

export default function SettingsPage() {
  const t = useTranslations('common');
  const tSettings = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const { data: settings, isLoading, error } = useSystemSettings();
  const updateSettingsMutation = useUpdateSystemSettings();
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!settings) return;

    try {
      await updateSettingsMutation.mutateAsync(settings);
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
    }
  };

  const handleSettingChange = async (
    key: string,
    value: string | number | boolean
  ) => {
    if (!settings) return;

    try {
      // Use the mutation hook for proper state management
      await updateSettingsMutation.mutateAsync({ [key]: value });

      notifications.show({
        title: 'Success',
        message: 'Setting updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update setting',
        color: 'red',
      });
    }
  };

  if (isLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
        </Group>
      </Container>
    );
  }

  if (error || !settings) {
    return (
      <Container size='xl' py='md'>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t('error')}
          color='red'
        >
          Failed to load system settings. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>{tSettings('title')}</Title>
          <Text c='dimmed'>{tSettings('configureSettings')}</Text>
        </div>
        <Group>
          {updateSettingsMutation.isPending && <Loader size='sm' />}
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            color={saved ? 'green' : 'blue'}
            loading={updateSettingsMutation.isPending}
          >
            {saved ? t('saved') : tSettings('saveChanges')}
          </Button>
        </Group>
      </Group>

      {saved && (
        <Alert
          icon={<IconCheck size={16} />}
          title={tSettings('settingsUpdated')}
          color='green'
          mb='md'
        >
          {tSettings('settingsUpdated')}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value='general' leftSection={<IconSettings size={16} />}>
            {tSettings('general')}
          </Tabs.Tab>
          <Tabs.Tab value='notifications' leftSection={<IconBell size={16} />}>
            {tSettings('notifications')}
          </Tabs.Tab>
          <Tabs.Tab value='security' leftSection={<IconShield size={16} />}>
            {tSettings('security')}
          </Tabs.Tab>
          <Tabs.Tab value='system' leftSection={<IconDatabase size={16} />}>
            {t('system')}
          </Tabs.Tab>
          <Tabs.Tab value='email' leftSection={<IconMail size={16} />}>
            {t('email')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='general' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              {tSettings('general')} {tSettings('title')}
            </Title>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label={tSettings('siteName')}
                  placeholder={tSettings('siteNamePlaceholder')}
                  value={settings.siteName}
                  onChange={e =>
                    handleSettingChange('siteName', e.target.value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label={tSettings('siteDescription')}
                  placeholder={tSettings('siteDescriptionPlaceholder')}
                  value={settings.siteDescription}
                  onChange={e =>
                    handleSettingChange('siteDescription', e.target.value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label={tSettings('timezone')}
                  placeholder={tSettings('timezonePlaceholder')}
                  data={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'EST', label: 'Eastern Time' },
                    { value: 'PST', label: 'Pacific Time' },
                    { value: 'GMT', label: 'Greenwich Mean Time' },
                  ]}
                  value={settings.timezone}
                  onChange={value =>
                    value && handleSettingChange('timezone', value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label={tSettings('language')}
                  placeholder={tSettings('languagePlaceholder')}
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'ar', label: 'العربية' },
                  ]}
                  value={settings.language}
                  onChange={value =>
                    value && handleSettingChange('language', value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label={tSettings('dateFormat')}
                  placeholder={tSettings('dateFormatPlaceholder')}
                  data={[
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  ]}
                  value={settings.dateFormat}
                  onChange={value =>
                    value && handleSettingChange('dateFormat', value)
                  }
                />
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='notifications' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              {tSettings('notifications')} {tSettings('title')}
            </Title>
            <Stack gap='md'>
              <Switch
                label={tSettings('emailNotifications')}
                description={tSettings('emailNotificationsDescription')}
                checked={settings.emailNotifications}
                onChange={e =>
                  handleSettingChange(
                    'emailNotifications',
                    e.currentTarget.checked
                  )
                }
                disabled={updateSettingsMutation.isPending}
              />
              <Switch
                label={tSettings('pushNotifications')}
                description={tSettings('pushNotificationsDescription')}
                checked={settings.pushNotifications}
                onChange={e =>
                  handleSettingChange(
                    'pushNotifications',
                    e.currentTarget.checked
                  )
                }
              />
              <Switch
                label='SMS Notifications'
                description='Receive notifications via SMS'
                checked={settings.smsNotifications}
                onChange={e =>
                  handleSettingChange(
                    'smsNotifications',
                    e.currentTarget.checked
                  )
                }
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
                value={settings.notificationFrequency}
                onChange={value =>
                  value && handleSettingChange('notificationFrequency', value)
                }
              />
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='security' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Security Settings
            </Title>
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label='Minimum Password Length'
                  placeholder='Enter minimum length'
                  value={settings.passwordMinLength}
                  onChange={value =>
                    handleSettingChange('passwordMinLength', value)
                  }
                  min={6}
                  max={20}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label='Session Timeout (minutes)'
                  placeholder='Enter timeout'
                  value={settings.sessionTimeout}
                  onChange={value =>
                    handleSettingChange('sessionTimeout', value)
                  }
                  min={5}
                  max={480}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label='Max Login Attempts'
                  placeholder='Enter max attempts'
                  value={settings.maxLoginAttempts}
                  onChange={value =>
                    handleSettingChange('maxLoginAttempts', value)
                  }
                  min={3}
                  max={10}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Switch
                  label='Require Two-Factor Authentication'
                  description='Force 2FA for all users'
                  checked={settings.requireTwoFactor}
                  onChange={e =>
                    handleSettingChange(
                      'requireTwoFactor',
                      e.currentTarget.checked
                    )
                  }
                />
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='system' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              System Settings
            </Title>
            <Stack gap='md'>
              <Switch
                label='Auto-assign Tickets'
                description='Automatically assign tickets based on priority and SLA'
                checked={settings.autoAssignTickets}
                onChange={e =>
                  handleSettingChange(
                    'autoAssignTickets',
                    e.currentTarget.checked
                  )
                }
              />
              <Switch
                label='Auto-close Resolved Tickets'
                description='Automatically close resolved tickets after specified days'
                checked={settings.autoCloseResolved}
                onChange={e =>
                  handleSettingChange(
                    'autoCloseResolved',
                    e.currentTarget.checked
                  )
                }
              />
              {settings.autoCloseResolved && (
                <NumberInput
                  label='Auto-close After (days)'
                  placeholder='Enter number of days'
                  value={settings.autoCloseDays}
                  onChange={value =>
                    handleSettingChange('autoCloseDays', value)
                  }
                  min={1}
                  max={30}
                />
              )}
              <Divider />
              <Switch
                label='Enable Audit Log'
                description='Log all system activities for compliance'
                checked={settings.enableAuditLog}
                onChange={e =>
                  handleSettingChange('enableAuditLog', e.currentTarget.checked)
                }
              />
              <Switch
                label='Enable Automatic Backup'
                description='Automatically backup system data'
                checked={settings.enableBackup}
                onChange={e =>
                  handleSettingChange('enableBackup', e.currentTarget.checked)
                }
              />
              {settings.enableBackup && (
                <Select
                  label='Backup Frequency'
                  placeholder='Select frequency'
                  data={[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  value={settings.backupFrequency}
                  onChange={value =>
                    value && handleSettingChange('backupFrequency', value)
                  }
                />
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='email' pt='md'>
          <Card shadow='sm' padding='lg' radius='md' withBorder>
            <Title order={3} mb='md'>
              Email Settings
            </Title>
            <Alert
              icon={<IconAlertCircle size={16} />}
              title='SMTP Configuration'
              color='red'
              mb='md'
            >
              Configure your SMTP settings to enable email notifications and
              communications.
            </Alert>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label='SMTP Host'
                  placeholder='smtp.gmail.com'
                  value={settings.smtpHost}
                  onChange={e =>
                    handleSettingChange('smtpHost', e.target.value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label='SMTP Port'
                  placeholder={SYSTEM_DEFAULTS.EMAIL.SMTP_PORT.toString()}
                  value={settings.smtpPort}
                  onChange={value => handleSettingChange('smtpPort', value)}
                  min={1}
                  max={65535}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label='SMTP Username'
                  placeholder='your-email@gmail.com'
                  value={settings.smtpUsername}
                  onChange={e =>
                    handleSettingChange('smtpUsername', e.target.value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label='SMTP Password'
                  placeholder='Enter password'
                  type='password'
                  value={settings.smtpPassword}
                  onChange={e =>
                    handleSettingChange('smtpPassword', e.target.value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label='From Email'
                  placeholder='noreply@yourdomain.com'
                  value={settings.fromEmail}
                  onChange={e =>
                    handleSettingChange('fromEmail', e.target.value)
                  }
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label='From Name'
                  placeholder='Your Company Name'
                  value={settings.fromName}
                  onChange={e =>
                    handleSettingChange('fromName', e.target.value)
                  }
                />
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
