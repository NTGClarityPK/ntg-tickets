'use client';

import { useState } from 'react';
import {
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Grid,
  Switch,
  Text,
  Alert,
  Divider,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showErrorNotification } from '@/lib/notifications';

// System settings interface
export interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  timezone: string;
  language: string;

  // Ticket Settings
  autoAssignTickets: boolean;
  autoCloseResolvedTickets: boolean;
  autoCloseDays: number;
  maxFileSize: number;
  maxFilesPerTicket: number;

  // SLA Settings
  standardResponseTime: number;
  standardResolutionTime: number;
  premiumResponseTime: number;
  premiumResolutionTime: number;
  criticalResponseTime: number;
  criticalResolutionTime: number;

  // Email Settings
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;

  // Security Settings
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;

  // Notification Settings
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  slaWarnings: boolean;
  autoCloseWarnings: boolean;
}

interface SystemSettingsFormProps {
  onSubmit: (data: SystemSettings) => void;
  onCancel: () => void;
}

export function SystemSettingsForm({
  onSubmit,
  onCancel,
}: SystemSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SystemSettings>({
    initialValues: {
      // General Settings
      siteName: 'NTG Ticket',
      siteDescription: 'IT Support - Ticket Management System',
      timezone: 'UTC',
      language: 'en',

      // Ticket Settings
      autoAssignTickets: true,
      autoCloseResolvedTickets: true,
      autoCloseDays: 5,
      maxFileSize: 10,
      maxFilesPerTicket: 10,

      // SLA Settings
      standardResponseTime: 8,
      standardResolutionTime: 40,
      premiumResponseTime: 4,
      premiumResolutionTime: 16,
      criticalResponseTime: 0,
      criticalResolutionTime: 4,

      // Email Settings
      smtpEnabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: false,
      fromEmail: 'noreply@ntg-ticket.com',
      fromName: 'NTG Ticket',

      // Security Settings
      passwordMinLength: 8,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      lockoutDuration: 30,

      // Notification Settings
      emailNotifications: true,
      inAppNotifications: true,
      pushNotifications: false,
      slaWarnings: true,
      autoCloseWarnings: true,
    },
  });

  const handleSubmit = async (values: SystemSettings) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      showErrorNotification('Error', 'Failed to save system settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap='md'>
        <Title order={4}>General Settings</Title>
        <Grid>
          <Grid.Col span={6}>
            <TextInput label='Site Name' {...form.getInputProps('siteName')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label='Timezone' {...form.getInputProps('timezone')} />
          </Grid.Col>
        </Grid>

        <TextInput
          label='Site Description'
          {...form.getInputProps('siteDescription')}
        />

        <Divider />
        <Title order={4}>Ticket Settings</Title>
        <Grid>
          <Grid.Col span={6}>
            <Switch
              label='Auto-assign tickets'
              description='Automatically assign tickets based on priority and SLA'
              {...form.getInputProps('autoAssignTickets', { type: 'checkbox' })}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Switch
              label='Auto-close resolved tickets'
              description='Automatically close resolved tickets after specified days'
              {...form.getInputProps('autoCloseResolvedTickets', {
                type: 'checkbox',
              })}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label='Auto-close days'
              description='Days after resolution to auto-close'
              min={1}
              max={30}
              {...form.getInputProps('autoCloseDays')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label='Max file size (MB)'
              description='Maximum file size per attachment'
              min={1}
              max={100}
              {...form.getInputProps('maxFileSize')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label='Max files per ticket'
              description='Maximum number of files per ticket'
              min={1}
              max={50}
              {...form.getInputProps('maxFilesPerTicket')}
            />
          </Grid.Col>
        </Grid>

        <Divider />
        <Title order={4}>SLA Settings (Business Hours)</Title>
        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label='Standard Response Time'
              description='Hours'
              min={0}
              max={24}
              {...form.getInputProps('standardResponseTime')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label='Standard Resolution Time'
              description='Hours'
              min={0}
              max={168}
              {...form.getInputProps('standardResolutionTime')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label='Premium Response Time'
              description='Hours'
              min={0}
              max={24}
              {...form.getInputProps('premiumResponseTime')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label='Premium Resolution Time'
              description='Hours'
              min={0}
              max={168}
              {...form.getInputProps('premiumResolutionTime')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label='Critical Response Time'
              description='Hours'
              min={0}
              max={24}
              {...form.getInputProps('criticalResponseTime')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label='Critical Resolution Time'
              description='Hours'
              min={0}
              max={168}
              {...form.getInputProps('criticalResolutionTime')}
            />
          </Grid.Col>
        </Grid>

        <Divider />
        <Title order={4}>Email Settings</Title>
        <Grid>
          <Grid.Col span={6}>
            <Switch
              label='Enable SMTP'
              description='Enable email notifications'
              {...form.getInputProps('smtpEnabled', { type: 'checkbox' })}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Switch
              label='Secure SMTP'
              description='Use SSL/TLS for SMTP'
              {...form.getInputProps('smtpSecure', { type: 'checkbox' })}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <TextInput label='SMTP Host' {...form.getInputProps('smtpHost')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label='SMTP Port'
              min={1}
              max={65535}
              {...form.getInputProps('smtpPort')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label='From Email'
              {...form.getInputProps('fromEmail')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label='From Name' {...form.getInputProps('fromName')} />
          </Grid.Col>
        </Grid>

        <Divider />
        <Title order={4}>Security Settings</Title>
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label='Password Min Length'
              description='Minimum password length'
              min={6}
              max={32}
              {...form.getInputProps('passwordMinLength')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label='Session Timeout (hours)'
              description='User session timeout'
              min={1}
              max={168}
              {...form.getInputProps('sessionTimeout')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label='Max Login Attempts'
              description='Maximum failed login attempts'
              min={3}
              max={10}
              {...form.getInputProps('maxLoginAttempts')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label='Lockout Duration (minutes)'
              description='Account lockout duration'
              min={5}
              max={1440}
              {...form.getInputProps('lockoutDuration')}
            />
          </Grid.Col>
        </Grid>

        <Divider />
        <Title order={4}>Notification Settings</Title>
        <Grid>
          <Grid.Col span={4}>
            <Switch
              label='Email Notifications'
              description='Send email notifications'
              {...form.getInputProps('emailNotifications', {
                type: 'checkbox',
              })}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Switch
              label='In-App Notifications'
              description='Show in-app notifications'
              {...form.getInputProps('inAppNotifications', {
                type: 'checkbox',
              })}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Switch
              label='Push Notifications'
              description='Send browser push notifications'
              {...form.getInputProps('pushNotifications', { type: 'checkbox' })}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <Switch
              label='SLA Warnings'
              description='Send SLA breach warnings'
              {...form.getInputProps('slaWarnings', { type: 'checkbox' })}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Switch
              label='Auto-close Warnings'
              description='Send auto-close warnings'
              {...form.getInputProps('autoCloseWarnings', { type: 'checkbox' })}
            />
          </Grid.Col>
        </Grid>

        <Alert color='yellow' title='Important'>
          <Text size='sm'>
            Some settings may require a system restart to take effect. Please
            test changes in a staging environment before applying to production.
          </Text>
        </Alert>

        <Group justify='flex-end' mt='xl'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting}>
            Save Settings
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
