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
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Backup Management</Title>
          <Text c='dimmed' size='sm'>
            Manage database backups and system restoration
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
            loading={createBackup.isPending}
          >
            Create Backup
          </Button>
        </Group>
      </Group>

      <Tabs
        value={activeTab}
        onChange={value => setActiveTab(value || 'backups')}
      >
        <Tabs.List>
          <Tabs.Tab value='backups' leftSection={<IconDatabase size={16} />}>
            Backups
          </Tabs.Tab>
          <Tabs.Tab value='settings' leftSection={<IconSettings size={16} />}>
            Settings
          </Tabs.Tab>
          <Tabs.Tab value='monitoring' leftSection={<IconShield size={16} />}>
            Monitoring
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='backups'>
          <Card mt='md'>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Database Backups</Title>
                <Text size='sm' c='dimmed'>
                  {backups?.length || 0} backup(s) available
                </Text>
              </Group>

              {isLoading ? (
                <Center py='xl'>
                  <Loader size='lg' />
                </Center>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Size</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {backups?.map(backup => {
                      return (
                        <Table.Tr key={backup.id}>
                          <Table.Td>
                            <Stack gap='xs'>
                              <Text fw={500}>{backup.filename}</Text>
                              <Text size='xs' c='dimmed'>
                                Database backup
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={getStatusColor('completed')}
                              variant='light'
                              leftSection={getStatusIcon('completed')}
                              size='sm'
                            >
                              completed
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size='sm'>{formatFileSize(backup.size)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap='xs'>
                              <Text size='sm'>
                                {new Date(backup.createdAt).toLocaleString()}
                              </Text>
                              <Text size='xs' c='dimmed'>
                                {new Date(
                                  backup.createdAt
                                ).toLocaleDateString()}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={theme.colors[theme.primaryColor][9]} variant='light' size='sm'>
                              Full
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap='xs'>
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

        <Tabs.Panel value='settings'>
          <Grid mt='md'>
            <Grid.Col span={6}>
              <Card>
                <Stack>
                  <Title order={4}>Backup Settings</Title>
                  <Alert color={theme.colors[theme.primaryColor][9]} title='Automatic Backups'>
                    Configure automatic backup schedules and retention policies.
                  </Alert>
                  <Stack>
                    <Text size='sm' fw={500}>
                      Backup Frequency
                    </Text>
                    <Text size='sm' c='dimmed'>
                      Daily at 2:00 AM
                    </Text>
                  </Stack>
                  <Stack>
                    <Text size='sm' fw={500}>
                      Retention Policy
                    </Text>
                    <Text size='sm' c='dimmed'>
                      Keep 30 days of backups
                    </Text>
                  </Stack>
                  <Stack>
                    <Text size='sm' fw={500}>
                      Storage Location
                    </Text>
                    <Text size='sm' c='dimmed'>
                      Cloud Storage (AWS S3)
                    </Text>
                  </Stack>
                  <Button
                    variant='light'
                    leftSection={<IconSettings size={16} />}
                  >
                    Configure Settings
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Stack>
                  <Title order={4}>Backup Statistics</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack align='center'>
                        <IconDatabase size={32} color={theme.colors[theme.primaryColor][9]} />
                        <Text size='xl' fw={700}>
                          {backups?.length || 0}
                        </Text>
                        <Text size='sm' c='dimmed'>
                          Total Backups
                        </Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack align='center'>
                        <IconCloud size={32} color={theme.primaryColor} />
                        <Text size='xl' fw={700}>
                          {formatFileSize(
                            backups?.reduce(
                              (total: number, backup: { size?: number }) =>
                                total + (backup.size || 0),
                              0
                            ) || 0
                          )}
                        </Text>
                        <Text size='sm' c='dimmed'>
                          Total Size
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                  <Divider />
                  <Stack>
                    <Text size='sm' fw={500}>
                      Last Backup
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {backups?.[0]?.createdAt
                        ? new Date(backups[0].createdAt).toLocaleString()
                        : 'No backups yet'}
                    </Text>
                  </Stack>
                  <Stack>
                    <Text size='sm' fw={500}>
                      Next Scheduled
                    </Text>
                    <Text size='sm' c='dimmed'>
                      Tomorrow at 2:00 AM
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value='monitoring'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Backup Monitoring</Title>
              <Alert color={theme.primaryColor} title='System Health'>
                All backup systems are operational and monitoring is active.
              </Alert>
              <Grid>
                <Grid.Col span={4}>
                  <Card padding='md'>
                    <Stack align='center'>
                      <IconCheck size={32} color={theme.primaryColor} />
                      <Text fw={500}>Backup Service</Text>
                      <Badge color={theme.primaryColor} variant='light'>
                        Online
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card padding='md'>
                    <Stack align='center'>
                      <IconCloud size={32} color={theme.colors[theme.primaryColor][9]} />
                      <Text fw={500}>Cloud Storage</Text>
                      <Badge color={theme.colors[theme.primaryColor][9]} variant='light'>
                        Connected
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card padding='md'>
                    <Stack align='center'>
                      <IconDatabase size={32} color='purple' />
                      <Text fw={500}>Database</Text>
                      <Badge color='purple' variant='light'>
                        Healthy
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
              <Stack>
                <Text fw={500}>Recent Backup Activity</Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Time</Table.Th>
                      <Table.Th>Action</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Duration</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {backups?.slice(0, 5).map(backup => (
                      <Table.Tr key={backup.id}>
                        <Table.Td>
                          <Text size='sm'>
                            {new Date(backup.createdAt).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>Backup Created</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor('completed')}
                            variant='light'
                            size='sm'
                          >
                            completed
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>N/A</Text>
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
      >
        <Stack>
          <Alert color={theme.colors[theme.primaryColor][4]} title='Important'>
            Creating a backup will temporarily impact system performance. This
            process may take several minutes depending on database size.
          </Alert>
          <Text size='sm' c='dimmed'>
            A full database backup will be created and stored in cloud storage.
            You will be notified when the backup is complete.
          </Text>
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              loading={createBackup.isPending}
              leftSection={<IconDatabase size={16} />}
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
      >
        <Stack>
          <Alert color={theme.colors[theme.primaryColor][9]} title='Warning'>
            Restoring from a backup will overwrite all current data. This action
            cannot be undone. Make sure you have a current backup before
            proceeding.
          </Alert>
          <Text size='sm' fw={500}>
            Backup Details:
          </Text>
          <Code block>
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
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setRestoreModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleRestoreBackup}
              loading={restoreBackup.isPending}
              leftSection={<IconRefresh size={16} />}
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
          <Alert color={theme.colors[theme.primaryColor][4]} title='Confirm Deletion'>
            Are you sure you want to delete this backup? This action cannot be
            undone.
          </Alert>
          <Text size='sm' fw={500}>
            Backup: {selectedBackup?.name}
          </Text>
          <Text size='sm' c='dimmed'>
            Created:{' '}
            {selectedBackup &&
              new Date(selectedBackup.createdAt).toLocaleString()}
          </Text>
          <Group justify='flex-end'>
            <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleDeleteBackup}
              loading={deleteBackup.isPending}
              leftSection={<IconTrash size={16} />}
            >
              Delete Backup
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
