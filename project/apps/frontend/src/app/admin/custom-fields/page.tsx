'use client';

import { useState, useRef } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
  Select,
  Switch,
  Grid,
  Alert,
  Pagination,
  Stack,
  Card,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconSearch,
  IconRefresh,
  IconEye,
  IconCopy,
} from '@tabler/icons-react';
import {
  useCustomFields,
  useDeleteCustomField,
  useCreateCustomField,
  useUpdateCustomField,
} from '../../../hooks/useCustomFields';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  CustomField,
  CreateCustomFieldInput,
  CustomFieldType,
} from '../../../types/unified';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function CustomFieldsPage() {
  const { primaryLight, primaryLighter, primaryDark, primaryDarker } = useDynamicTheme();
  const [search, setSearch] = useState('');
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const createOptionIdCounter = useRef(0);
  const editOptionIdCounter = useRef(0);
  const [createOptionIds, setCreateOptionIds] = useState<number[]>([]);
  const [editOptionIds, setEditOptionIds] = useState<number[]>([]);

  const { data: customFields, isLoading, refetch } = useCustomFields();
  const deleteCustomField = useDeleteCustomField();
  const createCustomField = useCreateCustomField();
  const updateCustomField = useUpdateCustomField();

  const createForm = useForm<CreateCustomFieldInput>({
    initialValues: {
      name: '',
      fieldType: CustomFieldType.TEXT,
      isRequired: false,
      options: [],
      isActive: true,
      description: '',
    },
    validate: {
      name: (value: string) => (!value ? 'Name is required' : null),
      fieldType: (value: string) => (!value ? 'Type is required' : null),
    },
  });

  const editForm = useForm<CreateCustomFieldInput>({
    initialValues: {
      name: '',
      fieldType: CustomFieldType.TEXT,
      isRequired: false,
      options: [],
      isActive: true,
      description: '',
    },
  });

  const filteredFields =
    customFields?.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(search.toLowerCase()) ||
        (field.description && field.description.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    }) || [];

  const totalPages = Math.ceil(filteredFields.length / pageSize);
  const paginatedFields = filteredFields.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreateField = async (values: CreateCustomFieldInput) => {
    try {
      await createCustomField.mutateAsync(values);
      notifications.show({
        title: 'Field Added to Ticket Form',
        message: 'Custom field has been added to the ticket creation form',
        color: primaryLight,
      });
      setCreateModalOpen(false);
      createForm.reset();
      setCreateOptionIds([]);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create custom field',
        color: primaryDark,
      });
    }
  };

  const handleEditField = async (values: CreateCustomFieldInput) => {
    if (!selectedField) return;
    
    try {
      await updateCustomField.mutateAsync({
        id: selectedField.id,
        data: values,
      });
      notifications.show({
        title: 'Ticket Form Field Updated',
        message: 'Custom field has been updated in the ticket creation form',
        color: primaryLight,
      });
      setEditModalOpen(false);
      setSelectedField(null);
      setEditOptionIds([]);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update custom field',
        color: primaryDark,
      });
    }
  };

  const handleDeleteField = async () => {
    if (!selectedField) return;

    try {
      await deleteCustomField.mutateAsync(selectedField.id);
      notifications.show({
        title: 'Field Removed from Ticket Form',
        message: 'Custom field has been removed from the ticket creation form',
        color: primaryLight,
      });
      setDeleteModalOpen(false);
      setSelectedField(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete custom field',
        color: primaryDark,
      });
    }
  };

  const openEditModal = (field: CustomField) => {
    setSelectedField(field);
    const options = field.options || [];
    editForm.setValues({
      name: field.name,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      options: options,
      isActive: field.isActive,
      description: field.description || '',
    });
    // Initialize option IDs for existing options
    const initialIds = options.map(() => editOptionIdCounter.current++);
    setEditOptionIds(initialIds);
    setEditModalOpen(true);
  };

  // Options management functions for create form
  const handleAddOptionCreate = () => {
    const currentOptions = createForm.values.options || [];
    const newId = createOptionIdCounter.current++;
    createForm.setFieldValue('options', [...currentOptions, '']);
    setCreateOptionIds([...createOptionIds, newId]);
  };

  const handleRemoveOptionCreate = (index: number) => {
    const currentOptions = createForm.values.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    const newIds = createOptionIds.filter((_, i) => i !== index);
    createForm.setFieldValue('options', newOptions);
    setCreateOptionIds(newIds);
  };

  const handleOptionChangeCreate = (index: number, value: string) => {
    const currentOptions = createForm.values.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    createForm.setFieldValue('options', newOptions);
  };

  // Options management functions for edit form
  const handleAddOptionEdit = () => {
    const currentOptions = editForm.values.options || [];
    const newId = editOptionIdCounter.current++;
    editForm.setFieldValue('options', [...currentOptions, '']);
    setEditOptionIds([...editOptionIds, newId]);
  };

  const handleRemoveOptionEdit = (index: number) => {
    const currentOptions = editForm.values.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    const newIds = editOptionIds.filter((_, i) => i !== index);
    editForm.setFieldValue('options', newOptions);
    setEditOptionIds(newIds);
  };

  const handleOptionChangeEdit = (index: number, value: string) => {
    const currentOptions = editForm.values.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    editForm.setFieldValue('options', newOptions);
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'TEXT':
        return primaryLight;
      case 'NUMBER':
        return primaryLighter;
      case 'SELECT':
        return primaryLight;
      case 'MULTI_SELECT':
        return primaryLighter;
      case 'DATE':
        return primaryDarker;
      case 'BOOLEAN':
        return primaryDarker;
      default:
        return primaryDark;
    }
  };

  const fieldTypeOptions = [
    { value: CustomFieldType.TEXT, label: 'Text' },
    { value: CustomFieldType.NUMBER, label: 'Number' },
    { value: CustomFieldType.SELECT, label: 'Select' },
    { value: CustomFieldType.DATE, label: 'Date' },
    { value: CustomFieldType.BOOLEAN, label: 'Boolean' },
  ];

  return (
    <Container size='xl' py='md'>
        <Group justify='space-between' mb='xl'>
          <div>
            <Title order={2}>Ticket Creation Fields</Title>
            <Text c='dimmed' size='sm'>
              Manage custom fields that appear in the ticket creation form
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Add Field to Ticket Form
          </Button>
        </Group>

        <Alert color={primaryLight} mb='md'>
          <Text size='sm'>
            <strong>How it works:</strong> All custom fields you create will appear in the ticket creation form for all users. 
            Changes here are immediately reflected in the ticket creation form - no refresh needed!
          </Text>
        </Alert>

      <Card>
        <Group justify='space-between' mb='md'>
          <Group>
            <TextInput
              placeholder='Search custom fields...'
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 300 }}
            />
          </Group>
          <Group>
            <ActionIcon
              variant='light'
              onClick={() => refetch()}
              loading={isLoading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Field Name</Table.Th>
              <Table.Th>Field Type</Table.Th>
              <Table.Th>Required</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedFields.map(field => (
              <Table.Tr key={field.id}>
                <Table.Td>
                  <div>
                    <Text fw={500}>{field.name}</Text>
                    {field.description && (
                      <Text size='xs' c='dimmed' mt={2}>
                        {field.description}
                      </Text>
                    )}
                  </div>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={getFieldTypeColor(field.fieldType)}
                    variant='light'
                  >
                    {field.fieldType}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={field.isRequired ? primaryDark : primaryDarker}
                    variant='light'
                  >
                    {field.isRequired ? 'Required' : 'Optional'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={field.isActive ? primaryLighter : primaryDark}
                    variant='light'
                  >
                    {field.isActive ? 'Shown in Form' : 'Hidden from Form'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size='sm' c='dimmed'>
                    {new Date(field.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant='subtle'>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                     
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openEditModal(field)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCopy size={14} />}
                        onClick={() => {
                          // Implement duplicate functionality
                        }}
                      >
                        Duplicate
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={async () => {
                          try {
                            await updateCustomField.mutateAsync({
                              id: field.id,
                              data: { isActive: !field.isActive },
                            });
                            notifications.show({
                              title: 'Ticket Form Field Updated',
                              message: `Field ${field.isActive ? 'hidden from' : 'shown in'} ticket creation form`,
                              color: primaryLight,
                            });
                          } catch (error) {
                            notifications.show({
                              title: 'Error',
                              message: 'Failed to update field status',
                              color: primaryDark,
                            });
                          }
                        }}
                      >
                        {field.isActive ? 'Hide from Ticket Form' : 'Show in Ticket Form'}
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color='red'
                        onClick={() => {
                          setSelectedField(field);
                          setDeleteModalOpen(true);
                        }}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {totalPages > 1 && (
          <Group justify='center' mt='md'>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
            />
          </Group>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateOptionIds([]);
        }}
        title='Add Field to Ticket Form'
        size='lg'
      >
        <form onSubmit={createForm.onSubmit(handleCreateField)}>
          <Stack>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label='Name'
                  placeholder='field_name'
                  required
                  {...createForm.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label='Type'
                  placeholder='Select field type'
                  required
                  data={fieldTypeOptions}
                  {...createForm.getInputProps('fieldType', {
                    onChange: (value: string | null) => {
                      const fieldType = value as CustomFieldType;
                      createForm.setFieldValue('fieldType', fieldType);
                      if (fieldType === CustomFieldType.SELECT) {
                        // Initialize with empty option if no options exist
                        if (!createForm.values.options || createForm.values.options.length === 0) {
                          const newId = createOptionIdCounter.current++;
                          createForm.setFieldValue('options', ['']);
                          setCreateOptionIds([newId]);
                        }
                      } else {
                        // Clear options when switching away from SELECT
                        createForm.setFieldValue('options', []);
                        setCreateOptionIds([]);
                      }
                    },
                  })}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label='Field Description'
              placeholder='Help text shown to users when creating tickets (optional)'
              {...createForm.getInputProps('description')}
            />

            {createForm.values.fieldType === CustomFieldType.SELECT && (
              <Card withBorder p='md'>
                <Stack gap='sm'>
                  <div>
                    <Text size='sm' fw={500} mb={4}>
                      Options
                    </Text>
                    <Text size='xs' c='dimmed'>
                      Define the available options for this select field
                    </Text>
                  </div>

                  {createForm.values.options?.map((option, index) => {
                    let optionId = createOptionIds[index];
                    if (optionId === undefined) {
                      // Generate ID if missing (safety check)
                      optionId = createOptionIdCounter.current++;
                      setCreateOptionIds([...createOptionIds, optionId]);
                    }
                    return (
                      <Group key={`create-option-${optionId}`} gap='xs'>
                        <TextInput
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={e =>
                            handleOptionChangeCreate(index, e.target.value)
                          }
                          style={{ flex: 1 }}
                        />
                        <ActionIcon
                          variant='light'
                          color='red'
                          onClick={() => handleRemoveOptionCreate(index)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    );
                  })}

                  <Button
                    variant='light'
                    leftSection={<IconPlus size={14} />}
                    onClick={handleAddOptionCreate}
                    size='sm'
                  >
                    Add Option
                  </Button>
                </Stack>
              </Card>
            )}

            <Grid>
              <Grid.Col span={6}>
                <Switch
                  label='Required'
                  {...createForm.getInputProps('isRequired', {
                    type: 'checkbox',
                  })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Switch
                  label='Active'
                  {...createForm.getInputProps('isActive', {
                    type: 'checkbox',
                  })}
                />
              </Grid.Col>
            </Grid>

            <Group justify='flex-end' mt='md'>
              <Button variant='light' onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' loading={createCustomField.isPending}>
                Add to Ticket Form
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditOptionIds([]);
        }}
        title='Edit Ticket Form Field'
        size='lg'
      >
        <form onSubmit={editForm.onSubmit(handleEditField)}>
          <Stack>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label='Name'
                  placeholder='field_name'
                  required
                  {...editForm.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label='Type'
                  placeholder='Select field type'
                  required
                  data={fieldTypeOptions}
                  {...editForm.getInputProps('fieldType', {
                    onChange: (value: string | null) => {
                      const fieldType = value as CustomFieldType;
                      editForm.setFieldValue('fieldType', fieldType);
                      if (fieldType === CustomFieldType.SELECT) {
                        // Initialize with empty option if no options exist
                        if (!editForm.values.options || editForm.values.options.length === 0) {
                          const newId = editOptionIdCounter.current++;
                          editForm.setFieldValue('options', ['']);
                          setEditOptionIds([newId]);
                        }
                      } else {
                        // Clear options when switching away from SELECT
                        editForm.setFieldValue('options', []);
                        setEditOptionIds([]);
                      }
                    },
                  })}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label='Field Description'
              placeholder='Help text shown to users when creating tickets (optional)'
              {...editForm.getInputProps('description')}
            />

            {editForm.values.fieldType === CustomFieldType.SELECT && (
              <Card withBorder p='md'>
                <Stack gap='sm'>
                  <div>
                    <Text size='sm' fw={500} mb={4}>
                      Options
                    </Text>
                    <Text size='xs' c='dimmed'>
                      Define the available options for this select field
                    </Text>
                  </div>

                  {editForm.values.options?.map((option, index) => {
                    let optionId = editOptionIds[index];
                    if (optionId === undefined) {
                      // Generate ID if missing (safety check)
                      optionId = editOptionIdCounter.current++;
                      setEditOptionIds([...editOptionIds, optionId]);
                    }
                    return (
                      <Group key={`edit-option-${optionId}`} gap='xs'>
                        <TextInput
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={e =>
                            handleOptionChangeEdit(index, e.target.value)
                          }
                          style={{ flex: 1 }}
                        />
                        <ActionIcon
                          variant='light'
                          color='red'
                          onClick={() => handleRemoveOptionEdit(index)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    );
                  })}

                  <Button
                    variant='light'
                    leftSection={<IconPlus size={14} />}
                    onClick={handleAddOptionEdit}
                    size='sm'
                  >
                    Add Option
                  </Button>
                </Stack>
              </Card>
            )}

            <Grid>
              <Grid.Col span={6}>
                <Switch
                  label='Required'
                  {...editForm.getInputProps('isRequired', {
                    type: 'checkbox',
                  })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Switch
                  label='Active'
                  {...editForm.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            </Grid>

            <Group justify='flex-end' mt='md'>
              <Button variant='light' onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' loading={updateCustomField.isPending}>
                Update Ticket Form Field
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Remove Field from Ticket Form'
      >
        <Stack>
          <Alert color='red' title='Warning'>
            Are you sure you want to remove this field from the ticket creation form? 
            This action cannot be undone and the field will no longer appear when users create tickets.
          </Alert>
          <Text size='sm'>
            Field: <strong>{selectedField?.name}</strong>
          </Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='red'
              onClick={handleDeleteField}
              loading={deleteCustomField.isPending}
            >
              Remove from Ticket Form
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
