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
  Alert,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

// Custom field types
export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  BOOLEAN = 'BOOLEAN',
}

// Custom field form data interface
export interface CustomFieldFormData {
  name: string;
  fieldType: CustomFieldType;
  options: string[];
  isRequired: boolean;
  isActive: boolean;
}

// Custom field interface (for initial data)
export interface CustomField {
  id?: string;
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomFieldFormProps {
  onSubmit: (data: CustomFieldFormData) => void;
  onCancel: () => void;
  initialData?: CustomField;
  isEditing?: boolean;
}

const fieldTypes = [
  { value: CustomFieldType.TEXT, label: 'Text' },
  { value: CustomFieldType.NUMBER, label: 'Number' },
  { value: CustomFieldType.DATE, label: 'Date' },
  { value: CustomFieldType.SELECT, label: 'Select' },
  { value: CustomFieldType.BOOLEAN, label: 'Boolean' },
];

export function CustomFieldForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: CustomFieldFormProps) {
  const theme = useMantineTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomFieldFormData>({
    initialValues: {
      name: initialData?.name || '',
      fieldType: initialData?.fieldType || CustomFieldType.TEXT,
      options: initialData?.options || [],
      isRequired: initialData?.isRequired ?? false,
      isActive: initialData?.isActive ?? true,
    },
    validate: {
      name: value => {
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 50) return 'Name must be less than 50 characters';
        return null;
      },
      fieldType: value => (!value ? 'Field type is required' : null),
      options: (value, values) => {
        if (
          values.fieldType === CustomFieldType.SELECT &&
          (!value || value.length === 0)
        ) {
          return 'Options are required for SELECT field type';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: CustomFieldFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save custom field',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentFieldType = form.values.fieldType;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap='md'>
        <Grid>
          <Grid.Col span={8}>
            <TextInput
              label='Field Name'
              placeholder='Enter field name'
              required
              {...form.getInputProps('name')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label='Field Type'
              placeholder='Select type'
              required
              data={fieldTypes}
              {...form.getInputProps('fieldType')}
            />
          </Grid.Col>
        </Grid>

        {currentFieldType === CustomFieldType.SELECT && (
          <Alert color={theme.primaryColor} title='Select Options'>
            For SELECT field type, you need to provide options. This would be
            implemented with a dynamic options editor.
          </Alert>
        )}

        <Grid>
          <Grid.Col span={6}>
            <Switch
              label='Required'
              description='This field must be filled'
              {...form.getInputProps('isRequired', { type: 'checkbox' })}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Switch
              label='Active'
              description='Field is available for use'
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
          </Grid.Col>
        </Grid>

        <Group justify='flex-end' mt='xl'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting}>
            {isEditing ? 'Update Field' : 'Create Field'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
