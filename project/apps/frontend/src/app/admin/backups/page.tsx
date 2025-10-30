'use client';

import { useState } from 'react';
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
  Alert,
  Card,
  Stack,
  Grid,
  TextInput,
  Select,
  Pagination,
} from '@mantine/core';
import {
  IconPlus,
  IconDownload,
  IconTrash,
  IconDots,
  IconRefresh,
  IconDatabase,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';
import {
  useBackups,
  useCreateBackup,
  useRestoreBackup,
} from '../../../hooks/useBackup';
import { notifications } from '@mantine/notifications';
import { Backup } from '../../../types/unified';
import {
  FILE_CONSTANTS,
  FILE_SIZE_UNITS,
  BACKUP_STATUS_OPTIONS,
} from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function BackupsPage() {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: backups, isLoading, refetch } = useBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();

  const filteredBackups =
    backups?.filter(backup => {
      const matchesSearch = backup.filename
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || true; // All backups are considered available
      return matchesSearch && matchesStatus;
    }) || [];

  const totalPages = Math.ceil(filteredBackups.length / pageSize);
  const paginatedBackups = filteredBackups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
      notifications.show({
        title: 'Backup Created',
        message: 'Backup has been created successfully',
        color: primaryLight,
      });
      setCreateModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create backup',
        color: primaryDark,
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      await restoreBackup.mutateAsync(selectedBackup.id);
      notifications.show({
        title: 'Backup Restored',
        message: 'Backup has been restored successfully',
        color: primaryLight,
      });
      setRestoreModalOpen(false);
      setSelectedBackup(null);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to restore backup',
        color: primaryDark,
      });
    }
  };

  const handleDownloadBackup = (backup: Backup) => {
    // Implement download functionality
    notifications.show({
      title: 'Download Started',
      message: `Downloading backup: ${backup.filename}`,
      color: 'blue',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = FILE_CONSTANTS.BYTES_PER_KB;
    const sizes = FILE_SIZE_UNITS;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Backup Management</Title>
          <Text c='dimmed' size='sm'>
            Manage system backups and restore points
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
          loading={createBackup.isPending}
        >
          Create Backup
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={8}>
          <Card>
            <Group justify='space-between' mb='md'>
              <Group>
                <TextInput
                  placeholder='Search backups...'
                  leftSection={<IconDatabase size={16} />}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 300 }}
                />
                <Select
                  placeholder='Filter by status'
                  data={[
                    { value: 'all', label: 'All Status' },
                    ...BACKUP_STATUS_OPTIONS,
                  ]}
                  value={statusFilter}
                  onChange={value => setStatusFilter(value || 'all')}
                  style={{ width: 200 }}
                />
              </Group>
              <ActionIcon
                variant='light'
                onClick={() => refetch()}
                loading={isLoading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedBackups.map(backup => (
                  <Table.Tr key={backup.id}>
                    <Table.Td>
                      <Text fw={500}>{backup.filename}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color='green'
                        variant='light'
                        leftSection={<IconCheck size={12} />}
                      >
                        Available
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>{formatFileSize(backup.size)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm' c='dimmed'>
                        {new Date(backup.createdAt).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm' c='dimmed' truncate>
                        Backup created on{' '}
                        {new Date(backup.createdAt).toLocaleDateString()}
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
                            leftSection={<IconDownload size={14} />}
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={false}
                          >
                            Download
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconDatabase size={14} />}
                            onClick={() => {
                              setSelectedBackup(backup);
                              setRestoreModalOpen(true);
                            }}
                            disabled={false}
                          >
                            Restore
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color='red'
                            onClick={() => {
                              setSelectedBackup(backup);
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
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack>
            <Card>
              <Stack>
                <Title order={4}>Backup Statistics</Title>
                <Group justify='space-between'>
                  <Text size='sm'>Total Backups</Text>
                  <Text fw={500}>{backups?.length || 0}</Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>Completed</Text>
                  <Text fw={500} c='green'>
                    {backups?.length || 0}
                  </Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>In Progress</Text>
                  <Text fw={500} c='blue'>
                    0
                  </Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>Failed</Text>
                  <Text fw={500} c='red'>
                    0
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Card>
              <Stack>
                <Title order={4}>Quick Actions</Title>
                <Button
                  variant='light'
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateModalOpen(true)}
                  loading={createBackup.isPending}
                  fullWidth
                >
                  Create New Backup
                </Button>
                <Button
                  variant='light'
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => refetch()}
                  fullWidth
                >
                  Refresh List
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Create Backup Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title='Create New Backup'
      >
        <Stack>
          <Alert color='red' title='Backup Information'>
            This will create a complete backup of the system including all data,
            settings, and configurations.
          </Alert>
          <Text size='sm' c='dimmed'>
            The backup process may take several minutes depending on the amount
            of data.
          </Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='light' onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              loading={createBackup.isPending}
            >
              Create Backup
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal
        opened={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        title='Restore Backup'
      >
        <Stack>
          <Alert
            color='red'
            title='Warning'
            icon={<IconAlertTriangle size={16} />}
          >
            This action will restore the system to the state when this backup
            was created. All current data will be replaced with the backup data.
          </Alert>
          <Text size='sm'>
            Backup: <strong>{selectedBackup?.filename}</strong>
          </Text>
          <Text size='sm' c='dimmed'>
            Created:{' '}
            {selectedBackup?.createdAt
              ? new Date(selectedBackup.createdAt).toLocaleString()
              : 'Unknown'}
          </Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='light' onClick={() => setRestoreModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='red'
              onClick={handleRestoreBackup}
              loading={restoreBackup.isPending}
            >
              Restore Backup
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Backup Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete Backup'
      >
        <Stack>
          <Alert color='red' title='Warning'>
            Are you sure you want to delete this backup? This action cannot be
            undone.
          </Alert>
          <Text size='sm'>
            Backup: <strong>{selectedBackup?.filename}</strong>
          </Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color='red'>Delete Backup</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
