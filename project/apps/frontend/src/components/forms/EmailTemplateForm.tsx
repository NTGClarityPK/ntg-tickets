'use client';

import { useState, useEffect, useRef } from 'react';
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
  { value: EmailTemplateType.TICKET_ASSIGNED, label: 'Ticket Assigned' },
  { value: EmailTemplateType.COMMENT_ADDED, label: 'Comment Added' },
  { value: EmailTemplateType.TICKET_UPDATE, label: 'Ticket Update' },
];

const getRecipients = (type: EmailTemplateType): string => {
  switch (type) {
    case EmailTemplateType.TICKET_ASSIGNED:
      return 'Sent to: The person to whom the ticket is assigned';
    case EmailTemplateType.COMMENT_ADDED:
      return 'Sent to: Requestor and the person to whom the ticket is assigned (if any)';
    case EmailTemplateType.TICKET_UPDATE:
      return 'Sent to: Requester';
    default:
      return '';
  }
};

const availableVariables = [
  // User variables
  { value: '{{user.name}}', label: 'User Name' },
  { value: '{{user.email}}', label: 'User Email' },
  
  // Ticket variables
  { value: '{{ticket.ticketNumber}}', label: 'Ticket Number' },
  { value: '{{ticket.title}}', label: 'Ticket Title' },
  { value: '{{ticket.description}}', label: 'Ticket Description' },
  { value: '{{ticket.priority}}', label: 'Ticket Priority' },
  { value: '{{ticket.status}}', label: 'Ticket Status' },
  { value: '{{ticket.category}}', label: 'Ticket Category' },
  { value: '{{ticket.dueDate}}', label: 'Ticket Due Date' },
  { value: '{{ticket.createdAt}}', label: 'Ticket Created Date' },
  { value: '{{ticket.updatedAt}}', label: 'Ticket Updated Date' },
  { value: '{{ticket.url}}', label: 'Ticket URL' },
  { value: '{{ticket.assignee.name}}', label: 'Ticket Assignee Name' },
  
  // Assignee variables
  { value: '{{assignee.name}}', label: 'Assignee Name' },
  { value: '{{assignee.email}}', label: 'Assignee Email' },
  
  // Requester variables
  { value: '{{requester.name}}', label: 'Requester Name' },
  { value: '{{requester.email}}', label: 'Requester Email' },
  
  // Comment variables
  { value: '{{comment.author}}', label: 'Comment Author Name' },
  { value: '{{comment.authorEmail}}', label: 'Comment Author Email' },
  { value: '{{comment.content}}', label: 'Comment Content' },
  { value: '{{comment.createdAt}}', label: 'Comment Created Date' },
  
  // Password Reset variables
  { value: '{{resetUrl}}', label: 'Password Reset URL' },
  { value: '{{resetTokenExpiry}}', label: 'Reset Token Expiry (hours)' },
  
  // Other variables
  { value: '{{updateDetails}}', label: 'Update Details' },
];

export function EmailTemplateForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: EmailTemplateFormProps) {
  const theme = useMantineTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<EmailTemplateFormData>({
    initialValues: {
      name: initialData?.name || '',
      type: initialData?.type || EmailTemplateType.TICKET_ASSIGNED,
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

  // Update form values when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name || '',
        type: initialData.type || EmailTemplateType.TICKET_ASSIGNED,
        subject: initialData.subject || '',
        html: initialData.html || '',
        isActive: initialData.isActive ?? true,
      });
      form.resetDirty();
    } else {
      // Reset form when creating new template
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleSubmit = async (values: EmailTemplateFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save email template',
        color: theme.colors[theme.primaryColor][9],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} data-testid="email-template-form">
      <Stack gap='md' data-testid="email-template-form-stack">
        {isEditing && initialData && (
          <Alert color='blue' title='Editing Current Template' data-testid="email-template-editing-alert">
            <Text size='sm' data-testid="email-template-editing-message">
              You are editing the <strong>{initialData.name}</strong> template. 
              All fields below are editable except the template type.
            </Text>
          </Alert>
        )}
        
        <Grid data-testid="email-template-form-grid">
          <Grid.Col span={6}>
            <TextInput
              label='Template Name'
              placeholder='Enter template name'
              required
              {...form.getInputProps('name')}
              data-testid="email-template-name-input"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label='Template Type'
              placeholder='Select type'
              required
              data={templateTypes}
              disabled={isEditing}
              {...form.getInputProps('type')}
              description={isEditing ? 'Template type cannot be changed when editing' : ''}
              data-testid="email-template-type-select"
            />
          </Grid.Col>
        </Grid>

        {form.values.type && (
          <Alert color='blue' title='Email Recipients' data-testid="email-template-recipients-alert">
            <Text size='sm' data-testid="email-template-recipients-text">{getRecipients(form.values.type)}</Text>
          </Alert>
        )}

        <TextInput
          label='Subject'
          placeholder='Enter email subject'
          required
          {...form.getInputProps('subject')}
          data-testid="email-template-subject-input"
        />

        <div data-testid="email-template-html-section">
          <Text size='sm' fw={500} mb='xs' data-testid="email-template-html-label">
            HTML Content
          </Text>
          <Textarea
            placeholder='Enter HTML content'
            required
            minRows={15}
            autosize
            data-name='html'
            ref={htmlTextareaRef}
            styles={{ input: { fontFamily: 'monospace', fontSize: '13px' } }}
            {...form.getInputProps('html')}
            data-testid="email-template-html-textarea"
          />
          <Text size='xs' color='dimmed' mt='xs' data-testid="email-template-html-hint">
            Use Handlebars syntax for variables. Click on variables below to insert them into your template.
          </Text>
        </div>

        <Alert color={theme.primaryColor} title='Available Template Variables' data-testid="email-template-variables-alert">
          <Text size='sm' mb='md' data-testid="email-template-variables-hint">
            Click on a variable to insert it into your template at the cursor position.
          </Text>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }} data-testid="email-template-variables-list">
            <Grid gutter='xs'>
              {availableVariables.map((variable) => (
                <Grid.Col key={variable.value} span={6} data-testid={`email-template-variable-${variable.value.replace(/[{}]/g, '').replace(/\./g, '-')}`}>
                  <Group gap='xs' wrap='nowrap' style={{ alignItems: 'flex-start' }}>
                    <Code
                      style={{
                        cursor: 'pointer',
                        userSelect: 'all',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f3f5',
                        flex: '0 0 auto',
                        fontSize: '12px',
                      }}
                      onClick={() => {
                        const textarea = htmlTextareaRef.current || (document.querySelector('textarea[data-name="html"]') as HTMLTextAreaElement);
                        if (textarea) {
                          const start = textarea.selectionStart || 0;
                          const end = textarea.selectionEnd || 0;
                          const currentHtml = form.values.html || '';
                          const newHtml = currentHtml.substring(0, start) + variable.value + currentHtml.substring(end);
                          form.setFieldValue('html', newHtml);
                          
                          // Set cursor position after inserted variable
                          setTimeout(() => {
                            textarea.focus();
                            const newPosition = start + variable.value.length;
                            textarea.setSelectionRange(newPosition, newPosition);
                            // Update the form value to trigger re-render if needed
                            form.setFieldValue('html', newHtml);
                          }, 0);
                        } else {
                          // Fallback: append to the end
                          form.setFieldValue('html', (form.values.html || '') + variable.value);
                        }
                        
                        notifications.show({
                          title: 'Variable Inserted',
                          message: `${variable.value} inserted into template`,
                          color: 'green',
                          autoClose: 2000,
                        });
                      }}
                      data-testid={`email-template-variable-code-${variable.value.replace(/[{}]/g, '').replace(/\./g, '-')}`}
                    >
                      {variable.value}
          </Code>
                    <Text size='xs' color='dimmed' style={{ flex: 1, lineHeight: 1.4 }} data-testid={`email-template-variable-label-${variable.value.replace(/[{}]/g, '').replace(/\./g, '-')}`}>
                      {variable.label}
                    </Text>
                  </Group>
                </Grid.Col>
              ))}
            </Grid>
          </div>
        </Alert>

        <Switch
          label='Active'
          description='Template is available for use'
          {...form.getInputProps('isActive', { type: 'checkbox' })}
          data-testid="email-template-active-switch"
        />

        <Group justify='flex-end' mt='xl' data-testid="email-template-form-actions">
          <Button variant='outline' onClick={onCancel} data-testid="email-template-form-cancel">
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting} data-testid="email-template-form-submit">
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
