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
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading categories...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]}>
          Failed to load categories: {String(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>Categories</Title>
          <Text c='dimmed'>Create and manage custom ticket categories (active and inactive)</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Category
        </Button>
      </Group>

      <Card shadow='sm' padding='lg' radius='md' withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {categories?.map((category: Category) => (
              <Table.Tr 
                key={category.id}
                style={{
                  opacity: category.isActive ? 1 : 0.7,
                  backgroundColor: category.isActive ? 'transparent' : 'var(--mantine-color-gray-0)',
                }}
              >
                <Table.Td>
                  <Group gap='sm'>
                    <IconClipboardList size={16} />
                    <Text 
                      fw={500}
                      c={category.isActive ? undefined : 'dimmed'}
                      td={category.isActive ? undefined : 'line-through'}
                    >
                      {category.customName || category.name.charAt(0) + category.name.slice(1).toLowerCase()}
                    </Text>
                    {category.customName && (
                      <Badge size='xs' color={primaryLight} variant='light'>
                        Custom
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size='sm' c='dimmed'>
                    {category.description || 'No description'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={category.isActive ? primaryLighter : primaryDark}
                    variant='light'
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>
                    {new Date(category.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu shadow='md' width={200}>
                    <Menu.Target>
                      <ActionIcon variant='subtle'>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={() => {
                          // View category details
                        }}
                      >
                        View Details
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openEditModal(category)}
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
        <Card shadow='sm' padding='xl' radius='md' withBorder mt='md'>
          <Stack align='center' gap='md'>
            <IconClipboardList size={48} color='var(--mantine-color-dimmed)' />
            <Text size='lg' fw={500}>
              No categories found
            </Text>
            <Text c='dimmed' ta='center'>
              Create your first custom category to organize tickets.
            </Text>
            <Button onClick={() => setCreateModalOpen(true)}>
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
      >
        <form onSubmit={createForm.onSubmit(handleCreateCategory)}>
          <Stack gap='md'>
            <TextInput
              label='Category Name'
              placeholder='Enter your custom category name'
              required
              {...createForm.getInputProps('customName')}
            />
            <Textarea
              label='Description'
              placeholder='Enter category description (optional)'
              {...createForm.getInputProps('description')}
            />
            <Switch
              label='Active'
              description='Category is available for use'
              {...createForm.getInputProps('isActive', { type: 'checkbox' })}
            />
            <Group justify='flex-end'>
              <Button
                variant='outline'
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' loading={createCategoryMutation.isPending}>
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
      >
        <form onSubmit={editForm.onSubmit(handleUpdateCategory)}>
          <Stack gap='md'>
            <Select
              label='Category Type'
              placeholder='Select category type'
              required
              data={Object.values(TicketCategory).map(category => ({
                value: category,
                label: category === TicketCategory.CUSTOM ? 'Custom Category' : category.charAt(0) + category.slice(1).toLowerCase()
              }))}
              {...editForm.getInputProps('name')}
            />
            {editForm.values.name === TicketCategory.CUSTOM && (
              <TextInput
                label='Custom Category Name'
                placeholder='Enter your custom category name'
                required
                {...editForm.getInputProps('customName')}
              />
            )}
            <Textarea
              label='Description'
              placeholder='Enter category description (optional)'
              {...editForm.getInputProps('description')}
            />
            <Switch
              label='Active'
              description='Category is available for use'
              {...editForm.getInputProps('isActive', { type: 'checkbox' })}
            />
            <Group justify='flex-end'>
              <Button variant='outline' onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' loading={updateCategoryMutation.isPending}>
                Update Category
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

    </Container>
  );
}
