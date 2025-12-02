'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Badge,
  Stack,
  Loader,
  Alert,
  Table,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
  Textarea,
  Switch,
  Select,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconClipboardList,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../../../hooks/useCategories';
import { Category, TicketCategory } from '../../../types/unified';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function CategoriesPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryLighter, primaryDark } = useDynamicTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: categories, isLoading, error } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const createForm = useForm({
    initialValues: {
      name: TicketCategory.CUSTOM,
      customName: '',
      description: '',
      isActive: true,
    },
    validate: {
      customName: (value: string) => (!value ? 'Category name is required' : null),
    },
  });

  const editForm = useForm({
    initialValues: {
      name: TicketCategory.HARDWARE,
      customName: '',
      description: '',
      isActive: true,
    },
    validate: {
      name: (value: string) => (!value ? 'Category type is required' : null),
      customName: (value: string, values: typeof createForm.values) => 
        values.name === TicketCategory.CUSTOM && !value ? 'Custom name is required for custom categories' : null,
    },
  });

  const handleCreateCategory = async (values: typeof createForm.values) => {
    try {
      await createCategoryMutation.mutateAsync(values);
      
      notifications.show({
        title: 'Success',
        message: 'Category created successfully',
        color: primaryLight,
      });
      setCreateModalOpen(false);
      createForm.reset();
    } catch (error) {

      
      notifications.show({
        title: 'Error',
        message: `Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        color: primaryDark,
      });
    }
  };

  const handleUpdateCategory = async (values: typeof editForm.values) => {
    if (!selectedCategory) return;

    try {
      await updateCategoryMutation.mutateAsync({
        id: selectedCategory.id,
        data: values,
      });
      notifications.show({
        title: 'Success',
        message: 'Category updated successfully',
        color: primaryLight,
      });
      setEditModalOpen(false);
      setSelectedCategory(null);
      editForm.reset();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update category',
        color: primaryDark,
      });
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    editForm.setValues({
      name: category.name,
      customName: category.customName || '',
      description: category.description || '',
      isActive: category.isActive,
    });
    setEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <Container size='xl' py='md' data-testid="categories-page-loading">
        <Group justify='center' mt='xl' data-testid="categories-page-loading-group">
          <Loader size='lg' data-testid="categories-page-loader" />
          <Text data-testid="categories-page-loading-text">Loading categories...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md' data-testid="categories-page-error">
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]} data-testid="categories-page-error-alert">
          Failed to load categories: {String(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="categories-page">
      <Group justify='space-between' mb='xl' data-testid="categories-page-header">
        <div data-testid="categories-page-header-content">
          <Title order={1} data-testid="categories-page-title">Categories</Title>
          <Text c='dimmed' data-testid="categories-page-subtitle">Create and manage custom ticket categories (active and inactive)</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
          data-testid="categories-page-add-button"
        >
          Add Category
        </Button>
      </Group>

      <Card shadow='sm' padding='lg' radius='md' withBorder data-testid="categories-page-card">
        <Table data-testid="categories-page-table">
          <Table.Thead data-testid="categories-page-table-head">
            <Table.Tr data-testid="categories-page-table-head-row">
              <Table.Th data-testid="categories-page-table-header-name">Name</Table.Th>
              <Table.Th data-testid="categories-page-table-header-description">Description</Table.Th>
              <Table.Th data-testid="categories-page-table-header-status">Status</Table.Th>
              <Table.Th data-testid="categories-page-table-header-created">Created</Table.Th>
              <Table.Th data-testid="categories-page-table-header-actions">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody data-testid="categories-page-table-body">
            {categories?.map((category: Category) => (
              <Table.Tr 
                key={category.id}
                style={{
                  opacity: category.isActive ? 1 : 0.7,
                  backgroundColor: category.isActive ? 'transparent' : 'var(--mantine-color-gray-0)',
                }}
                data-testid={`categories-page-table-row-${category.id}`}
              >
                <Table.Td data-testid={`categories-page-table-cell-name-${category.id}`}>
                  <Group gap='sm' data-testid={`categories-page-table-cell-name-group-${category.id}`}>
                    <IconClipboardList size={16} data-testid={`categories-page-table-cell-name-icon-${category.id}`} />
                    <Text 
                      fw={500}
                      c={category.isActive ? undefined : 'dimmed'}
                      td={category.isActive ? undefined : 'line-through'}
                      data-testid={`categories-page-table-cell-name-text-${category.id}`}
                    >
                      {category.customName || category.name.charAt(0) + category.name.slice(1).toLowerCase()}
                    </Text>
                    {category.customName && (
                      <Badge size='xs' color={primaryLight} variant='light' data-testid={`categories-page-table-cell-name-badge-${category.id}`}>
                        Custom
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td data-testid={`categories-page-table-cell-description-${category.id}`}>
                  <Text size='sm' c='dimmed' data-testid={`categories-page-table-cell-description-text-${category.id}`}>
                    {category.description || 'No description'}
                  </Text>
                </Table.Td>
                <Table.Td data-testid={`categories-page-table-cell-status-${category.id}`}>
                  <Badge
                    color={category.isActive ? primaryLighter : primaryDark}
                    variant='light'
                    data-testid={`categories-page-table-cell-status-badge-${category.id}`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td data-testid={`categories-page-table-cell-created-${category.id}`}>
                  <Text size='sm' data-testid={`categories-page-table-cell-created-text-${category.id}`}>
                    {new Date(category.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td data-testid={`categories-page-table-cell-actions-${category.id}`}>
                  <Menu shadow='md' width={200} data-testid={`categories-page-menu-${category.id}`}>
                    <Menu.Target>
                      <ActionIcon variant='subtle' data-testid={`categories-page-menu-button-${category.id}`}>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown data-testid={`categories-page-menu-dropdown-${category.id}`}>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={() => {
                          // View category details
                        }}
                        data-testid={`categories-page-menu-view-${category.id}`}
                      >
                        View Details
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openEditModal(category)}
                        data-testid={`categories-page-menu-edit-${category.id}`}
                      >
                        Edit
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {categories && categories.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder mt='md' data-testid="categories-page-empty-state">
          <Stack align='center' gap='md' data-testid="categories-page-empty-state-content">
            <IconClipboardList size={48} color='var(--mantine-color-dimmed)' data-testid="categories-page-empty-state-icon" />
            <Text size='lg' fw={500} data-testid="categories-page-empty-state-title">
              No categories found
            </Text>
            <Text c='dimmed' ta='center' data-testid="categories-page-empty-state-message">
              Create your first custom category to organize tickets.
            </Text>
            <Button onClick={() => setCreateModalOpen(true)} data-testid="categories-page-empty-state-create-button">
              Create Category
            </Button>
          </Stack>
        </Card>
      )}

      {/* Create Category Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title='Create Custom Category'
        centered
        data-testid="categories-page-create-modal"
      >
        <form onSubmit={createForm.onSubmit(handleCreateCategory)} data-testid="categories-page-create-form">
          <Stack gap='md' data-testid="categories-page-create-form-stack">
            <TextInput
              label='Category Name'
              placeholder='Enter your custom category name'
              required
              {...createForm.getInputProps('customName')}
              data-testid="categories-page-create-name-input"
            />
            <Textarea
              label='Description'
              placeholder='Enter category description (optional)'
              {...createForm.getInputProps('description')}
              data-testid="categories-page-create-description-input"
            />
            <Switch
              label='Active'
              description='Category is available for use'
              {...createForm.getInputProps('isActive', { type: 'checkbox' })}
              data-testid="categories-page-create-active-switch"
            />
            <Group justify='flex-end' data-testid="categories-page-create-form-actions">
              <Button
                variant='outline'
                onClick={() => setCreateModalOpen(false)}
                data-testid="categories-page-create-cancel-button"
              >
                Cancel
              </Button>
              <Button type='submit' loading={createCategoryMutation.isPending} data-testid="categories-page-create-submit-button">
                Create Category
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title='Edit Category'
        centered
        data-testid="categories-page-edit-modal"
      >
        <form onSubmit={editForm.onSubmit(handleUpdateCategory)} data-testid="categories-page-edit-form">
          <Stack gap='md' data-testid="categories-page-edit-form-stack">
            <Select
              label='Category Type'
              placeholder='Select category type'
              required
              data={Object.values(TicketCategory).map(category => ({
                value: category,
                label: category === TicketCategory.CUSTOM ? 'Custom Category' : category.charAt(0) + category.slice(1).toLowerCase()
              }))}
              {...editForm.getInputProps('name')}
              data-testid="categories-page-edit-type-select"
            />
            {editForm.values.name === TicketCategory.CUSTOM && (
              <TextInput
                label='Custom Category Name'
                placeholder='Enter your custom category name'
                required
                {...editForm.getInputProps('customName')}
                data-testid="categories-page-edit-custom-name-input"
              />
            )}
            <Textarea
              label='Description'
              placeholder='Enter category description (optional)'
              {...editForm.getInputProps('description')}
              data-testid="categories-page-edit-description-input"
            />
            <Switch
              label='Active'
              description='Category is available for use'
              {...editForm.getInputProps('isActive', { type: 'checkbox' })}
              data-testid="categories-page-edit-active-switch"
            />
            <Group justify='flex-end' data-testid="categories-page-edit-form-actions">
              <Button variant='outline' onClick={() => setEditModalOpen(false)} data-testid="categories-page-edit-cancel-button">
                Cancel
              </Button>
              <Button type='submit' loading={updateCategoryMutation.isPending} data-testid="categories-page-edit-submit-button">
                Update Category
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

    </Container>
  );
}
