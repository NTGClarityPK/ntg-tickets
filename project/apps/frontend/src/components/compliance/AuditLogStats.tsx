'use client';

import { useState } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Progress,
  Button,
  Modal,
  Table,
  Pagination,
  Loader,
  Center,
  Alert,
  Tabs,
  Paper,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconChartBar,
  IconUsers,
  IconActivity,
  IconTrendingUp,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useAuditLogStats, useSystemAuditLogs } from '../../hooks/useAuditLogs';

interface AuditLogStatsProps {
  opened: boolean;
  onClose: () => void;
}

export function AuditLogStats({ opened, onClose }: AuditLogStatsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [systemLogsPage, setSystemLogsPage] = useState(1);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useAuditLogStats(dateFrom?.toISOString(), dateTo?.toISOString());

  const {
    data: systemLogs,
    isLoading: systemLogsLoading,
    error: systemLogsError,
  } = useSystemAuditLogs(
    systemLogsPage,
    10,
    dateFrom?.toISOString(),
    dateTo?.toISOString()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const actionColors: Record<string, string> = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN: 'cyan',
    LOGOUT: 'gray',
    ASSIGN: 'orange',
    ESCALATE: 'purple',
    COMMENT: 'teal',
    ATTACH: 'indigo',
    STATUS_CHANGE: 'yellow',
    PRIORITY_CHANGE: 'pink',
    CATEGORY_CHANGE: 'violet',
  };

  if (statsError || systemLogsError) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title='Audit Log Statistics'
        size='xl'
      >
        <Alert icon={<IconAlertCircle size={16} />} color='red'>
          {statsError?.message ||
            systemLogsError?.message ||
            'Failed to load audit log data'}
        </Alert>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap='sm'>
          <IconChartBar size={20} />
          <Text>Audit Log Statistics</Text>
        </Group>
      }
      size='xl'
    >
      <Stack gap='md'>
        {/* Date Range Filter */}
        <Card withBorder p='md' radius='md'>
          <Group justify='space-between' mb='md'>
            <Text size='sm' fw={500}>
              Date Range Filter
            </Text>
            <Button
              variant='outline'
              size='xs'
              onClick={() => {
                setDateFrom(null);
                setDateTo(null);
              }}
            >
              Clear
            </Button>
          </Group>
          <Grid>
            <Grid.Col span={6}>
              <DateInput
                label='From Date'
                placeholder='Select start date'
                value={dateFrom}
                onChange={setDateFrom}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                label='To Date'
                placeholder='Select end date'
                value={dateTo}
                onChange={setDateTo}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Card>

        <Tabs
          value={activeTab}
          onChange={value => setActiveTab(value || 'overview')}
        >
          <Tabs.List>
            <Tabs.Tab value='overview' leftSection={<IconChartBar size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value='actions' leftSection={<IconActivity size={16} />}>
              Actions
            </Tabs.Tab>
            <Tabs.Tab value='users' leftSection={<IconUsers size={16} />}>
              Users
            </Tabs.Tab>
            <Tabs.Tab value='system' leftSection={<IconTrendingUp size={16} />}>
              System Logs
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value='overview' pt='md'>
            {statsLoading ? (
              <Center h={200}>
                <Loader size='md' />
              </Center>
            ) : (
              <Grid>
                <Grid.Col span={12}>
                  <Card withBorder p='md' radius='md'>
                    <Text size='lg' fw={500} mb='md'>
                      Total Activity
                    </Text>
                    <Group justify='space-between'>
                      <div>
                        <Text size='xl' fw={700} c='blue'>
                          {stats?.data?.totalLogs || 0}
                        </Text>
                        <Text size='sm' c='dimmed'>
                          Total Audit Entries
                        </Text>
                      </div>
                      <IconActivity
                        size={48}
                        color='var(--mantine-color-red-6)'
                      />
                    </Group>
                  </Card>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Card withBorder p='md' radius='md'>
                    <Text size='md' fw={500} mb='md'>
                      Top Actions
                    </Text>
                    <Stack gap='sm'>
                      {Object.entries(stats?.data?.logsByAction || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([action, count]) => (
                          <Group key={action} justify='space-between'>
                            <Text size='sm'>{action}</Text>
                            <Badge color={actionColors[action] || 'gray'}>
                              {count}
                            </Badge>
                          </Group>
                        ))}
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Card withBorder p='md' radius='md'>
                    <Text size='md' fw={500} mb='md'>
                      Top Resources
                    </Text>
                    <Stack gap='sm'>
                      {Object.entries(stats?.data?.logsByResource || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([resource, count]) => (
                          <Group key={resource} justify='space-between'>
                            <Text size='sm'>{resource}</Text>
                            <Badge color='red'>{count}</Badge>
                          </Group>
                        ))}
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value='actions' pt='md'>
            {statsLoading ? (
              <Center h={200}>
                <Loader size='md' />
              </Center>
            ) : (
              <Grid>
                {Object.entries(stats?.data?.logsByAction || {}).map(
                  ([action, count]) => {
                    const total = stats?.data?.totalLogs || 1;
                    const percentage = (count / total) * 100;

                    return (
                      <Grid.Col key={action} span={6}>
                        <Card withBorder p='md' radius='md'>
                          <Group justify='space-between' mb='sm'>
                            <Text size='sm' fw={500}>
                              {action}
                            </Text>
                            <Badge color={actionColors[action] || 'gray'}>
                              {count}
                            </Badge>
                          </Group>
                          <Progress
                            value={percentage}
                            color={actionColors[action] || 'gray'}
                            size='sm'
                          />
                          <Text size='xs' c='dimmed' mt='xs'>
                            {percentage.toFixed(1)}% of total
                          </Text>
                        </Card>
                      </Grid.Col>
                    );
                  }
                )}
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value='users' pt='md'>
            {statsLoading ? (
              <Center h={200}>
                <Loader size='md' />
              </Center>
            ) : (
              <Card withBorder p='md' radius='md'>
                <Text size='md' fw={500} mb='md'>
                  Most Active Users
                </Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Activity Count</Table.Th>
                      <Table.Th>Percentage</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats?.data?.logsByUser?.map(user => {
                      const total = stats?.data?.totalLogs || 1;
                      const percentage = (user.count / total) * 100;

                      return (
                        <Table.Tr key={user.userId}>
                          <Table.Td>
                            <Text size='sm' fw={500}>
                              {user.userName}
                            </Text>
                            <Text size='xs' c='dimmed'>
                              {user.userId}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color='red'>{user.count}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size='sm'>{percentage.toFixed(1)}%</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Tabs.Panel>

          <Tabs.Panel value='system' pt='md'>
            <Stack gap='md'>
              <Group justify='space-between'>
                <Text size='md' fw={500}>
                  System Audit Logs
                </Text>
                <Text size='sm' c='dimmed'>
                  {systemLogs?.pagination?.total || 0} entries
                </Text>
              </Group>

              {systemLogsLoading ? (
                <Center h={200}>
                  <Loader size='md' />
                </Center>
              ) : (
                <>
                  <Paper withBorder p='md' radius='md'>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Action</Table.Th>
                          <Table.Th>User</Table.Th>
                          <Table.Th>Resource</Table.Th>
                          <Table.Th>Details</Table.Th>
                          <Table.Th>Date</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {systemLogs?.data?.data?.map(log => (
                          <Table.Tr key={log.id}>
                            <Table.Td>
                              <Badge
                                color={actionColors[log.action] || 'gray'}
                                variant='light'
                              >
                                {log.action}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {log.user?.name || 'Unknown'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{log.resource}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm' lineClamp={2}>
                                {log.fieldName && log.oldValue && log.newValue
                                  ? `${log.fieldName}: ${log.oldValue} → ${log.newValue}`
                                  : log.metadata
                                    ? JSON.stringify(log.metadata)
                                    : 'No details'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{formatDate(log.createdAt)}</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>

                  {systemLogs?.pagination &&
                    systemLogs.pagination.totalPages > 1 && (
                      <Group justify='center'>
                        <Pagination
                          value={systemLogsPage}
                          onChange={setSystemLogsPage}
                          total={systemLogs.pagination.totalPages}
                          size='sm'
                        />
                      </Group>
                    )}
                </>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  );
}
