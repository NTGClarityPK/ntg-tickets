'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  TextInput,
  Select,
  Switch,
  Grid,
  Stack,
  Group,
  Card,
  NumberInput,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useCreateCustomField } from '../../../../hooks/useCustomFields';
import {
  CreateCustomFieldInput,
  CustomFieldType,
} from '../../../../types/unified';
import { IconArrowLeft, IconPlus, IconTrash } from '@tabler/icons-react';
import { useDynamicTheme } from '../../../../hooks/useDynamicTheme';

export default function CreateCustomFieldPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCustomField = useCreateCustomField();

  const form = useForm<CreateCustomFieldInput>({
    initialValues: {
      name: '',
      fieldType: CustomFieldType.TEXT,
      isRequired: false,
      options: [],
      isActive: true,
    },
    validate: {
      name: (value: string) => (!value ? 'Name is required' : null),
      fieldType: (value: string) => (!value ? 'Type is required' : null),
    },
  });

  const fieldTypeOptions = [
    { value: CustomFieldType.TEXT, label: 'Text' },
    { value: CustomFieldType.NUMBER, label: 'Number' },
    { value: CustomFieldType.SELECT, label: 'Select' },
    { value: CustomFieldType.DATE, label: 'Date' },
    { value: CustomFieldType.BOOLEAN, label: 'Boolean' },
  ];

  const handleSubmit = async (values: CreateCustomFieldInput) => {
    setIsSubmitting(true);
    try {
      await createCustomField.mutateAsync(values);
      notifications.show({
        title: 'Success',
        message: 'Custom field created successfully',
        color: primaryLight,
      });
      router.push('/admin/custom-fields');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create custom field',
        color: primaryDark,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOption = () => {
    const currentOptions = form.values.options || [];
    form.setFieldValue('options', [...currentOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = form.values.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    form.setFieldValue('options', newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const currentOptions = form.values.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    form.setFieldValue('options', newOptions);
  };

  const isSelectType = form.values.fieldType === CustomFieldType.SELECT;

  return (
    <Container size='lg' py='md' data-testid="create-custom-field-page">
      <Group mb='xl' data-testid="create-custom-field-page-header">
        <Button
          variant='light'
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
          data-testid="create-custom-field-page-back-button"
        >
          Back
        </Button>
        <div data-testid="create-custom-field-page-header-content">
          <Title order={2} data-testid="create-custom-field-page-title">Create Custom Field</Title>
          <Text c='dimmed' size='sm' data-testid="create-custom-field-page-subtitle">
            Add a new custom field for tickets
          </Text>
        </div>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)} data-testid="create-custom-field-page-form">
        <Grid data-testid="create-custom-field-page-form-grid">
          <Grid.Col span={8} data-testid="create-custom-field-page-form-left-col">
            <Stack data-testid="create-custom-field-page-form-left-stack">
              <Card data-testid="create-custom-field-page-basic-info-card">
                <Stack data-testid="create-custom-field-page-basic-info-stack">
                  <Title order={4} data-testid="create-custom-field-page-basic-info-title">Basic Information</Title>
                  <Grid data-testid="create-custom-field-page-basic-info-grid">
                    <Grid.Col span={6} data-testid="create-custom-field-page-name-col">
                      <TextInput
                        label='Name'
                        placeholder='field_name'
                        description='Internal field name (used in API)'
                        required
                        {...form.getInputProps('name')}
                        data-testid="create-custom-field-page-name-input"
                      />
                    </Grid.Col>
                  </Grid>

                  <Grid data-testid="create-custom-field-page-type-grid">
                    <Grid.Col span={6} data-testid="create-custom-field-page-type-col">
                      <Select
                        label='Type'
                        placeholder='Select field type'
                        description='Choose the field type'
                        required
                        data={fieldTypeOptions}
                        {...form.getInputProps('fieldType')}
                        data-testid="create-custom-field-page-type-select"
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {isSelectType && (
                <Card data-testid="create-custom-field-page-options-card">
                  <Stack data-testid="create-custom-field-page-options-stack">
                    <Title order={4} data-testid="create-custom-field-page-options-title">Options</Title>
                    <Text size='sm' c='dimmed' data-testid="create-custom-field-page-options-description">
                      Define the available options for this field
                    </Text>

                    {form.values.options?.map((option, index) => (
                      <Group key={`option-${option}-${Date.now()}`} data-testid={`create-custom-field-page-option-group-${index}`}>
                        <TextInput
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={e =>
                            handleOptionChange(index, e.target.value)
                          }
                          style={{ flex: 1 }}
                          data-testid={`create-custom-field-page-option-input-${index}`}
                        />
                        <Button
                          variant='light'
                          color={theme.colors[theme.primaryColor][9]}
                          size='sm'
                          onClick={() => handleRemoveOption(index)}
                          data-testid={`create-custom-field-page-option-remove-button-${index}`}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    ))}

                    <Button
                      variant='light'
                      leftSection={<IconPlus size={14} />}
                      onClick={handleAddOption}
                      data-testid="create-custom-field-page-add-option-button"
                    >
                      Add Option
                    </Button>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={4} data-testid="create-custom-field-page-form-right-col">
            <Stack data-testid="create-custom-field-page-form-right-stack">
              <Card data-testid="create-custom-field-page-settings-card">
                <Stack data-testid="create-custom-field-page-settings-stack">
                  <Title order={4} data-testid="create-custom-field-page-settings-title">Settings</Title>

                  <Switch
                    label='Required Field'
                    description='Make this field mandatory'
                    {...form.getInputProps('isRequired', { type: 'checkbox' })}
                    data-testid="create-custom-field-page-required-switch"
                  />

                  <Switch
                    label='Active'
                    description='Enable this field'
                    {...form.getInputProps('isActive', { type: 'checkbox' })}
                    data-testid="create-custom-field-page-active-switch"
                  />
                </Stack>
              </Card>

              <Card data-testid="create-custom-field-page-preview-card">
                <Stack data-testid="create-custom-field-page-preview-stack">
                  <Title order={4} data-testid="create-custom-field-page-preview-title">Preview</Title>
                  <Text size='sm' c='dimmed' data-testid="create-custom-field-page-preview-description">
                    How this field will appear in forms
                  </Text>

                  <div data-testid="create-custom-field-page-preview-content">
                    <Text size='sm' fw={500} mb={4} data-testid="create-custom-field-page-preview-label">
                      {form.values.name}
                      {form.values.isRequired && (
                        <Text component='span' c={theme.colors[theme.primaryColor][9]} data-testid="create-custom-field-page-preview-required-indicator">
                          {' '}
                          *
                        </Text>
                      )}
                    </Text>

                    {form.values.fieldType === CustomFieldType.TEXT && (
                      <TextInput placeholder='Enter text...' disabled data-testid="create-custom-field-page-preview-text-input" />
                    )}

                    {form.values.fieldType === CustomFieldType.NUMBER && (
                      <NumberInput placeholder='Enter number...' disabled data-testid="create-custom-field-page-preview-number-input" />
                    )}

                    {form.values.fieldType === CustomFieldType.SELECT && (
                      <Select
                        placeholder='Select option...'
                        data={form.values.options || []}
                        disabled
                        data-testid="create-custom-field-page-preview-select"
                      />
                    )}

                    {form.values.fieldType === CustomFieldType.DATE && (
                      <TextInput placeholder='Select date...' disabled data-testid="create-custom-field-page-preview-date-input" />
                    )}

                    {form.values.fieldType === CustomFieldType.BOOLEAN && (
                      <Switch label='Yes/No' disabled data-testid="create-custom-field-page-preview-boolean-switch" />
                    )}
                  </div>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        <Group justify='flex-end' mt='xl' data-testid="create-custom-field-page-form-actions">
          <Button variant='light' onClick={() => router.back()} data-testid="create-custom-field-page-cancel-button">
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting} data-testid="create-custom-field-page-submit-button">
            Create Custom Field
          </Button>
        </Group>
      </form>
    </Container>
  );
}
