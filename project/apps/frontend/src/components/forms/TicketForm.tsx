'use client';

import { useState, useEffect } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  MultiSelect,
  Text,
  Alert,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Dropzone } from '@mantine/dropzone';
import {
  IconUpload,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { showErrorNotification } from '@/lib/notifications';
import { useTranslations } from 'next-intl';
import { useAutoAssignSettings } from '../../hooks/useAutoAssignSettings';
import { useActiveCategories, useSubcategories } from '../../hooks/useCategories';
import { useCustomFields } from '../../hooks/useCustomFields';
import { CustomFieldsSection } from './CustomFieldsSection';
import {
  URGENCY_OPTIONS,
  IMPACT_OPTIONS,
  PRIORITY_OPTIONS,
  SLA_LEVEL_OPTIONS,
} from '@/lib/constants';

// Subcategory option interface for form display
interface SubcategoryOption {
  value: string;
  label: string;
}

// Ticket form data interface
export interface TicketFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: string;
  impact: string;
  urgency: string;
  slaLevel: string;
  relatedTickets: string[];
  customFields: Record<string, string | number | boolean | string[]>;
}

interface TicketFormProps {
  onSubmit: (data: TicketFormData & { files: File[] }) => void;
  onCancel: () => void;
  initialData?: Partial<TicketFormData>;
  isEditing?: boolean;
}

// Categories and subcategories are now loaded dynamically from the database

const priorities = PRIORITY_OPTIONS;
const impacts = IMPACT_OPTIONS;
const urgencies = URGENCY_OPTIONS;
const slaLevels = SLA_LEVEL_OPTIONS;

export function TicketForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: TicketFormProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const tTickets = useTranslations('tickets');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory] = useState<string>('');
  const [, setAvailableSubcategories] = useState<SubcategoryOption[]>([]);
  // const [availableCustomFields] = useState<CustomField[]>([]);

  const { getAutoAssignMessage, getAutoCloseMessage } = useAutoAssignSettings();
  const { data: categoriesData } = useActiveCategories();
  const { data: customFieldsData } = useCustomFields();


  // Load custom fields based on category
  useEffect(() => {
    if (selectedCategory && customFieldsData) {
      // const categoryFields = customFieldsData.filter(
      //   (field: CustomField) =>
      //     (field as CustomField & { category?: string }).category === selectedCategory ||
      //     (field as CustomField & { category?: string }).category === 'ALL'
      // );
      // setAvailableCustomFields(categoryFields);
    } else {
      // setAvailableCustomFields(customFieldsData || []);
    }
  }, [selectedCategory, customFieldsData]);

  const form = useForm<TicketFormData>({
    initialValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category:
        typeof initialData?.category === 'string'
          ? initialData.category
          : (initialData?.category as unknown as { name?: string })?.name || '',
      subcategory:
        typeof initialData?.subcategory === 'string'
          ? initialData.subcategory
          : (initialData?.subcategory as unknown as { name?: string })?.name ||
            '',
      priority: initialData?.priority || 'MEDIUM',
      impact: initialData?.impact || 'MODERATE',
      urgency: initialData?.urgency || 'NORMAL',
      slaLevel: initialData?.slaLevel || 'STANDARD',
      relatedTickets: initialData?.relatedTickets || [],
      customFields: initialData?.customFields || {},
    },
    validate: {
      title: value => (!value ? 'Title is required' : null),
      description: value => (!value ? 'Description is required' : null),
      category: value => (!value ? 'Category is required' : null),
      subcategory: () => null, // Subcategory is now optional
    },
  });

  const { data: subcategoriesData } = useSubcategories(form.values.category);

  // Dynamic form behavior based on category selection
  useEffect(() => {
    if (subcategoriesData) {
      setAvailableSubcategories(
        subcategoriesData.map(sub => ({
          value: sub.name,
          label: sub.description || sub.name,
        }))
      );
    } else {
      setAvailableSubcategories([]);
    }
  }, [subcategoriesData]);

  const handleCategoryChange = (value: string) => {
    form.setFieldValue('category', value);
    form.setFieldValue('subcategory', '');
  };

  const handleFileDrop = (acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles];
    if (newFiles.length > 10) {
      showErrorNotification('Too many files', 'Maximum 10 files allowed');
      return;
    }
    setFiles(newFiles);
  };

  const handleFileRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: TicketFormData) => {
    setIsSubmitting(true);
    try {
      const formData = {
        ...values,
        files,
      };
      
      // Filter out empty subcategory
      if (!formData.subcategory || formData.subcategory.trim() === '') {
        formData.subcategory = '';
      }
      
      await onSubmit(formData);
    } catch (error) {
      showErrorNotification(t('error'), tTickets('submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get subcategories for the selected category
  const currentSubcategories = subcategoriesData
    ? subcategoriesData.map(sub => ({
        value: sub.name,
        label: sub.description || sub.name,
      }))
    : [];

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap='md'>
        <Grid>
          <Grid.Col span={12}>
            <TextInput
              label={tTickets('title')}
              placeholder={tTickets('titlePlaceholder')}
              required
              {...form.getInputProps('title')}
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label={tTickets('description')}
          placeholder={tTickets('descriptionPlaceholder')}
          required
          minRows={4}
          {...form.getInputProps('description')}
        />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label={tTickets('category')}
              placeholder={tTickets('selectCategory')}
              required
              data={categoriesData?.map(cat => ({
                value: cat.id, // Use category ID instead of name
                label: cat.customName || cat.name.replace('_', ' '),
              })) || []}
              {...form.getInputProps('category')}
              onChange={value => handleCategoryChange(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label={tTickets('subcategory')}
              placeholder={tTickets('selectSubcategory') + ' (optional)'}
              data={currentSubcategories}
              disabled={!form.values.category}
              {...form.getInputProps('subcategory')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={tTickets('priority')}
              data={priorities}
              {...form.getInputProps('priority')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={tTickets('impact')}
              data={impacts}
              {...form.getInputProps('impact')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={tTickets('urgency')}
              data={urgencies}
              {...form.getInputProps('urgency')}
            />
          </Grid.Col>
        </Grid>

        <Select
          label={tTickets('slaLevel')}
          data={slaLevels}
          {...form.getInputProps('slaLevel')}
        />

        {/* Auto-assign Information */}
        <Alert icon={<IconInfoCircle size={16} />} color={theme.colors[theme.primaryColor][9]} variant='light'>
          <Text size='sm' fw={500} mb='xs'>
            System Settings
          </Text>
          <Text size='sm' mb='xs'>
            {getAutoAssignMessage()}
          </Text>
          <Text size='sm'>{getAutoCloseMessage()}</Text>
        </Alert>

        <MultiSelect
          label='Related Tickets'
          placeholder='Select related tickets'
          data={[]} // This would be populated from API
          {...form.getInputProps('relatedTickets')}
        />

        {/* Custom Fields Section */}
        <CustomFieldsSection
          values={form.values.customFields as Record<string, string | number | boolean>}
          onChange={(customFields) => form.setFieldValue('customFields', customFields)}
        />

        <div>
          <Text size='sm' fw={500} mb='xs'>
            Attachments
          </Text>
          <Dropzone
            onDrop={handleFileDrop}
            maxSize={10 * 1024 * 1024} // 10MB
            accept={[
              'image/*',
              'application/pdf',
              'text/*',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]}
            multiple
          >
            <Group
              justify='center'
              gap='xl'
              style={{ minHeight: 120, pointerEvents: 'none' }}
            >
              <Dropzone.Accept>
                <IconUpload size={50} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconUpload size={50} stroke={1.5} />
              </Dropzone.Idle>
              <div>
                <Text size='xl' inline>
                  Drag files here or click to select files
                </Text>
                <Text size='sm' color='dimmed' inline mt={7}>
                  Attach up to 10 files, each file should not exceed 10MB
                </Text>
              </div>
            </Group>
          </Dropzone>

          {files.length > 0 && (
            <Stack gap='xs' mt='md'>
              {files.map((file, index) => (
                <Group key={file.name} justify='space-between'>
                  <Text size='sm'>{file.name}</Text>
                  <Button
                    size='xs'
                    color={theme.colors[theme.primaryColor][9]}
                    variant='subtle'
                    onClick={() => handleFileRemove(index)}
                  >
                    Remove
                  </Button>
                </Group>
              ))}
            </Stack>
          )}
        </div>

        {form.values.priority === 'CRITICAL' && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title='Critical Priority'
            color={theme.colors[theme.primaryColor][9]}
          >
            This ticket has been marked as critical priority. It will be
            escalated to senior support staff immediately.
          </Alert>
        )}

        <Group justify='flex-end' mt='xl'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting}>
            {isEditing ? 'Update Ticket' : 'Create Ticket'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
