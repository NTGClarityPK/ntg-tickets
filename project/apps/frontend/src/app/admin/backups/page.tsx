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
  Loader,
  Menu,
  Modal,
  Alert,
  Card,
  Stack,
  Grid,
  TextInput,
  Select,
  Pagination,
  useMantineTheme,
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
  const theme = useMantineTheme();
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
      color: theme.primaryColor,
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
    <Container size='xl' py='md' data-testid="backups-page">
      <Group justify='space-between' mb='xl' data-testid="backups-page-header">
        <div data-testid="backups-page-header-content">
          <Title order={2} data-testid="backups-page-title">Backup Management</Title>
          <Text c='dimmed' size='sm' data-testid="backups-page-subtitle">
            Manage system backups and restore points
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
          loading={createBackup.isPending}
          data-testid="backups-page-create-button"
        >
          Create Backup
        </Button>
      </Group>

      <Grid data-testid="backups-page-grid">
        <Grid.Col span={8} data-testid="backups-page-main-col">
          <Card data-testid="backups-page-main-card">
            <Group justify='space-between' mb='md' data-testid="backups-page-filters">
              <Group data-testid="backups-page-filters-group">
                <TextInput
                  placeholder='Search backups...'
                  leftSection={<IconDatabase size={16} />}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 300 }}
                  data-testid="backups-page-search-input"
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
                  data-testid="backups-page-status-filter"
                />
              </Group>
              <ActionIcon
                variant='light'
                size='lg'
                onClick={() => refetch()}
                disabled={isLoading}
                title='Refresh'
                data-testid="backups-page-refresh-button"
              >
                {isLoading ? <Loader size={16} data-testid="backups-page-refresh-loader" /> : <IconRefresh size={20} />}
              </ActionIcon>
            </Group>

            <Table data-testid="backups-page-table">
              <Table.Thead data-testid="backups-page-table-head">
                <Table.Tr data-testid="backups-page-table-head-row">
                  <Table.Th data-testid="backups-page-table-header-name">Name</Table.Th>
                  <Table.Th data-testid="backups-page-table-header-status">Status</Table.Th>
                  <Table.Th data-testid="backups-page-table-header-size">Size</Table.Th>
                  <Table.Th data-testid="backups-page-table-header-created">Created</Table.Th>
                  <Table.Th data-testid="backups-page-table-header-description">Description</Table.Th>
                  <Table.Th style={{ width: 100 }} data-testid="backups-page-table-header-actions">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody data-testid="backups-page-table-body">
                {paginatedBackups.map(backup => (
                  <Table.Tr key={backup.id} data-testid={`backups-page-table-row-${backup.id}`}>
                    <Table.Td data-testid={`backups-page-table-cell-name-${backup.id}`}>
                      <Text fw={500} data-testid={`backups-page-table-cell-name-text-${backup.id}`}>{backup.filename}</Text>
                    </Table.Td>
                    <Table.Td data-testid={`backups-page-table-cell-status-${backup.id}`}>
                      <Badge
                        color={theme.primaryColor}
                        variant='light'
                        leftSection={<IconCheck size={12} />}
                        data-testid={`backups-page-table-cell-status-badge-${backup.id}`}
                      >
                        Available
                      </Badge>
                    </Table.Td>
                    <Table.Td data-testid={`backups-page-table-cell-size-${backup.id}`}>
                      <Text size='sm' data-testid={`backups-page-table-cell-size-text-${backup.id}`}>{formatFileSize(backup.size)}</Text>
                    </Table.Td>
                    <Table.Td data-testid={`backups-page-table-cell-created-${backup.id}`}>
                      <Text size='sm' c='dimmed' data-testid={`backups-page-table-cell-created-text-${backup.id}`}>
                        {new Date(backup.createdAt).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td data-testid={`backups-page-table-cell-description-${backup.id}`}>
                      <Text size='sm' c='dimmed' truncate data-testid={`backups-page-table-cell-description-text-${backup.id}`}>
                        Backup created on{' '}
                        {new Date(backup.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td data-testid={`backups-page-table-cell-actions-${backup.id}`}>
                      <Menu data-testid={`backups-page-menu-${backup.id}`}>
                        <Menu.Target>
                          <ActionIcon variant='subtle' data-testid={`backups-page-menu-button-${backup.id}`}>
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown data-testid={`backups-page-menu-dropdown-${backup.id}`}>
                          <Menu.Item
                            leftSection={<IconDownload size={14} />}
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={false}
                            data-testid={`backups-page-menu-download-${backup.id}`}
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
                            data-testid={`backups-page-menu-restore-${backup.id}`}
                          >
                            Restore
                          </Menu.Item>
                          <Menu.Divider data-testid={`backups-page-menu-divider-${backup.id}`} />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color={theme.colors[theme.primaryColor][9]}
                            onClick={() => {
                              setSelectedBackup(backup);
                              setDeleteModalOpen(true);
                            }}
                            data-testid={`backups-page-menu-delete-${backup.id}`}
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
              <Group justify='center' mt='md' data-testid="backups-page-pagination-group">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  data-testid="backups-page-pagination"
                />
              </Group>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={4} data-testid="backups-page-sidebar-col">
          <Stack data-testid="backups-page-sidebar-stack">
            <Card data-testid="backups-page-stats-card">
              <Stack data-testid="backups-page-stats-stack">
                <Title order={4} data-testid="backups-page-stats-title">Backup Statistics</Title>
                <Group justify='space-between' data-testid="backups-page-stats-total">
                  <Text size='sm' data-testid="backups-page-stats-total-label">Total Backups</Text>
                  <Text fw={500} data-testid="backups-page-stats-total-value">{backups?.length || 0}</Text>
                </Group>
                <Group justify='space-between' data-testid="backups-page-stats-completed">
                  <Text size='sm' data-testid="backups-page-stats-completed-label">Completed</Text>
                  <Text fw={500} c={theme.primaryColor} data-testid="backups-page-stats-completed-value">
                    {backups?.length || 0}
                  </Text>
                </Group>
                <Group justify='space-between' data-testid="backups-page-stats-in-progress">
                  <Text size='sm' data-testid="backups-page-stats-in-progress-label">In Progress</Text>
                  <Text fw={500} c={theme.colors[theme.primaryColor][6]} data-testid="backups-page-stats-in-progress-value">
                    0
                  </Text>
                </Group>
                <Group justify='space-between' data-testid="backups-page-stats-failed">
                  <Text size='sm' data-testid="backups-page-stats-failed-label">Failed</Text>
                  <Text fw={500} c={theme.colors[theme.primaryColor][9]} data-testid="backups-page-stats-failed-value">
                    0
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Card data-testid="backups-page-actions-card">
              <Stack data-testid="backups-page-actions-stack">
                <Title order={4} data-testid="backups-page-actions-title">Quick Actions</Title>
                <Button
                  variant='light'
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateModalOpen(true)}
                  loading={createBackup.isPending}
                  fullWidth
                  data-testid="backups-page-actions-create-button"
                >
                  Create New Backup
                </Button>
                <Button
                  variant='light'
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => refetch()}
                  fullWidth
                  data-testid="backups-page-actions-refresh-button"
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
        data-testid="backups-page-create-modal"
      >
        <Stack data-testid="backups-page-create-modal-stack">
          <Alert color={theme.colors[theme.primaryColor][9]} title='Backup Information' data-testid="backups-page-create-modal-alert">
            This will create a complete backup of the system including all data,
            settings, and configurations.
          </Alert>
          <Text size='sm' c='dimmed' data-testid="backups-page-create-modal-description">
            The backup process may take several minutes depending on the amount
            of data.
          </Text>
          <Group justify='flex-end' mt='md' data-testid="backups-page-create-modal-actions">
            <Button variant='light' onClick={() => setCreateModalOpen(false)} data-testid="backups-page-create-modal-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              loading={createBackup.isPending}
              data-testid="backups-page-create-modal-submit-button"
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
        data-testid="backups-page-restore-modal"
      >
        <Stack data-testid="backups-page-restore-modal-stack">
          <Alert
            color={theme.colors[theme.primaryColor][9]}
            title='Warning'
            icon={<IconAlertTriangle size={16} />}
            data-testid="backups-page-restore-modal-alert"
          >
            This action will restore the system to the state when this backup
            was created. All current data will be replaced with the backup data.
          </Alert>
          <Text size='sm' data-testid="backups-page-restore-modal-filename">
            Backup: <strong>{selectedBackup?.filename}</strong>
          </Text>
          <Text size='sm' c='dimmed' data-testid="backups-page-restore-modal-created">
            Created:{' '}
            {selectedBackup?.createdAt
              ? new Date(selectedBackup.createdAt).toLocaleString()
              : 'Unknown'}
          </Text>
          <Group justify='flex-end' mt='md' data-testid="backups-page-restore-modal-actions">
            <Button variant='light' onClick={() => setRestoreModalOpen(false)} data-testid="backups-page-restore-modal-cancel-button">
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleRestoreBackup}
              loading={restoreBackup.isPending}
              data-testid="backups-page-restore-modal-submit-button"
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
        data-testid="backups-page-delete-modal"
      >
        <Stack data-testid="backups-page-delete-modal-stack">
          <Alert color={theme.colors[theme.primaryColor][9]} title='Warning' data-testid="backups-page-delete-modal-alert">
            Are you sure you want to delete this backup? This action cannot be
            undone.
          </Alert>
          <Text size='sm' data-testid="backups-page-delete-modal-filename">
            Backup: <strong>{selectedBackup?.filename}</strong>
          </Text>
          <Group justify='flex-end' mt='md' data-testid="backups-page-delete-modal-actions">
            <Button variant='light' onClick={() => setDeleteModalOpen(false)} data-testid="backups-page-delete-modal-cancel-button">
              Cancel
            </Button>
            <Button color={theme.colors[theme.primaryColor][9]} data-testid="backups-page-delete-modal-submit-button">Delete Backup</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
