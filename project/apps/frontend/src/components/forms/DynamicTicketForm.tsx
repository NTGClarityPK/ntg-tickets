'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Grid,
  NumberInput,
  Alert,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import { RichTextEditorComponent } from '../ui/RichTextEditor';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import {
  TicketPriority,
  TicketImpact,
  TicketUrgency,
  SlaLevel,
  DynamicFieldType,
  DynamicField,
  DynamicTicketFormValues,
  DynamicValidationRules,
  Subcategory,
} from '../../types/unified';
import {
  useActiveCategories,
  useDynamicFields as useCategoryDynamicFields,
  useSubcategories as useCategorySubcategories,
} from '../../hooks/useCategories';
import { FileUpload } from './FileUpload';
import { FileWithPath } from '@mantine/dropzone';
import { CustomFieldsSection } from './CustomFieldsSection';

interface DynamicTicketFormProps {
  onSubmit: (values: DynamicTicketFormValues) => void;
  loading?: boolean;
  initialValues?: Partial<DynamicTicketFormValues>;
}

export function DynamicTicketForm({
  onSubmit,
  loading = false,
  initialValues,
}: DynamicTicketFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialValues?.category || ''
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [attachments, setAttachments] = useState<FileWithPath[]>([]);

  // Use hooks for API calls
  const { data: categories = [], isLoading: loadingCategories } =
    useActiveCategories();
  const {
    data: dynamicFields = [],
    isLoading: loadingFields,
    error: dynamicFieldsError,
  } = useCategoryDynamicFields(selectedCategoryName);

  const { data: subcategories = [], error: subcategoriesError } =
    useCategorySubcategories(selectedCategoryName);

  const error = dynamicFieldsError || subcategoriesError;

  const form = useForm<DynamicTicketFormValues>({
    initialValues: {
      title: '',
      description: '',
      category: '', // Will be set when categories are loaded
      subcategory: '',
      priority: TicketPriority.MEDIUM,
      impact: TicketImpact.MODERATE,
      urgency: TicketUrgency.NORMAL,
      slaLevel: SlaLevel.STANDARD,
      attachments: [],
      customFields: {},
      ...initialValues,
    },
    validate: {
      title: value => {
        if (!value) return 'Title is required';
        if (value.length < 5) return 'Title must be at least 5 characters';
        if (value.length > 200) return 'Title must be less than 200 characters';
        return null;
      },
      description: value => {
        if (!value) return 'Description is required';
        // Strip HTML tags for length validation
        const textContent = value.replace(/<[^>]*>/g, '');
        if (textContent.length < 10)
          return 'Description must be at least 10 characters';
        return null;
      },
      category: value => (!value ? 'Category is required' : null),
      subcategory: () => null, // Subcategory is now optional
    },
  });

  // Sync selectedCategory with form's category value
  useEffect(() => {
    if (form.values.category && form.values.category !== selectedCategory) {
      setSelectedCategory(form.values.category);
      // Find the category name for API calls
      const category = categories.find(cat => cat.id === form.values.category);
      if (category) {
        setSelectedCategoryName(category.name);
      }
    }
  }, [form.values.category, selectedCategory, categories]);

  // Update form validation when dynamic fields change
  useEffect(() => {
    if (Array.isArray(dynamicFields) && dynamicFields.length > 0) {
      const dynamicValidation: DynamicValidationRules = {};
      dynamicFields.forEach((field: DynamicField) => {
        if (field.required) {
          dynamicValidation[field.name] = (value: unknown) =>
            !value ? `${field.name} is required` : null;
        }
      });
      // Note: Form validation would need to be updated here if needed
    }
  }, [dynamicFields]);

  const handleCategoryChange = (value: string | null) => {
    if (value) {
      setSelectedCategory(value); // Store category ID
      // Find the category name for API calls
      const category = categories.find(cat => cat.id === value);
      if (category) {
        setSelectedCategoryName(category.name);
      }
      form.setFieldValue('subcategory', undefined); // Reset subcategory
    }
  };

  const handleSubmit = (values: DynamicTicketFormValues) => {
    // Filter out empty dynamic field values
    const filteredValues: DynamicTicketFormValues = { ...values };

    // Filter out empty subcategory
    if (!filteredValues.subcategory || filteredValues.subcategory.trim() === '') {
      delete filteredValues.subcategory;
    }

    // Ensure dynamicFields is an array before calling forEach
    if (Array.isArray(dynamicFields)) {
      dynamicFields.forEach((field: DynamicField) => {
        if (!filteredValues[field.name]) {
          delete filteredValues[field.name];
        }
      });
    }

    // Add attachments to the form data
    filteredValues.attachments = attachments;

    onSubmit(filteredValues);
  };

  const renderField = (field: DynamicField) => {
    const commonProps = {
      key: field.name,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      ...form.getInputProps(field.name),
    };

    switch (field.type) {
      case DynamicFieldType.TEXTAREA:
        return <Textarea {...commonProps} minRows={3} />;

      case DynamicFieldType.SELECT:
        return (
          <Select {...commonProps} data={field.options || []} searchable />
        );

      case DynamicFieldType.NUMBER:
        return <NumberInput {...commonProps} min={0} />;

      case DynamicFieldType.TEXT:
      default:
        return <TextInput {...commonProps} />;
    }
  };

  return (
    <Container size='md' py='md'>
      <Paper withBorder shadow='sm' p='xl' radius='md'>
        <Title order={2} mb='md'>
          Create New Ticket
        </Title>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color='red' mb='md'>
            {error instanceof Error
              ? error.message
              : 'Failed to load form fields'}
          </Alert>
        )}

        <form
          onSubmit={form.onSubmit(
            handleSubmit as (values: DynamicTicketFormValues) => void
          )}
        >
          <Stack gap='md'>
            {/* Basic Fields */}
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label='Title'
                  placeholder='Brief description of the issue'
                  required
                  {...form.getInputProps('title')}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <RichTextEditorComponent
                  label='Description'
                  placeholder='Detailed description of the issue'
                  required
                  minHeight={200}
                  maxHeight={400}
                  value={form.values.description}
                  onChange={value => form.setFieldValue('description', value)}
                  error={form.errors.description}
                  allowImageUpload={true}
                  allowTableInsertion={true}
                  allowCodeBlocks={true}
                  allowHeadings={true}
                  allowLists={true}
                  allowTextFormatting={true}
                  allowTextAlignment={true}
                  allowTextColor={false}
                  allowHighlight={true}
                  allowLinks={true}
                  allowUndoRedo={true}
                  allowClearFormatting={true}
                  showToolbar={true}
                  toolbarPosition='top'
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Select
                  label='Category'
                  placeholder='Select category'
                  required
                  data={categories.map(cat => ({
                    value: cat.id,
                    label: cat.customName || cat.name.replace('_', ' '),
                  }))}
                  disabled={loadingCategories}
                  {...form.getInputProps('category')}
                  onChange={value => {
                    handleCategoryChange(value);
                    form.setFieldValue('category', value as string);
                  }}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Select
                  label='Subcategory'
                  placeholder='Select subcategory (optional)'
                  data={subcategories.map((sub: Subcategory) => ({
                    value: sub.id,
                    label: sub.name,
                  }))}
                  disabled={!selectedCategory || loadingFields}
                  {...form.getInputProps('subcategory')}
                />
              </Grid.Col>

              <Grid.Col span={4}>
                <Select
                  label='Priority'
                  placeholder='Select priority'
                  required
                  data={Object.values(TicketPriority).map(pri => ({
                    value: pri,
                    label: pri,
                  }))}
                  {...form.getInputProps('priority')}
                />
              </Grid.Col>

              <Grid.Col span={4}>
                <Select
                  label='Impact'
                  placeholder='Select impact'
                  required
                  data={Object.values(TicketImpact).map(imp => ({
                    value: imp,
                    label: imp,
                  }))}
                  {...form.getInputProps('impact')}
                />
              </Grid.Col>

              <Grid.Col span={4}>
                <Select
                  label='Urgency'
                  placeholder='Select urgency'
                  required
                  data={Object.values(TicketUrgency).map(urg => ({
                    value: urg,
                    label: urg,
                  }))}
                  {...form.getInputProps('urgency')}
                />
              </Grid.Col>
            </Grid>

            {/* Dynamic Fields */}
            {loadingFields && (
              <Center py='md'>
                <Loader size='sm' />
                <Text ml='sm' size='sm' c='dimmed'>
                  Loading category-specific fields...
                </Text>
              </Center>
            )}

            {Array.isArray(dynamicFields) && dynamicFields.length > 0 && (
              <>
                <Divider my='md' />
                <Text size='lg' fw={500}>
                  Additional Information
                </Text>
                <Grid>
                  {dynamicFields.map((field: DynamicField) => (
                    <Grid.Col
                      span={field.type === DynamicFieldType.TEXTAREA ? 12 : 6}
                      key={field.name}
                    >
                      {renderField(field)}
                    </Grid.Col>
                  ))}
                </Grid>
              </>
            )}

            {/* Custom Fields Section */}
            <CustomFieldsSection
              values={(form.values.customFields || {}) as Record<string, string | number | boolean>}
              onChange={(customFields) => form.setFieldValue('customFields', customFields)}
            />

            {/* File Attachments */}
            <Divider my='md' />
            <Text size='lg' fw={500}>
              Attachments
            </Text>
            <Text size='sm' c='dimmed' mb='md'>
              Upload screenshots, documents, or other files related to this
              ticket
            </Text>
            <FileUpload
              onFilesChange={setAttachments}
              maxFiles={5}
              maxSize={10}
              disabled={loading}
            />

            {/* Submit Button */}
            <Group justify='flex-end' mt='xl'>
              <Button
                type='submit'
                loading={loading}
                leftSection={<IconPlus size={16} />}
                size='md'
              >
                Create Ticket
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
