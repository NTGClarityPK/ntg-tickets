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
  useMantineTheme,
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
  const theme = useMantineTheme();
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
    <Container size='xl' py='md' data-testid="custom-fields-page">
        <Group justify='space-between' mb='xl' data-testid="custom-fields-header">
          <div data-testid="custom-fields-header-content">
            <Title order={2} data-testid="custom-fields-title">Ticket Creation Fields</Title>
            <Text c='dimmed' size='sm' data-testid="custom-fields-subtitle">
              Manage custom fields that appear in the ticket creation form
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
            data-testid="custom-fields-create-button"
          >
            Add Field to Ticket Form
          </Button>
        </Group>

        <Alert color={primaryLight} mb='md' data-testid="custom-fields-info-alert">
          <Text size='sm' data-testid="custom-fields-info-text">
            <strong>How it works:</strong> All custom fields you create will appear in the ticket creation form for all users. 
            Changes here are immediately reflected in the ticket creation form - no refresh needed!
          </Text>
        </Alert>

      <Card data-testid="custom-fields-card">
        <Group justify='space-between' mb='md' data-testid="custom-fields-toolbar">
          <Group data-testid="custom-fields-search-group">
            <TextInput
              placeholder='Search custom fields...'
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 300 }}
              data-testid="custom-fields-search-input"
            />
          </Group>
          <Group data-testid="custom-fields-actions-group">
            <ActionIcon
              variant='light'
              onClick={() => refetch()}
              loading={isLoading}
              data-testid="custom-fields-refresh-button"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Table data-testid="custom-fields-table">
          <Table.Thead data-testid="custom-fields-table-head">
            <Table.Tr data-testid="custom-fields-table-header-row">
              <Table.Th data-testid="custom-fields-table-header-name">Field Name</Table.Th>
              <Table.Th data-testid="custom-fields-table-header-type">Field Type</Table.Th>
              <Table.Th data-testid="custom-fields-table-header-required">Required</Table.Th>
              <Table.Th data-testid="custom-fields-table-header-status">Status</Table.Th>
              <Table.Th data-testid="custom-fields-table-header-created">Created</Table.Th>
              <Table.Th data-testid="custom-fields-table-header-actions">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody data-testid="custom-fields-table-body">
            {paginatedFields.map(field => (
              <Table.Tr key={field.id} data-testid={`custom-fields-table-row-${field.id}`}>
                <Table.Td data-testid={`custom-fields-table-row-name-${field.id}`}>
                  <div data-testid={`custom-fields-field-name-${field.id}`}>
                    <Text fw={500} data-testid={`custom-fields-field-name-text-${field.id}`}>{field.name}</Text>
                    {field.description && (
                      <Text size='xs' c='dimmed' mt={2} data-testid={`custom-fields-field-description-${field.id}`}>
                        {field.description}
                      </Text>
                    )}
                  </div>
                </Table.Td>
                <Table.Td data-testid={`custom-fields-table-row-type-${field.id}`}>
                  <Badge
                    color={getFieldTypeColor(field.fieldType)}
                    variant='light'
                    data-testid={`custom-fields-field-type-badge-${field.id}`}
                  >
                    {field.fieldType}
                  </Badge>
                </Table.Td>
                <Table.Td data-testid={`custom-fields-table-row-required-${field.id}`}>
                  <Badge
                    color={field.isRequired ? primaryDark : primaryDarker}
                    variant='light'
                    data-testid={`custom-fields-field-required-badge-${field.id}`}
                  >
                    {field.isRequired ? 'Required' : 'Optional'}
                  </Badge>
                </Table.Td>
                <Table.Td data-testid={`custom-fields-table-row-status-${field.id}`}>
                  <Badge
                    color={field.isActive ? primaryLighter : primaryDark}
                    variant='light'
                    data-testid={`custom-fields-field-status-badge-${field.id}`}
                  >
                    {field.isActive ? 'Shown in Form' : 'Hidden from Form'}
                  </Badge>
                </Table.Td>
                <Table.Td data-testid={`custom-fields-table-row-created-${field.id}`}>
                  <Text size='sm' c='dimmed' data-testid={`custom-fields-field-created-${field.id}`}>
                    {new Date(field.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td data-testid={`custom-fields-table-row-actions-${field.id}`}>
                  <Menu data-testid={`custom-fields-field-menu-${field.id}`}>
                    <Menu.Target>
                      <ActionIcon variant='subtle' data-testid={`custom-fields-field-menu-button-${field.id}`}>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown data-testid={`custom-fields-field-menu-dropdown-${field.id}`}>
                     
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openEditModal(field)}
                        data-testid={`custom-fields-field-edit-${field.id}`}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCopy size={14} />}
                        onClick={() => {
                          // Implement duplicate functionality
                        }}
                        data-testid={`custom-fields-field-duplicate-${field.id}`}
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
                        data-testid={`custom-fields-field-toggle-active-${field.id}`}
                      >
                        {field.isActive ? 'Hide from Ticket Form' : 'Show in Ticket Form'}
                      </Menu.Item>
                      <Menu.Divider data-testid={`custom-fields-field-menu-divider-${field.id}`} />
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color={theme.colors[theme.primaryColor][9]}
                        onClick={() => {
                          setSelectedField(field);
                          setDeleteModalOpen(true);
                        }}
                        data-testid={`custom-fields-field-delete-${field.id}`}
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
          <Group justify='center' mt='md' data-testid="custom-fields-pagination-group">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              data-testid="custom-fields-pagination"
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
        data-testid="custom-fields-create-modal"
      >
        <form onSubmit={createForm.onSubmit(handleCreateField)} data-testid="custom-fields-create-form">
          <Stack data-testid="custom-fields-create-form-content">
            <Grid data-testid="custom-fields-create-form-grid">
              <Grid.Col span={6} data-testid="custom-fields-create-name-col">
                <TextInput
                  label='Name'
                  placeholder='field_name'
                  required
                  {...createForm.getInputProps('name')}
                  data-testid="custom-fields-create-name-input"
                />
              </Grid.Col>
              <Grid.Col span={6} data-testid="custom-fields-create-type-col">
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
                  data-testid="custom-fields-create-type-select"
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label='Field Description'
              placeholder='Help text shown to users when creating tickets (optional)'
              {...createForm.getInputProps('description')}
              data-testid="custom-fields-create-description-input"
            />

            {createForm.values.fieldType === CustomFieldType.SELECT && (
              <Card withBorder p='md' data-testid="custom-fields-create-options-card">
                <Stack gap='sm' data-testid="custom-fields-create-options-stack">
                  <div data-testid="custom-fields-create-options-header">
                    <Text size='sm' fw={500} mb={4} data-testid="custom-fields-create-options-title">
                      Options
                    </Text>
                    <Text size='xs' c='dimmed' data-testid="custom-fields-create-options-description">
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
                      <Group key={`create-option-${optionId}`} gap='xs' data-testid={`custom-fields-create-option-group-${optionId}`}>
                        <TextInput
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={e =>
                            handleOptionChangeCreate(index, e.target.value)
                          }
                          style={{ flex: 1 }}
                          data-testid={`custom-fields-create-option-input-${optionId}`}
                        />
                        <ActionIcon
                          variant='light'
                          color={theme.colors[theme.primaryColor][9]}
                          onClick={() => handleRemoveOptionCreate(index)}
                          data-testid={`custom-fields-create-option-remove-${optionId}`}
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
                    data-testid="custom-fields-create-add-option-button"
                  >
                    Add Option
                  </Button>
                </Stack>
              </Card>
            )}

            <Grid data-testid="custom-fields-create-switches-grid">
              <Grid.Col span={6} data-testid="custom-fields-create-required-col">
                <Switch
                  label='Required'
                  {...createForm.getInputProps('isRequired', {
                    type: 'checkbox',
                  })}
                  data-testid="custom-fields-create-required-switch"
                />
              </Grid.Col>
              <Grid.Col span={6} data-testid="custom-fields-create-active-col">
                <Switch
                  label='Active'
                  {...createForm.getInputProps('isActive', {
                    type: 'checkbox',
                  })}
                  data-testid="custom-fields-create-active-switch"
                />
              </Grid.Col>
            </Grid>

            <Group justify='flex-end' mt='md' data-testid="custom-fields-create-form-actions">
              <Button variant='light' onClick={() => setCreateModalOpen(false)} data-testid="custom-fields-create-cancel-button">
                Cancel
              </Button>
              <Button type='submit' loading={createCustomField.isPending} data-testid="custom-fields-create-submit-button">
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
        data-testid="custom-fields-edit-modal"
      >
        <form onSubmit={editForm.onSubmit(handleEditField)} data-testid="custom-fields-edit-form">
          <Stack data-testid="custom-fields-edit-form-content">
            <Grid data-testid="custom-fields-edit-form-grid">
              <Grid.Col span={6} data-testid="custom-fields-edit-name-col">
                <TextInput
                  label='Name'
                  placeholder='field_name'
                  required
                  {...editForm.getInputProps('name')}
                  data-testid="custom-fields-edit-name-input"
                />
              </Grid.Col>
              <Grid.Col span={6} data-testid="custom-fields-edit-type-col">
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
                  data-testid="custom-fields-edit-type-select"
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label='Field Description'
              placeholder='Help text shown to users when creating tickets (optional)'
              {...editForm.getInputProps('description')}
              data-testid="custom-fields-edit-description-input"
            />

            {editForm.values.fieldType === CustomFieldType.SELECT && (
              <Card withBorder p='md' data-testid="custom-fields-edit-options-card">
                <Stack gap='sm' data-testid="custom-fields-edit-options-stack">
                  <div data-testid="custom-fields-edit-options-header">
                    <Text size='sm' fw={500} mb={4} data-testid="custom-fields-edit-options-title">
                      Options
                    </Text>
                    <Text size='xs' c='dimmed' data-testid="custom-fields-edit-options-description">
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
                      <Group key={`edit-option-${optionId}`} gap='xs' data-testid={`custom-fields-edit-option-group-${optionId}`}>
                        <TextInput
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={e =>
                            handleOptionChangeEdit(index, e.target.value)
                          }
                          style={{ flex: 1 }}
                          data-testid={`custom-fields-edit-option-input-${optionId}`}
                        />
                        <ActionIcon
                          variant='light'
                          color={theme.colors[theme.primaryColor][9]}
                          onClick={() => handleRemoveOptionEdit(index)}
                          data-testid={`custom-fields-edit-option-remove-${optionId}`}
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
                    data-testid="custom-fields-edit-add-option-button"
                  >
                    Add Option
                  </Button>
                </Stack>
              </Card>
            )}

            <Grid data-testid="custom-fields-edit-switches-grid">
              <Grid.Col span={6} data-testid="custom-fields-edit-required-col">
                <Switch
                  label='Required'
                  {...editForm.getInputProps('isRequired', {
                    type: 'checkbox',
                  })}
                  data-testid="custom-fields-edit-required-switch"
                />
              </Grid.Col>
              <Grid.Col span={6} data-testid="custom-fields-edit-active-col">
                <Switch
                  label='Active'
                  {...editForm.getInputProps('isActive', { type: 'checkbox' })}
                  data-testid="custom-fields-edit-active-switch"
                />
              </Grid.Col>
            </Grid>

            <Group justify='flex-end' mt='md' data-testid="custom-fields-edit-form-actions">
              <Button variant='light' onClick={() => setEditModalOpen(false)} data-testid="custom-fields-edit-cancel-button">
                Cancel
              </Button>
              <Button type='submit' loading={updateCustomField.isPending} data-testid="custom-fields-edit-submit-button">
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
        data-testid="custom-fields-delete-modal"
      >
        <Stack data-testid="custom-fields-delete-modal-content">
          <Alert color={theme.colors[theme.primaryColor][9]} title='Warning' data-testid="custom-fields-delete-warning-alert">
            Are you sure you want to remove this field from the ticket creation form? 
            This action cannot be undone and the field will no longer appear when users create tickets.
          </Alert>
          <Text size='sm' data-testid="custom-fields-delete-field-name">
            Field: <strong>{selectedField?.name}</strong>
          </Text>
          <Group justify='flex-end' mt='md' data-testid="custom-fields-delete-modal-actions">
            <Button variant='light' onClick={() => setDeleteModalOpen(false)} data-testid="custom-fields-delete-cancel-button">
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleDeleteField}
              loading={deleteCustomField.isPending}
              data-testid="custom-fields-delete-confirm-button"
            >
              Remove from Ticket Form
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
