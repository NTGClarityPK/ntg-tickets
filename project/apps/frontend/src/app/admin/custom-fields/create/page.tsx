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

export default function CreateCustomFieldPage() {
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
        color: 'green',
      });
      router.push('/admin/custom-fields');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create custom field',
        color: 'red',
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
    <Container size='lg' py='md'>
      <Group mb='xl'>
        <Button
          variant='light'
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <div>
          <Title order={2}>Create Custom Field</Title>
          <Text c='dimmed' size='sm'>
            Add a new custom field for tickets
          </Text>
        </div>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid>
          <Grid.Col span={8}>
            <Stack>
              <Card>
                <Stack>
                  <Title order={4}>Basic Information</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        label='Name'
                        placeholder='field_name'
                        description='Internal field name (used in API)'
                        required
                        {...form.getInputProps('name')}
                      />
                    </Grid.Col>
                  </Grid>

                  <Grid>
                    <Grid.Col span={6}>
                      <Select
                        label='Type'
                        placeholder='Select field type'
                        description='Choose the field type'
                        required
                        data={fieldTypeOptions}
                        {...form.getInputProps('fieldType')}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>

              {isSelectType && (
                <Card>
                  <Stack>
                    <Title order={4}>Options</Title>
                    <Text size='sm' c='dimmed'>
                      Define the available options for this field
                    </Text>

                    {form.values.options?.map((option, index) => (
                      <Group key={`option-${option}-${Date.now()}`}>
                        <TextInput
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={e =>
                            handleOptionChange(index, e.target.value)
                          }
                          style={{ flex: 1 }}
                        />
                        <Button
                          variant='light'
                          color='red'
                          size='sm'
                          onClick={() => handleRemoveOption(index)}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    ))}

                    <Button
                      variant='light'
                      leftSection={<IconPlus size={14} />}
                      onClick={handleAddOption}
                    >
                      Add Option
                    </Button>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack>
              <Card>
                <Stack>
                  <Title order={4}>Settings</Title>

                  <Switch
                    label='Required Field'
                    description='Make this field mandatory'
                    {...form.getInputProps('isRequired', { type: 'checkbox' })}
                  />

                  <Switch
                    label='Active'
                    description='Enable this field'
                    {...form.getInputProps('isActive', { type: 'checkbox' })}
                  />
                </Stack>
              </Card>

              <Card>
                <Stack>
                  <Title order={4}>Preview</Title>
                  <Text size='sm' c='dimmed'>
                    How this field will appear in forms
                  </Text>

                  <div>
                    <Text size='sm' fw={500} mb={4}>
                      {form.values.name}
                      {form.values.isRequired && (
                        <Text component='span' c='red'>
                          {' '}
                          *
                        </Text>
                      )}
                    </Text>

                    {form.values.fieldType === CustomFieldType.TEXT && (
                      <TextInput placeholder='Enter text...' disabled />
                    )}

                    {form.values.fieldType === CustomFieldType.NUMBER && (
                      <NumberInput placeholder='Enter number...' disabled />
                    )}

                    {form.values.fieldType === CustomFieldType.SELECT && (
                      <Select
                        placeholder='Select option...'
                        data={form.values.options || []}
                        disabled
                      />
                    )}

                    {form.values.fieldType === CustomFieldType.DATE && (
                      <TextInput placeholder='Select date...' disabled />
                    )}

                    {form.values.fieldType === CustomFieldType.BOOLEAN && (
                      <Switch label='Yes/No' disabled />
                    )}
                  </div>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        <Group justify='flex-end' mt='xl'>
          <Button variant='light' onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type='submit' loading={isSubmitting}>
            Create Custom Field
          </Button>
        </Group>
      </form>
    </Container>
  );
}
