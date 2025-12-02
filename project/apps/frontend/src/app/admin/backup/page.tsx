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
  Alert,
  ActionIcon,
  Tabs,
  Code,
  Divider,
  Loader,
  Center,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPlus,
  IconDownload,
  IconTrash,
  IconRefresh,
  IconDatabase,
  IconCloud,
  IconClock,
  IconCheck,
  IconX,
  IconSettings,
  IconShield,
} from '@tabler/icons-react';
import {
  useBackups,
  useCreateBackup,
  useRestoreBackup,
  useDeleteBackup,
} from '../../../hooks/useBackup';
import { notifications } from '@mantine/notifications';
import { FILE_CONSTANTS, FILE_SIZE_UNITS } from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function BackupPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const [selectedBackup, setSelectedBackup] = useState<{
    id: string;
    name: string;
    status: string;
    size: number;
    createdAt: string;
    type: string;
    downloadUrl?: string;
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('backups');

  const { data: backups, isLoading, refetch } = useBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const deleteBackup = useDeleteBackup();

  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
      notifications.show({
        title: 'Success',
        message: 'Backup creation started successfully',
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
        title: 'Success',
        message: 'Backup restoration started successfully',
        color: primaryLight,
      });
      setRestoreModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to restore backup',
        color: primaryDark,
      });
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;
    try {
      await deleteBackup.mutateAsync(selectedBackup.id);
      notifications.show({
        title: 'Success',
        message: 'Backup deleted successfully',
        color: primaryLight,
      });
      setDeleteModalOpen(false);
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete backup',
        color: primaryDark,
      });
    }
  };

  const handleDownloadBackup = (backup: {
    id: string;
    name: string;
    status: string;
    size: number;
    createdAt: string;
    type: string;
    downloadUrl?: string;
  }) => {
    // Create download link for backup file
    const link = document.createElement('a');
    link.href = backup.downloadUrl || '';
    link.download = backup.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: theme.primaryColor,
      in_progress: theme.primaryColor,
      failed: theme.colors[theme.primaryColor][9],
      pending: theme.colors[theme.primaryColor][4],
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      completed: <IconCheck size={14} />,
      in_progress: <IconClock size={14} />,
      failed: <IconX size={14} />,
      pending: <IconClock size={14} />,
    };
    return icons[status] || <IconDatabase size={14} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = FILE_CONSTANTS.BYTES_PER_KB;
    const sizes = FILE_SIZE_UNITS;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container size='xl' py='md' data-testid="backup-page">
      <Group justify='space-between' mb='xl' data-testid="backup-page-header">
        <div data-testid="backup-page-header-content">
          <Title order={2} data-testid="backup-page-title">Backup Management</Title>
          <Text c='dimmed' size='sm' data-testid="backup-page-subtitle">
            Manage database backups and system restoration
          </Text>
        </div>
        <Group data-testid="backup-page-header-actions">
          <ActionIcon
            variant='light'
            size='lg'
            onClick={() => refetch()}
            disabled={isLoading}
            title='Refresh'
            data-testid="backup-page-refresh-button"
          >
            {isLoading ? <Loader size={16} data-testid="backup-page-refresh-loader" /> : <IconRefresh size={20} />}
          </ActionIcon>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
            loading={createBackup.isPending}
            data-testid="backup-page-create-button"
          >
            Create Backup
          </Button>
        </Group>
      </Group>

      <Tabs
        value={activeTab}
        onChange={value => setActiveTab(value || 'backups')}
        data-testid="backup-page-tabs"
      >
        <Tabs.List data-testid="backup-page-tabs-list">
          <Tabs.Tab value='backups' leftSection={<IconDatabase size={16} />} data-testid="backup-page-tab-backups">
            Backups
          </Tabs.Tab>
          <Tabs.Tab value='settings' leftSection={<IconSettings size={16} />} data-testid="backup-page-tab-settings">
            Settings
          </Tabs.Tab>
          <Tabs.Tab value='monitoring' leftSection={<IconShield size={16} />} data-testid="backup-page-tab-monitoring">
            Monitoring
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='backups' data-testid="backup-page-panel-backups">
          <Card mt='md' data-testid="backup-page-backups-card">
            <Stack data-testid="backup-page-backups-stack">
              <Group justify='space-between' data-testid="backup-page-backups-header">
                <Title order={4} data-testid="backup-page-backups-title">Database Backups</Title>
                <Text size='sm' c='dimmed' data-testid="backup-page-backups-count">
                  {backups?.length || 0} backup(s) available
                </Text>
              </Group>

              {isLoading ? (
                <Center py='xl' data-testid="backup-page-backups-loading">
                  <Loader size='lg' data-testid="backup-page-backups-loader" />
                </Center>
              ) : (
                <Table data-testid="backup-page-backups-table">
                  <Table.Thead data-testid="backup-page-backups-table-head">
                    <Table.Tr data-testid="backup-page-backups-table-head-row">
                      <Table.Th data-testid="backup-page-backups-table-header-name">Name</Table.Th>
                      <Table.Th data-testid="backup-page-backups-table-header-status">Status</Table.Th>
                      <Table.Th data-testid="backup-page-backups-table-header-size">Size</Table.Th>
                      <Table.Th data-testid="backup-page-backups-table-header-created">Created</Table.Th>
                      <Table.Th data-testid="backup-page-backups-table-header-type">Type</Table.Th>
                      <Table.Th data-testid="backup-page-backups-table-header-actions">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody data-testid="backup-page-backups-table-body">
                    {backups?.map(backup => {
                      return (
                        <Table.Tr key={backup.id} data-testid={`backup-page-backups-table-row-${backup.id}`}>
                          <Table.Td data-testid={`backup-page-backups-table-cell-name-${backup.id}`}>
                            <Stack gap='xs' data-testid={`backup-page-backups-table-cell-name-stack-${backup.id}`}>
                              <Text fw={500} data-testid={`backup-page-backups-table-cell-name-text-${backup.id}`}>{backup.filename}</Text>
                              <Text size='xs' c='dimmed' data-testid={`backup-page-backups-table-cell-name-subtext-${backup.id}`}>
                                Database backup
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td data-testid={`backup-page-backups-table-cell-status-${backup.id}`}>
                            <Badge
                              color={getStatusColor('completed')}
                              variant='light'
                              leftSection={getStatusIcon('completed')}
                              size='sm'
                              data-testid={`backup-page-backups-table-cell-status-badge-${backup.id}`}
                            >
                              completed
                            </Badge>
                          </Table.Td>
                          <Table.Td data-testid={`backup-page-backups-table-cell-size-${backup.id}`}>
                            <Text size='sm' data-testid={`backup-page-backups-table-cell-size-text-${backup.id}`}>{formatFileSize(backup.size)}</Text>
                          </Table.Td>
                          <Table.Td data-testid={`backup-page-backups-table-cell-created-${backup.id}`}>
                            <Stack gap='xs' data-testid={`backup-page-backups-table-cell-created-stack-${backup.id}`}>
                              <Text size='sm' data-testid={`backup-page-backups-table-cell-created-text-${backup.id}`}>
                                {new Date(backup.createdAt).toLocaleString()}
                              </Text>
                              <Text size='xs' c='dimmed' data-testid={`backup-page-backups-table-cell-created-subtext-${backup.id}`}>
                                {new Date(
                                  backup.createdAt
                                ).toLocaleDateString()}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td data-testid={`backup-page-backups-table-cell-type-${backup.id}`}>
                            <Badge color={theme.colors[theme.primaryColor][9]} variant='light' size='sm' data-testid={`backup-page-backups-table-cell-type-badge-${backup.id}`}>
                              Full
                            </Badge>
                          </Table.Td>
                          <Table.Td data-testid={`backup-page-backups-table-cell-actions-${backup.id}`}>
                            <Group gap='xs' data-testid={`backup-page-backups-table-cell-actions-group-${backup.id}`}>
                              <ActionIcon
                                variant='light'
                                size='sm'
                                color={theme.colors[theme.primaryColor][9]}
                                onClick={() =>
                                  handleDownloadBackup({
                                    id: backup.id,
                                    name: backup.filename,
                                    status: 'completed',
                                    size: backup.size,
                                    createdAt: backup.createdAt,
                                    type: 'Full',
                                  })
                                }
                                disabled={false}
                                data-testid={`backup-page-backups-table-cell-actions-download-${backup.id}`}
                              >
                                <IconDownload size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant='light'
                                size='sm'
                                color={theme.primaryColor}
                                onClick={() => {
                                  setSelectedBackup({
                                    id: backup.id,
                                    name: backup.filename,
                                    status: 'completed',
                                    size: backup.size,
                                    createdAt: backup.createdAt,
                                    type: 'Full',
                                  });
                                  setRestoreModalOpen(true);
                                }}
                                disabled={false}
                                data-testid={`backup-page-backups-table-cell-actions-restore-${backup.id}`}
                              >
                                <IconRefresh size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant='light'
                                size='sm'
                                color={theme.colors[theme.primaryColor][9]}
                                onClick={() => {
                                  setSelectedBackup({
                                    id: backup.id,
                                    name: backup.filename,
                                    status: 'completed',
                                    size: backup.size,
                                    createdAt: backup.createdAt,
                                    type: 'Full',
                                  });
                                  setDeleteModalOpen(true);
                                }}
                                data-testid={`backup-page-backups-table-cell-actions-delete-${backup.id}`}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='settings' data-testid="backup-page-panel-settings">
          <Grid mt='md' data-testid="backup-page-settings-grid">
            <Grid.Col span={6} data-testid="backup-page-settings-col-left">
              <Card data-testid="backup-page-settings-card">
                <Stack data-testid="backup-page-settings-stack">
                  <Title order={4} data-testid="backup-page-settings-title">Backup Settings</Title>
                  <Alert color={theme.colors[theme.primaryColor][9]} title='Automatic Backups' data-testid="backup-page-settings-alert">
                    Configure automatic backup schedules and retention policies.
                  </Alert>
                  <Stack data-testid="backup-page-settings-frequency">
                    <Text size='sm' fw={500} data-testid="backup-page-settings-frequency-label">
                      Backup Frequency
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="backup-page-settings-frequency-value">
                      Daily at 2:00 AM
                    </Text>
                  </Stack>
                  <Stack data-testid="backup-page-settings-retention">
                    <Text size='sm' fw={500} data-testid="backup-page-settings-retention-label">
                      Retention Policy
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="backup-page-settings-retention-value">
                      Keep 30 days of backups
                    </Text>
                  </Stack>
                  <Stack data-testid="backup-page-settings-storage">
                    <Text size='sm' fw={500} data-testid="backup-page-settings-storage-label">
                      Storage Location
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="backup-page-settings-storage-value">
                      Cloud Storage (AWS S3)
                    </Text>
                  </Stack>
                  <Button
                    variant='light'
                    leftSection={<IconSettings size={16} />}
                    data-testid="backup-page-settings-configure-button"
                  >
                    Configure Settings
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6} data-testid="backup-page-settings-col-right">
              <Card data-testid="backup-page-settings-stats-card">
                <Stack data-testid="backup-page-settings-stats-stack">
                  <Title order={4} data-testid="backup-page-settings-stats-title">Backup Statistics</Title>
                  <Grid data-testid="backup-page-settings-stats-grid">
                    <Grid.Col span={6} data-testid="backup-page-settings-stats-col-total">
                      <Stack align='center' data-testid="backup-page-settings-stats-total-stack">
                        <IconDatabase size={32} color={theme.colors[theme.primaryColor][9]} data-testid="backup-page-settings-stats-total-icon" />
                        <Text size='xl' fw={700} data-testid="backup-page-settings-stats-total-value">
                          {backups?.length || 0}
                        </Text>
                        <Text size='sm' c='dimmed' data-testid="backup-page-settings-stats-total-label">
                          Total Backups
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6} data-testid="backup-page-settings-stats-col-size">
                      <Stack align='center' data-testid="backup-page-settings-stats-size-stack">
                        <IconCloud size={32} color={theme.primaryColor} data-testid="backup-page-settings-stats-size-icon" />
                        <Text size='xl' fw={700} data-testid="backup-page-settings-stats-size-value">
                          {formatFileSize(
                            backups?.reduce(
                              (total: number, backup: { size?: number }) =>
                                total + (backup.size || 0),
                              0
                            ) || 0
                          )}
                        </Text>
                        <Text size='sm' c='dimmed' data-testid="backup-page-settings-stats-size-label">
                          Total Size
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                  <Divider data-testid="backup-page-settings-stats-divider" />
                  <Stack data-testid="backup-page-settings-stats-last-backup">
                    <Text size='sm' fw={500} data-testid="backup-page-settings-stats-last-backup-label">
                      Last Backup
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="backup-page-settings-stats-last-backup-value">
                      {backups?.[0]?.createdAt
                        ? new Date(backups[0].createdAt).toLocaleString()
                        : 'No backups yet'}
                    </Text>
                  </Stack>
                  <Stack data-testid="backup-page-settings-stats-next-scheduled">
                    <Text size='sm' fw={500} data-testid="backup-page-settings-stats-next-scheduled-label">
                      Next Scheduled
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="backup-page-settings-stats-next-scheduled-value">
                      Tomorrow at 2:00 AM
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value='monitoring' data-testid="backup-page-panel-monitoring">
          <Card mt='md' data-testid="backup-page-monitoring-card">
            <Stack data-testid="backup-page-monitoring-stack">
              <Title order={4} data-testid="backup-page-monitoring-title">Backup Monitoring</Title>
              <Alert color={theme.primaryColor} title='System Health' data-testid="backup-page-monitoring-alert">
                All backup systems are operational and monitoring is active.
              </Alert>
              <Grid data-testid="backup-page-monitoring-status-grid">
                <Grid.Col span={4} data-testid="backup-page-monitoring-status-col-service">
                  <Card padding='md' data-testid="backup-page-monitoring-status-card-service">
                    <Stack align='center' data-testid="backup-page-monitoring-status-stack-service">
                      <IconCheck size={32} color={theme.primaryColor} data-testid="backup-page-monitoring-status-icon-service" />
                      <Text fw={500} data-testid="backup-page-monitoring-status-title-service">Backup Service</Text>
                      <Badge color={theme.primaryColor} variant='light' data-testid="backup-page-monitoring-status-badge-service">
                        Online
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4} data-testid="backup-page-monitoring-status-col-storage">
                  <Card padding='md' data-testid="backup-page-monitoring-status-card-storage">
                    <Stack align='center' data-testid="backup-page-monitoring-status-stack-storage">
                      <IconCloud size={32} color={theme.colors[theme.primaryColor][9]} data-testid="backup-page-monitoring-status-icon-storage" />
                      <Text fw={500} data-testid="backup-page-monitoring-status-title-storage">Cloud Storage</Text>
                      <Badge color={theme.colors[theme.primaryColor][9]} variant='light' data-testid="backup-page-monitoring-status-badge-storage">
                        Connected
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4} data-testid="backup-page-monitoring-status-col-database">
                  <Card padding='md' data-testid="backup-page-monitoring-status-card-database">
                    <Stack align='center' data-testid="backup-page-monitoring-status-stack-database">
                      <IconDatabase size={32} color='purple' data-testid="backup-page-monitoring-status-icon-database" />
                      <Text fw={500} data-testid="backup-page-monitoring-status-title-database">Database</Text>
                      <Badge color='purple' variant='light' data-testid="backup-page-monitoring-status-badge-database">
                        Healthy
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
              <Stack data-testid="backup-page-monitoring-activity">
                <Text fw={500} data-testid="backup-page-monitoring-activity-title">Recent Backup Activity</Text>
                <Table data-testid="backup-page-monitoring-activity-table">
                  <Table.Thead data-testid="backup-page-monitoring-activity-table-head">
                    <Table.Tr data-testid="backup-page-monitoring-activity-table-head-row">
                      <Table.Th data-testid="backup-page-monitoring-activity-table-header-time">Time</Table.Th>
                      <Table.Th data-testid="backup-page-monitoring-activity-table-header-action">Action</Table.Th>
                      <Table.Th data-testid="backup-page-monitoring-activity-table-header-status">Status</Table.Th>
                      <Table.Th data-testid="backup-page-monitoring-activity-table-header-duration">Duration</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody data-testid="backup-page-monitoring-activity-table-body">
                    {backups?.slice(0, 5).map(backup => (
                      <Table.Tr key={backup.id} data-testid={`backup-page-monitoring-activity-table-row-${backup.id}`}>
                        <Table.Td data-testid={`backup-page-monitoring-activity-table-cell-time-${backup.id}`}>
                          <Text size='sm' data-testid={`backup-page-monitoring-activity-table-cell-time-text-${backup.id}`}>
                            {new Date(backup.createdAt).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td data-testid={`backup-page-monitoring-activity-table-cell-action-${backup.id}`}>
                          <Text size='sm' data-testid={`backup-page-monitoring-activity-table-cell-action-text-${backup.id}`}>Backup Created</Text>
                        </Table.Td>
                        <Table.Td data-testid={`backup-page-monitoring-activity-table-cell-status-${backup.id}`}>
                          <Badge
                            color={getStatusColor('completed')}
                            variant='light'
                            size='sm'
                            data-testid={`backup-page-monitoring-activity-table-cell-status-badge-${backup.id}`}
                          >
                            completed
                          </Badge>
                        </Table.Td>
                        <Table.Td data-testid={`backup-page-monitoring-activity-table-cell-duration-${backup.id}`}>
                          <Text size='sm' data-testid={`backup-page-monitoring-activity-table-cell-duration-text-${backup.id}`}>N/A</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Create Backup Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title='Create New Backup'
        data-testid="backup-page-create-modal"
      >
        <Stack data-testid="backup-page-create-modal-stack">
          <Alert color={theme.colors[theme.primaryColor][4]} title='Important' data-testid="backup-page-create-modal-alert">
            Creating a backup will temporarily impact system performance. This
            process may take several minutes depending on database size.
          </Alert>
          <Text size='sm' c='dimmed' data-testid="backup-page-create-modal-description">
            A full database backup will be created and stored in cloud storage.
            You will be notified when the backup is complete.
          </Text>
          <Group justify='flex-end' data-testid="backup-page-create-modal-actions">
            <Button variant='light' onClick={() => setCreateModalOpen(false)} data-testid="backup-page-create-modal-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              loading={createBackup.isPending}
              leftSection={<IconDatabase size={16} />}
              data-testid="backup-page-create-modal-submit-button"
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
        title='Restore from Backup'
        data-testid="backup-page-restore-modal"
      >
        <Stack data-testid="backup-page-restore-modal-stack">
          <Alert color={theme.colors[theme.primaryColor][9]} title='Warning' data-testid="backup-page-restore-modal-alert">
            Restoring from a backup will overwrite all current data. This action
            cannot be undone. Make sure you have a current backup before
            proceeding.
          </Alert>
          <Text size='sm' fw={500} data-testid="backup-page-restore-modal-details-label">
            Backup Details:
          </Text>
          <Code block data-testid="backup-page-restore-modal-details-code">
            {selectedBackup &&
              JSON.stringify(
                {
                  name: selectedBackup.name,
                  created: selectedBackup.createdAt,
                  size: formatFileSize(selectedBackup.size),
                  type: selectedBackup.type,
                },
                null,
                2
              )}
          </Code>
          <Group justify='flex-end' data-testid="backup-page-restore-modal-actions">
            <Button variant='light' onClick={() => setRestoreModalOpen(false)} data-testid="backup-page-restore-modal-cancel-button">
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleRestoreBackup}
              loading={restoreBackup.isPending}
              leftSection={<IconRefresh size={16} />}
              data-testid="backup-page-restore-modal-submit-button"
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
        data-testid="backup-page-delete-modal"
      >
        <Stack data-testid="backup-page-delete-modal-stack">
          <Alert color={theme.colors[theme.primaryColor][4]} title='Confirm Deletion' data-testid="backup-page-delete-modal-alert">
            Are you sure you want to delete this backup? This action cannot be
            undone.
          </Alert>
          <Text size='sm' fw={500} data-testid="backup-page-delete-modal-filename">
            Backup: {selectedBackup?.name}
          </Text>
          <Text size='sm' c='dimmed' data-testid="backup-page-delete-modal-created">
            Created:{' '}
            {selectedBackup &&
              new Date(selectedBackup.createdAt).toLocaleString()}
          </Text>
          <Group justify='flex-end' data-testid="backup-page-delete-modal-actions">
            <Button variant='light' onClick={() => setDeleteModalOpen(false)} data-testid="backup-page-delete-modal-cancel-button">
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleDeleteBackup}
              loading={deleteBackup.isPending}
              leftSection={<IconTrash size={16} />}
              data-testid="backup-page-delete-modal-submit-button"
            >
              Delete Backup
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
