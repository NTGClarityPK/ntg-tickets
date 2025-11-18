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
  Select,
  ActionIcon,
  Alert,
  Tabs,
  Code,
  Pagination,
  Loader,
  Center,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconEye,
  IconUser,
  IconTicket,
  IconSettings,
  IconCheck,
  IconX,
  IconDatabase,
  IconDownload,
} from '@tabler/icons-react';
import { useAuditLogs } from '../../../hooks/useAuditLogs';
import { notifications } from '@mantine/notifications';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { AuditLog } from '../../../types/unified';

import { DatePickerInput } from '@mantine/dates';
import {
  AUDIT_LOG_ACTIONS,
  AUDIT_LOG_FIELDS,
  PAGINATION_CONFIG,
} from '../../../lib/constants';

interface AuditLogFilters {
  userId?: string;
  ticketId?: string;
  fieldName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  action?: string;
  page?: number;
  limit?: number;
}

// Using centralized constants from lib/constants.ts
const ACTION_OPTIONS = AUDIT_LOG_ACTIONS;
const FIELD_OPTIONS = AUDIT_LOG_FIELDS;

export default function AuditLogsPage() {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: PAGINATION_CONFIG.ADMIN_PAGE_SIZE,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const {
    data: auditLogs,
    isLoading,
    refetch,
  } = useAuditLogs({
    ...filters,
    page: filters.page || 1,
    limit: filters.limit || 20,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  });
  // const exportLogs = useExportAuditLogs();

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    refetch();
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleExport = async () => {
    try {
      // const blob = await exportLogs.mutateAsync(filters);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);

      notifications.show({
        title: 'Success',
        message: 'Audit logs exported successfully',
        color: primaryLight,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to export audit logs',
        color: primaryDark,
      });
    }
  };

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'green',
      UPDATE: 'blue',
      DELETE: 'red',
      LOGIN: 'green',
      LOGOUT: 'gray',
      ASSIGN: 'yellow',
      STATUS_CHANGE: 'purple',
      COMMENT: 'blue',
      ATTACHMENT: 'orange',
    };
    return colors[action] || 'gray';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      CREATE: <IconCheck size={14} />,
      UPDATE: <IconSettings size={14} />,
      DELETE: <IconX size={14} />,
      LOGIN: <IconUser size={14} />,
      LOGOUT: <IconUser size={14} />,
      ASSIGN: <IconUser size={14} />,
      STATUS_CHANGE: <IconTicket size={14} />,
      COMMENT: <IconTicket size={14} />,
      ATTACHMENT: <IconDownload size={14} />,
    };
    return icons[action] || <IconDatabase size={14} />;
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Audit Logs</Title>
          <Text c='dimmed' size='sm'>
            Track and monitor all system activities and changes
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
            leftSection={<IconDownload size={16} />}
            onClick={handleExport}
            loading={false}
          >
            Export
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Card mb='xl'>
        <Stack>
          <Title order={4}>Filter Audit Logs</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label='Search'
                placeholder='Search logs...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                leftSection={<IconSearch size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label='Action'
                placeholder='Select action'
                data={ACTION_OPTIONS}
                value={filters.action}
                onChange={value =>
                  setFilters({ ...filters, action: value || undefined })
                }
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label='Field'
                placeholder='Select field'
                data={FIELD_OPTIONS}
                value={filters.fieldName}
                onChange={value =>
                  setFilters({ ...filters, fieldName: value || undefined })
                }
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Button onClick={handleSearch} fullWidth mt='xl'>
                Apply Filters
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label='From Date'
                placeholder='Select start date'
                value={filters.dateFrom}
                onChange={(date: Date | null) =>
                  setFilters({ ...filters, dateFrom: date || undefined })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label='To Date'
                placeholder='Select end date'
                value={filters.dateTo}
                onChange={(date: Date | null) =>
                  setFilters({ ...filters, dateTo: date || undefined })
                }
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={value => setActiveTab(value || 'all')}>
        <Tabs.List>
          <Tabs.Tab value='all' leftSection={<IconDatabase size={16} />}>
            All Logs
          </Tabs.Tab>
          <Tabs.Tab value='tickets' leftSection={<IconTicket size={16} />}>
            Ticket Changes
          </Tabs.Tab>
          <Tabs.Tab value='users' leftSection={<IconUser size={16} />}>
            User Activities
          </Tabs.Tab>
          <Tabs.Tab value='system' leftSection={<IconSettings size={16} />}>
            System Events
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='all'>
          <Card mt='md'>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>All Audit Logs</Title>
                <Text size='sm' c='dimmed'>
                  {auditLogs?.pagination?.total || 0} total entries
                </Text>
              </Group>

              {isLoading ? (
                <Center py='xl'>
                  <Loader size='lg' />
                </Center>
              ) : (
                <>
                  <ScrollArea>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Timestamp</Table.Th>
                          <Table.Th>User</Table.Th>
                          <Table.Th>Action</Table.Th>
                          <Table.Th>Resource</Table.Th>
                          <Table.Th>Field</Table.Th>
                          <Table.Th>Changes</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {auditLogs?.items?.map((log: AuditLog) => (
                            <Table.Tr key={log.id}>
                              <Table.Td>
                                <Stack gap='xs'>
                                  <Text size='sm' fw={500}>
                                    {new Date(log.createdAt).toLocaleString()}
                                  </Text>
                                  <Text size='xs' c='dimmed'>
                                    {new Date(
                                      log.createdAt
                                    ).toLocaleDateString()}
                                  </Text>
                                </Stack>
                              </Table.Td>
                              <Table.Td>
                                <Stack gap='xs'>
                                  <Text size='sm' fw={500}>
                                    {log.user?.name || 'System'}
                                  </Text>
                                  <Text size='xs' c='dimmed'>
                                    {log.user?.email || 'system@ntg-ticket.com'}
                                  </Text>
                                </Stack>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={getActionColor(log.action)}
                                  variant='light'
                                  leftSection={getActionIcon(log.action)}
                                  size='sm'
                                >
                                  {log.action}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size='sm'>
                                  {log.resource === 'ticket' && log.resourceId
                                    ? `Ticket #${log.resourceId}`
                                    : log.resource || 'N/A'}
                                </Text>
                                {log.resourceId && (
                                  <Text size='xs' c='dimmed'>
                                    {log.resourceId}
                                  </Text>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Text size='sm'>{log.fieldName || 'N/A'}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap='xs'>
                                  {log.oldValue && (
                                    <Badge
                                      color='red'
                                      variant='light'
                                      size='xs'
                                    >
                                      Old
                                    </Badge>
                                  )}
                                  {log.newValue && (
                                    <Badge
                                      color='green'
                                      variant='light'
                                      size='xs'
                                    >
                                      New
                                    </Badge>
                                  )}
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <ActionIcon
                                  variant='light'
                                  size='sm'
                                  onClick={() => handleLogClick(log)}
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              </Table.Td>
                            </Table.Tr>
                          )
                        )}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>

                  {auditLogs?.pagination && (
                    <Group justify='center' mt='md'>
                      <Pagination
                        value={filters.page || 1}
                        onChange={handlePageChange}
                        total={auditLogs.pagination.totalPages}
                        size='sm'
                      />
                    </Group>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='tickets'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Ticket Changes</Title>
              <Alert color='red' title='Ticket Activity'>
                All changes made to tickets including status updates,
                assignments, and content modifications.
              </Alert>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Ticket</Table.Th>
                      <Table.Th>Action</Table.Th>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Changes</Table.Th>
                      <Table.Th>Time</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {auditLogs?.items
                      ?.filter((log: AuditLog) => log.resource === 'ticket')
                      .map((log: AuditLog) => {
                        const ticketInfo = { id: log.id, title: 'N/A' };
                        return (
                          <Table.Tr key={log.id}>
                            <Table.Td>
                              <Stack gap='xs'>
                                <Text fw={500}>{ticketInfo?.title}</Text>
                                <Text size='xs' c='dimmed'>
                                  #{ticketInfo?.id}
                                </Text>
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={getActionColor(log.action)}
                                variant='light'
                                size='sm'
                              >
                                {log.action}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {log.user?.name || 'System'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap='xs'>
                                {log.oldValue !== undefined &&
                                  log.oldValue !== null && (
                                    <Badge
                                      color='red'
                                      variant='light'
                                      size='xs'
                                    >
                                      Old
                                    </Badge>
                                  )}
                                {log.newValue !== undefined &&
                                  log.newValue !== null && (
                                    <Badge
                                      color='green'
                                      variant='light'
                                      size='xs'
                                    >
                                      New
                                    </Badge>
                                  )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {new Date(log.createdAt).toLocaleString()}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='users'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>User Activities</Title>
              <Alert color='green' title='User Activity'>
                Login, logout, profile changes, and other user-related
                activities.
              </Alert>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Action</Table.Th>
                      <Table.Th>Details</Table.Th>
                      <Table.Th>IP Address</Table.Th>
                      <Table.Th>Time</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {auditLogs?.items
                      ?.filter(
                        (log: AuditLog) => ['LOGIN', 'LOGOUT', 'UPDATE'].includes(log.action)
                      )
                      .map((log: AuditLog) => (
                          <Table.Tr key={log.id}>
                            <Table.Td>
                              <Stack gap='xs'>
                                <Text fw={500}>
                                  {log.user?.name || 'Unknown'}
                                </Text>
                                <Text size='xs' c='dimmed'>
                                  {log.user?.email || 'N/A'}
                                </Text>
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={getActionColor(log.action)}
                                variant='light'
                                size='sm'
                              >
                                {log.action}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{log.fieldName || 'N/A'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{log.ipAddress || 'N/A'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {new Date(log.createdAt).toLocaleString()}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        )
                      )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='system'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>System Events</Title>
              <Alert color='orange' title='System Events'>
                System-level events, configuration changes, and administrative
                actions.
              </Alert>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Event</Table.Th>
                      <Table.Th>Severity</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Time</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {auditLogs?.items
                      ?.filter(
                        (log: AuditLog) => log.action === 'SYSTEM'
                      )
                      .map((log: AuditLog) => (
                          <Table.Tr key={log.id}>
                            <Table.Td>
                              <Text fw={500}>{log.action}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color='orange' variant='light' size='sm'>
                                System
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {log.resource || 'System event'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {new Date(log.createdAt).toLocaleString()}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        )
                      )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Detail Modal */}
      <Modal
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title='Audit Log Details'
        size='lg'
        fullScreen
      >
        {selectedLog && (
          <Stack>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text fw={500}>Timestamp</Text>
                <Text>{new Date(selectedLog.createdAt).toLocaleString()}</Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text fw={500}>Action</Text>
                <Badge
                  color={getActionColor(selectedLog.action)}
                  variant='light'
                  leftSection={getActionIcon(selectedLog.action)}
                >
                  {selectedLog.action}
                </Badge>
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text fw={500}>User</Text>
                <Text>{selectedLog.user?.name || 'System'}</Text>
                <Text size='sm' c='dimmed'>
                  {selectedLog.user?.email || 'system@ntg-ticket.com'}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text fw={500}>IP Address</Text>
                <Text>{selectedLog.ipAddress || 'N/A'}</Text>
              </Grid.Col>
            </Grid>

            {selectedLog.resource === 'ticket' && selectedLog.resourceId && (
              <Stack>
                <Text fw={500}>Ticket</Text>
                <Text>Ticket #{selectedLog.resourceId}</Text>
                <Text size='sm' c='dimmed'>
                  Resource ID: {selectedLog.resourceId}
                </Text>
              </Stack>
            )}

            <Stack>
              <Text fw={500}>Field Changes</Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Text size='sm' c='dimmed'>
                    Field
                  </Text>
                  <Text>{selectedLog.fieldName || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Text size='sm' c='dimmed'>
                    Resource Type
                  </Text>
                  <Text>{selectedLog.resource || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Stack>

            {(selectedLog.oldValue || selectedLog.newValue) && (
              <Stack>
                <Text fw={500}>Value Changes</Text>
                <Grid>
                  {selectedLog.oldValue && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size='sm' c='dimmed'>
                        Old Value
                      </Text>
                      <Code block>{String(selectedLog.oldValue)}</Code>
                    </Grid.Col>
                  )}
                  {selectedLog.newValue && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size='sm' c='dimmed'>
                        New Value
                      </Text>
                      <Code block>{String(selectedLog.newValue)}</Code>
                    </Grid.Col>
                  )}
                </Grid>
              </Stack>
            )}

            {selectedLog.metadata && (
              <Stack>
                <Text fw={500}>Additional Metadata</Text>
                <Code block>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </Code>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
