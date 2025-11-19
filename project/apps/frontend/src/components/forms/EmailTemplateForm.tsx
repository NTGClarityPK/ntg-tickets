'use client';

import { useState } from 'react';
import {
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  Switch,
  Textarea,
  Text,
  Alert,
  Code,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import {
  EmailTemplateType,
  EmailTemplate,
  EmailTemplateFormData,
} from '../../types/unified';

interface EmailTemplateFormProps {
  onSubmit: (data: EmailTemplateFormData) => void;
  onCancel: () => void;
  initialData?: EmailTemplate;
  isEditing?: boolean;
}

const templateTypes = [
  { value: EmailTemplateType.TICKET_CREATED, label: 'Ticket Created' },
  { value: EmailTemplateType.TICKET_ASSIGNED, label: 'Ticket Assigned' },
  { value: EmailTemplateType.STATUS_CHANGED, label: 'Status Changed' },
  { value: EmailTemplateType.COMMENT_ADDED, label: 'Comment Added' },
  { value: EmailTemplateType.SLA_WARNING, label: 'SLA Warning' },
  { value: EmailTemplateType.AUTO_CLOSE_WARNING, label: 'Auto-Close Warning' },
];

const availableVariables = [
  '{{userName}}',
  '{{ticketNumber}}',
  '{{title}}',
  '{{status}}',
  '{{priority}}',
  '{{dueDate}}',
  '{{assigneeName}}',
  '{{comment}}',
  '{{ticketUrl}}',
  '{{timeRemaining}}',
];

export function EmailTemplateForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: EmailTemplateFormProps) {
  const theme = useMantineTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmailTemplateFormData>({
    initialValues: {
      name: initialData?.name || '',
      type: initialData?.type || EmailTemplateType.TICKET_CREATED,
      subject: initialData?.subject || '',
      html: initialData?.html || '',
      isActive: initialData?.isActive ?? true,
    },
    validate: {
      name: value => (!value ? 'Name is required' : null),
      type: value => (!value ? 'Type is required' : null),
      subject: value => (!value ? 'Subject is required' : null),
      html: value => (!value ? 'HTML content is required' : null),
    },
  });

  const handleSubmit = async (values: EmailTemplateFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save email template',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap='md'>
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label='Template Name'
              placeholder='Enter template name'
              required
              {...form.getInputProps('name')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label='Template Type'
              placeholder='Select type'
              required
              data={templateTypes}
              {...form.getInputProps('type')}
            />
          </Grid.Col>
        </Grid>

        <TextInput
          label='Subject'
          placeholder='Enter email subject'
          required
          {...form.getInputProps('subject')}
        />

        <div>
          <Text size='sm' fw={500} mb='xs'>
            HTML Content
          </Text>
          <Textarea
            placeholder='Enter HTML content'
            required
            minRows={8}
            {...form.getInputProps('html')}
          />
          <Text size='xs' color='dimmed' mt='xs'>
            Use Handlebars syntax for variables. Available variables:{' '}
            {availableVariables.join(', ')}
          </Text>
        </div>

        <Alert color={theme.primaryColor} title='Template Variables'>
          <Text size='sm'>
            You can use the following variables in your template:
          </Text>
          <Code block mt='xs'>
            {availableVariables.join('\n')}
          </Code>
        </Alert>

        <Switch
          label='Active'
          description='Template is available for use'
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />

        <Group justify='flex-end' mt='xl'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting}>
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
