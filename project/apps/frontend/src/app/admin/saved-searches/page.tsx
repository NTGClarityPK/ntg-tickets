'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Table,
  Modal,
  TextInput,
  Textarea,
  MultiSelect,
  Switch,
  ActionIcon,
  Alert,
  Tabs,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCopy,
  IconStar,
  IconUsers,
  IconRefresh,
} from '@tabler/icons-react';
import {
  useSavedSearches,
  useCreateSavedSearch,
  useUpdateSavedSearch,
  useDeleteSavedSearch,
  useDuplicateSavedSearch,
  usePopularSearches,
} from '../../../hooks/useSavedSearches';
import { notifications } from '@mantine/notifications';
import { SavedSearch, PopularSavedSearch } from '../../../types/unified';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

interface SavedSearchFormData {
  name: string;
  description: string;
  searchCriteria: Record<string, unknown>;
  filters: {
    status?: string[];
    priority?: string[];
    category?: string[];
    assignedTo?: string[];
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
  isPublic: boolean;
  isDefault: boolean;
}

export default function SavedSearchesPage() {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearch, setSelectedSearch] = useState<{
    id: string;
    name: string;
    description: string;
    filters: Record<string, unknown>;
    isPublic: boolean;
    isDefault: boolean;
    createdAt: string;
    createdBy?: { name: string };
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('my-searches');
  const [formData, setFormData] = useState<SavedSearchFormData>({
    name: '',
    description: '',
    searchCriteria: {},
    filters: {},
    isPublic: false,
    isDefault: false,
  });

  const { data: savedSearches, isLoading, refetch } = useSavedSearches();
  const { data: popularSearches } = usePopularSearches(10);
  const createSearch = useCreateSavedSearch();
  const updateSearch = useUpdateSavedSearch();
  const deleteSearch = useDeleteSavedSearch();
  const duplicateSearch = useDuplicateSavedSearch();

  const handleCreateSearch = async () => {
    try {
      await createSearch.mutateAsync(formData);
      notifications.show({
        title: 'Success',
        message: 'Saved search created successfully',
        color: primaryLight,
      });
      setCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        searchCriteria: {},
        filters: {},
        isPublic: false,
        isDefault: false,
      });
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create saved search',
        color: primaryDark,
      });
    }
  };

  const handleUpdateSearch = async () => {
    if (!selectedSearch) return;
    try {
      await updateSearch.mutateAsync({
        id: selectedSearch.id,
        data: formData,
      });
      notifications.show({
        title: 'Success',
        message: 'Saved search updated successfully',
        color: primaryLight,
      });
      setEditModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update saved search',
        color: primaryDark,
      });
    }
  };

  const handleDeleteSearch = async () => {
    if (!selectedSearch) return;
    try {
      await deleteSearch.mutateAsync(selectedSearch.id);
      notifications.show({
        title: 'Success',
        message: 'Saved search deleted successfully',
        color: primaryLight,
      });
      setDeleteModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete saved search',
        color: primaryDark,
      });
    }
  };

  const handleDuplicateSearch = async (
    search:
      | {
          id: string;
          name: string;
          description: string;
          filters: Record<string, unknown>;
          isPublic: boolean;
          isDefault: boolean;
          createdAt: string;
        }
      | PopularSavedSearch
  ) => {
    try {
      await duplicateSearch.mutateAsync({
        id: search.id,
        name: `${search.name} (Copy)`,
      });
      notifications.show({
        title: 'Success',
        message: 'Saved search duplicated successfully',
        color: primaryLight,
      });
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to duplicate saved search',
        color: primaryDark,
      });
    }
  };

  const openEditModal = (search: {
    id: string;
    name: string;
    description: string;
    filters: Record<string, unknown>;
    isPublic: boolean;
    isDefault: boolean;
    createdAt: string;
  }) => {
    setSelectedSearch(search);
    setFormData({
      name: search.name,
      description: search.description || '',
      searchCriteria: {},
      filters: {
        status: [],
        priority: [],
        category: [],
        assignedTo: [],
        dateFrom: '',
        dateTo: '',
      },
      isPublic: search.isPublic || false,
      isDefault: false,
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (search: {
    id: string;
    name: string;
    description: string;
    filters: Record<string, unknown>;
    isPublic: boolean;
    isDefault: boolean;
    createdAt: string;
  }) => {
    setSelectedSearch(search);
    setDeleteModalOpen(true);
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Saved Searches</Title>
          <Text c='dimmed' size='sm'>
            Manage your saved search queries and filters
          </Text>
        </div>
        <Group>
          <Button
            variant='light'
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Search
          </Button>
        </Group>
      </Group>

      <Tabs
        value={activeTab}
        onChange={value => setActiveTab(value || 'my-searches')}
      >
        <Tabs.List>
          <Tabs.Tab value='my-searches' leftSection={<IconSearch size={16} />}>
            My Searches
          </Tabs.Tab>
          <Tabs.Tab value='public' leftSection={<IconUsers size={16} />}>
            Public Searches
          </Tabs.Tab>
          <Tabs.Tab value='popular' leftSection={<IconStar size={16} />}>
            Popular
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='my-searches'>
          <Card mt='md'>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>My Saved Searches</Title>
                <TextInput
                  placeholder='Search saved searches...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftSection={<IconSearch size={16} />}
                  style={{ width: 300 }}
                />
              </Group>

              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Filters</Table.Th>
                    <Table.Th>Visibility</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {savedSearches
                    ?.filter((search: SavedSearch) =>
                      search.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((search: SavedSearch) => (
                      <Table.Tr key={search.id}>
                        <Table.Td>
                          <Group>
                            <Text fw={500}>{search.name}</Text>
                            {false && (
                              <Badge color='blue' variant='light' size='xs'>
                                Default
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm' c='dimmed'>
                            {search.description || 'No description'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap='xs'>
                            <Badge variant='light' size='sm'>
                              Saved Search
                            </Badge>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={search.isPublic ? 'green' : 'gray'}
                            variant='light'
                            size='sm'
                          >
                            {search.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm' c='dimmed'>
                            {new Date(search.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap='xs'>
                            <ActionIcon
                              variant='light'
                              size='sm'
                              onClick={() =>
                                openEditModal({
                                  id: search.id,
                                  name: search.name,
                                  description: search.description || '',
                                  filters: {},
                                  isPublic: search.isPublic,
                                  isDefault: false,
                                  createdAt: search.createdAt,
                                })
                              }
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant='light'
                              size='sm'
                              color='blue'
                              onClick={() =>
                                handleDuplicateSearch({
                                  id: search.id,
                                  name: search.name,
                                  description: search.description || '',
                                  filters: {},
                                  isPublic: search.isPublic,
                                  isDefault: false,
                                  createdAt: search.createdAt,
                                })
                              }
                            >
                              <IconCopy size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant='light'
                              size='sm'
                              color='red'
                              onClick={() =>
                                openDeleteModal({
                                  id: search.id,
                                  name: search.name,
                                  description: search.description || '',
                                  filters: {},
                                  isPublic: search.isPublic,
                                  isDefault: false,
                                  createdAt: search.createdAt,
                                })
                              }
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='public'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Public Saved Searches</Title>
              <Alert color='blue' title='Public Searches'>
                These searches are shared with all users and can be used by
                anyone.
              </Alert>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Created By</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {savedSearches
                    ?.filter((search: SavedSearch) => search.isPublic)
                    .map((search: SavedSearch) => (
                      <Table.Tr key={search.id}>
                        <Table.Td>
                          <Text fw={500}>{search.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm' c='dimmed'>
                            {search.description || 'No description'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>Unknown</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap='xs'>
                            <ActionIcon
                              variant='light'
                              size='sm'
                              color='blue'
                              onClick={() =>
                                handleDuplicateSearch({
                                  id: search.id,
                                  name: search.name,
                                  description: search.description || '',
                                  filters: {},
                                  isPublic: search.isPublic,
                                  isDefault: false,
                                  createdAt: search.createdAt,
                                })
                              }
                            >
                              <IconCopy size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='popular'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Popular Searches</Title>
              <Text size='sm' c='dimmed'>
                Most used saved searches across the system
              </Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Usage Count</Table.Th>
                    <Table.Th>Last Used</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {popularSearches?.map((search: PopularSavedSearch) => (
                    <Table.Tr key={search.id}>
                      <Table.Td>
                        <Text fw={500}>{search.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color='blue' variant='light'>
                          {search.usageCount} uses
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm' c='dimmed'>
                          {new Date(search.updatedAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap='xs'>
                          <ActionIcon
                            variant='light'
                            size='sm'
                            color='blue'
                            onClick={() => handleDuplicateSearch(search)}
                          >
                            <IconCopy size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Create Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title='Create Saved Search'
        size='lg'
      >
        <Stack>
          <TextInput
            label='Name'
            placeholder='Enter search name'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label='Description'
            placeholder='Enter search description'
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <Grid>
            <Grid.Col span={6}>
              <MultiSelect
                label='Status'
                placeholder='Select status'
                data={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                value={formData.filters.status || []}
                onChange={value =>
                  setFormData({
                    ...formData,
                    filters: { ...formData.filters, status: value },
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <MultiSelect
                label='Priority'
                placeholder='Select priority'
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                value={formData.filters.priority || []}
                onChange={value =>
                  setFormData({
                    ...formData,
                    filters: {
                      ...formData.filters,
                      priority: value,
                    },
                  })
                }
              />
            </Grid.Col>
          </Grid>
          <Group>
            <Switch
              label='Public Search'
              description='Make this search available to all users'
              checked={formData.isPublic}
              onChange={e =>
                setFormData({ ...formData, isPublic: e.currentTarget.checked })
              }
            />
            <Switch
              label='Default Search'
              description='Set as your default search'
              checked={formData.isDefault}
              onChange={e =>
                setFormData({ ...formData, isDefault: e.currentTarget.checked })
              }
            />
          </Group>
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSearch}
              loading={createSearch.isPending}
            >
              Create Search
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title='Edit Saved Search'
        size='lg'
      >
        <Stack>
          <TextInput
            label='Name'
            placeholder='Enter search name'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label='Description'
            placeholder='Enter search description'
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <Grid>
            <Grid.Col span={6}>
              <MultiSelect
                label='Status'
                placeholder='Select status'
                data={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                value={formData.filters.status || []}
                onChange={value =>
                  setFormData({
                    ...formData,
                    filters: { ...formData.filters, status: value },
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <MultiSelect
                label='Priority'
                placeholder='Select priority'
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                value={formData.filters.priority || []}
                onChange={value =>
                  setFormData({
                    ...formData,
                    filters: {
                      ...formData.filters,
                      priority: value,
                    },
                  })
                }
              />
            </Grid.Col>
          </Grid>
          <Group>
            <Switch
              label='Public Search'
              description='Make this search available to all users'
              checked={formData.isPublic}
              onChange={e =>
                setFormData({ ...formData, isPublic: e.currentTarget.checked })
              }
            />
            <Switch
              label='Default Search'
              description='Set as your default search'
              checked={formData.isDefault}
              onChange={e =>
                setFormData({ ...formData, isDefault: e.currentTarget.checked })
              }
            />
          </Group>
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSearch}
              loading={updateSearch.isPending}
            >
              Update Search
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete Saved Search'
      >
        <Stack>
          <Text>
            Are you sure you want to delete "{selectedSearch?.name}"? This
            action cannot be undone.
          </Text>
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='red'
              onClick={handleDeleteSearch}
              loading={deleteSearch.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
