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
  useMantineTheme,
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
import { AuditLog } from '../../types/unified';

interface AuditLogStatsProps {
  opened: boolean;
  onClose: () => void;
}

export function AuditLogStats({ opened, onClose }: AuditLogStatsProps) {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [systemLogsPage, setSystemLogsPage] = useState(1);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useAuditLogStats(dateFrom?.toISOString(), dateTo?.toISOString());
  
  // Normalize stats - useAuditLogStats returns normalized response
  const statsData = stats || {};

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
    CREATE: theme.primaryColor,
    UPDATE: theme.primaryColor,
    DELETE: theme.colors[theme.primaryColor][9],
    LOGIN: 'cyan',
    LOGOUT: 'gray',
    ASSIGN: 'orange',
    ESCALATE: 'purple',
    COMMENT: 'teal',
    ATTACH: 'indigo',
    STATUS_CHANGE: theme.colors[theme.primaryColor][4],
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
        data-testid="audit-log-stats-modal"
      >
        <Alert icon={<IconAlertCircle size={16} />} color={theme.colors[theme.primaryColor][9]} data-testid="audit-log-stats-error-alert">
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
      data-testid="audit-log-stats-modal"
    >
      <Stack gap='md' data-testid="audit-log-stats-content">
        {/* Date Range Filter */}
        <Card withBorder p='md' radius='md' data-testid="audit-log-stats-date-filter-card">
          <Group justify='space-between' mb='md' data-testid="audit-log-stats-date-filter-header">
            <Text size='sm' fw={500} data-testid="audit-log-stats-date-filter-title">
              Date Range Filter
            </Text>
            <Button
              variant='outline'
              size='xs'
              onClick={() => {
                setDateFrom(null);
                setDateTo(null);
              }}
              data-testid="audit-log-stats-clear-date-filter-button"
            >
              Clear
            </Button>
          </Group>
          <Grid data-testid="audit-log-stats-date-filter-grid">
            <Grid.Col span={6} data-testid="audit-log-stats-date-from-col">
              <DateInput
                label='From Date'
                placeholder='Select start date'
                value={dateFrom}
                onChange={setDateFrom}
                clearable
                data-testid="audit-log-stats-date-from-input"
              />
            </Grid.Col>
            <Grid.Col span={6} data-testid="audit-log-stats-date-to-col">
              <DateInput
                label='To Date'
                placeholder='Select end date'
                value={dateTo}
                onChange={setDateTo}
                clearable
                data-testid="audit-log-stats-date-to-input"
              />
            </Grid.Col>
          </Grid>
        </Card>

        <Tabs
          value={activeTab}
          onChange={value => setActiveTab(value || 'overview')}
          data-testid="audit-log-stats-tabs"
        >
          <Tabs.List data-testid="audit-log-stats-tabs-list">
            <Tabs.Tab value='overview' leftSection={<IconChartBar size={16} />} data-testid="audit-log-stats-tab-overview">
              Overview
            </Tabs.Tab>
            <Tabs.Tab value='actions' leftSection={<IconActivity size={16} />} data-testid="audit-log-stats-tab-actions">
              Actions
            </Tabs.Tab>
            <Tabs.Tab value='users' leftSection={<IconUsers size={16} />} data-testid="audit-log-stats-tab-users">
              Users
            </Tabs.Tab>
            <Tabs.Tab value='system' leftSection={<IconTrendingUp size={16} />} data-testid="audit-log-stats-tab-system">
              System Logs
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value='overview' pt='md' data-testid="audit-log-stats-panel-overview">
            {statsLoading ? (
              <Center h={200} data-testid="audit-log-stats-overview-loading">
                <Loader size='md' data-testid="audit-log-stats-overview-loader" />
              </Center>
            ) : (
              <Grid data-testid="audit-log-stats-overview-grid">
                <Grid.Col span={12} data-testid="audit-log-stats-total-activity-col">
                  <Card withBorder p='md' radius='md' data-testid="audit-log-stats-total-activity-card">
                    <Text size='lg' fw={500} mb='md' data-testid="audit-log-stats-total-activity-title">
                      Total Activity
                    </Text>
                    <Group justify='space-between' data-testid="audit-log-stats-total-activity-content">
                      <div data-testid="audit-log-stats-total-activity-stats">
                        <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][6]} data-testid="audit-log-stats-total-activity-value">
                          {(statsData as { totalLogs?: number })?.totalLogs || 0}
                        </Text>
                        <Text size='sm' c='dimmed' data-testid="audit-log-stats-total-activity-label">
                          Total Audit Entries
                        </Text>
                      </div>
                      <IconActivity
                        size={48}
                        color='var(--mantine-color-red-6)'
                        data-testid="audit-log-stats-total-activity-icon"
                      />
                    </Group>
                  </Card>
                </Grid.Col>

                <Grid.Col span={6} data-testid="audit-log-stats-top-actions-col">
                  <Card withBorder p='md' radius='md' data-testid="audit-log-stats-top-actions-card">
                    <Text size='md' fw={500} mb='md' data-testid="audit-log-stats-top-actions-title">
                      Top Actions
                    </Text>
                    <Stack gap='sm' data-testid="audit-log-stats-top-actions-list">
                      {Object.entries((statsData as { logsByAction?: Record<string, number> })?.logsByAction || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([action, count]) => (
                          <Group key={action} justify='space-between' data-testid={`audit-log-stats-top-action-${action}`}>
                            <Text size='sm' data-testid={`audit-log-stats-top-action-label-${action}`}>{action}</Text>
                            <Badge color={actionColors[action] || 'gray'} data-testid={`audit-log-stats-top-action-badge-${action}`}>
                              {count}
                            </Badge>
                          </Group>
                        ))}
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={6} data-testid="audit-log-stats-top-resources-col">
                  <Card withBorder p='md' radius='md' data-testid="audit-log-stats-top-resources-card">
                    <Text size='md' fw={500} mb='md' data-testid="audit-log-stats-top-resources-title">
                      Top Resources
                    </Text>
                    <Stack gap='sm' data-testid="audit-log-stats-top-resources-list">
                      {Object.entries((statsData as { logsByResource?: Record<string, number> })?.logsByResource || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([resource, count]) => (
                          <Group key={resource} justify='space-between' data-testid={`audit-log-stats-top-resource-${resource}`}>
                            <Text size='sm' data-testid={`audit-log-stats-top-resource-label-${resource}`}>{resource}</Text>
                            <Badge color={theme.colors[theme.primaryColor][9]} data-testid={`audit-log-stats-top-resource-badge-${resource}`}>{count}</Badge>
                          </Group>
                        ))}
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value='actions' pt='md' data-testid="audit-log-stats-panel-actions">
            {statsLoading ? (
              <Center h={200} data-testid="audit-log-stats-actions-loading">
                <Loader size='md' data-testid="audit-log-stats-actions-loader" />
              </Center>
            ) : (
              <Grid data-testid="audit-log-stats-actions-grid">
                {Object.entries((statsData as { logsByAction?: Record<string, number> })?.logsByAction || {}).map(
                  ([action, count]) => {
                    const total = (statsData as { totalLogs?: number })?.totalLogs || 1;
                    const percentage = (count / total) * 100;

                    return (
                      <Grid.Col key={action} span={6} data-testid={`audit-log-stats-action-col-${action}`}>
                        <Card withBorder p='md' radius='md' data-testid={`audit-log-stats-action-card-${action}`}>
                          <Group justify='space-between' mb='sm' data-testid={`audit-log-stats-action-header-${action}`}>
                            <Text size='sm' fw={500} data-testid={`audit-log-stats-action-label-${action}`}>
                              {action}
                            </Text>
                            <Badge color={actionColors[action] || 'gray'} data-testid={`audit-log-stats-action-badge-${action}`}>
                              {count}
                            </Badge>
                          </Group>
                          <Progress
                            value={percentage}
                            color={actionColors[action] || 'gray'}
                            size='sm'
                            data-testid={`audit-log-stats-action-progress-${action}`}
                          />
                          <Text size='xs' c='dimmed' mt='xs' data-testid={`audit-log-stats-action-percentage-${action}`}>
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

          <Tabs.Panel value='users' pt='md' data-testid="audit-log-stats-panel-users">
            {statsLoading ? (
              <Center h={200} data-testid="audit-log-stats-users-loading">
                <Loader size='md' data-testid="audit-log-stats-users-loader" />
              </Center>
            ) : (
              <Card withBorder p='md' radius='md' data-testid="audit-log-stats-users-card">
                <Text size='md' fw={500} mb='md' data-testid="audit-log-stats-users-title">
                  Most Active Users
                </Text>
                <Table data-testid="audit-log-stats-users-table">
                  <Table.Thead data-testid="audit-log-stats-users-table-head">
                    <Table.Tr data-testid="audit-log-stats-users-table-header-row">
                      <Table.Th data-testid="audit-log-stats-users-table-header-user">User</Table.Th>
                      <Table.Th data-testid="audit-log-stats-users-table-header-count">Activity Count</Table.Th>
                      <Table.Th data-testid="audit-log-stats-users-table-header-percentage">Percentage</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody data-testid="audit-log-stats-users-table-body">
                    {((statsData as { logsByUser?: Array<{ userId: string; userName: string; count: number }> })?.logsByUser || []).map(user => {
                      const total = (statsData as { totalLogs?: number })?.totalLogs || 1;
                      const percentage = (user.count / total) * 100;

                      return (
                        <Table.Tr key={user.userId} data-testid={`audit-log-stats-user-row-${user.userId}`}>
                          <Table.Td data-testid={`audit-log-stats-user-cell-${user.userId}`}>
                            <Text size='sm' fw={500} data-testid={`audit-log-stats-user-name-${user.userId}`}>
                              {user.userName}
                            </Text>
                            <Text size='xs' c='dimmed' data-testid={`audit-log-stats-user-id-${user.userId}`}>
                              {user.userId}
                            </Text>
                          </Table.Td>
                          <Table.Td data-testid={`audit-log-stats-user-count-cell-${user.userId}`}>
                            <Badge color={theme.colors[theme.primaryColor][9]} data-testid={`audit-log-stats-user-count-badge-${user.userId}`}>{user.count}</Badge>
                          </Table.Td>
                          <Table.Td data-testid={`audit-log-stats-user-percentage-cell-${user.userId}`}>
                            <Text size='sm' data-testid={`audit-log-stats-user-percentage-${user.userId}`}>{percentage.toFixed(1)}%</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Tabs.Panel>

          <Tabs.Panel value='system' pt='md' data-testid="audit-log-stats-panel-system">
            <Stack gap='md' data-testid="audit-log-stats-system-content">
              <Group justify='space-between' data-testid="audit-log-stats-system-header">
                <Text size='md' fw={500} data-testid="audit-log-stats-system-title">
                  System Audit Logs
                </Text>
                <Text size='sm' c='dimmed' data-testid="audit-log-stats-system-total">
                  {systemLogs?.pagination?.total || 0} entries
                </Text>
              </Group>

              {systemLogsLoading ? (
                <Center h={200} data-testid="audit-log-stats-system-loading">
                  <Loader size='md' data-testid="audit-log-stats-system-loader" />
                </Center>
              ) : (
                <>
                  <Paper withBorder p='md' radius='md' data-testid="audit-log-stats-system-table-card">
                    <Table striped highlightOnHover data-testid="audit-log-stats-system-table">
                      <Table.Thead data-testid="audit-log-stats-system-table-head">
                        <Table.Tr data-testid="audit-log-stats-system-table-header-row">
                          <Table.Th data-testid="audit-log-stats-system-table-header-action">Action</Table.Th>
                          <Table.Th data-testid="audit-log-stats-system-table-header-user">User</Table.Th>
                          <Table.Th data-testid="audit-log-stats-system-table-header-resource">Resource</Table.Th>
                          <Table.Th data-testid="audit-log-stats-system-table-header-details">Details</Table.Th>
                          <Table.Th data-testid="audit-log-stats-system-table-header-date">Date</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody data-testid="audit-log-stats-system-table-body">
                        {systemLogs?.items?.map((log: AuditLog) => (
                          <Table.Tr key={log.id} data-testid={`audit-log-stats-system-row-${log.id}`}>
                            <Table.Td data-testid={`audit-log-stats-system-row-action-${log.id}`}>
                              <Badge
                                color={actionColors[log.action] || 'gray'}
                                variant='light'
                                data-testid={`audit-log-stats-system-action-badge-${log.id}`}
                              >
                                {log.action}
                              </Badge>
                            </Table.Td>
                            <Table.Td data-testid={`audit-log-stats-system-row-user-${log.id}`}>
                              <Text size='sm' data-testid={`audit-log-stats-system-user-${log.id}`}>
                                {log.user?.name || 'Unknown'}
                              </Text>
                            </Table.Td>
                            <Table.Td data-testid={`audit-log-stats-system-row-resource-${log.id}`}>
                              <Text size='sm' data-testid={`audit-log-stats-system-resource-${log.id}`}>{log.resource}</Text>
                            </Table.Td>
                            <Table.Td data-testid={`audit-log-stats-system-row-details-${log.id}`}>
                              <Text size='sm' lineClamp={2} data-testid={`audit-log-stats-system-details-${log.id}`}>
                                {log.fieldName && log.oldValue && log.newValue
                                  ? `${log.fieldName}: ${log.oldValue} → ${log.newValue}`
                                  : log.metadata
                                    ? JSON.stringify(log.metadata)
                                    : 'No details'}
                              </Text>
                            </Table.Td>
                            <Table.Td data-testid={`audit-log-stats-system-row-date-${log.id}`}>
                              <Text size='sm' data-testid={`audit-log-stats-system-date-${log.id}`}>{formatDate(log.createdAt)}</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>

                  {systemLogs?.pagination &&
                    systemLogs.pagination.totalPages > 1 && (
                      <Group justify='center' data-testid="audit-log-stats-system-pagination-group">
                        <Pagination
                          value={systemLogsPage}
                          onChange={setSystemLogsPage}
                          total={systemLogs.pagination.totalPages}
                          size='sm'
                          data-testid="audit-log-stats-system-pagination"
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
