'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  Text,
  Badge,
  Group,
  Stack,
  Card,
  Button,
  Modal,
  Pagination,
  Loader,
  Center,
  Alert,
  ActionIcon,
  Tooltip,
  TextInput,
  Grid,
  useMantineTheme,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconUser,
  IconActivity,
  IconCalendar,
  IconEye,
  IconAlertCircle,
  IconSearch,
} from '@tabler/icons-react';
import { useUserActivityLogs } from '../../hooks/useAuditLogs';
import { AuditLog } from '../../types/unified';
import { PAGINATION_CONFIG } from '../../lib/constants';

interface UserActivityLogsProps {
  opened: boolean;
  onClose: () => void;
  userId?: string;
}

export function UserActivityLogs({
  opened,
  onClose,
  userId,
}: UserActivityLogsProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const [page, setPage] = useState(1);
  const [searchUserId, setSearchUserId] = useState(userId || '');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const limit = PAGINATION_CONFIG.COMPLIANCE_PAGE_SIZE;

  const {
    data: activityLogs,
    isLoading,
    error,
  } = useUserActivityLogs(
    searchUserId,
    page,
    limit,
    dateFrom?.toISOString(),
    dateTo?.toISOString()
  );

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSearch = () => {
    if (searchUserId.trim()) {
      setPage(1); // Reset to first page when searching
    }
  };

  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title='User Activity Logs'
        size='xl'
        data-testid="user-activity-logs-modal"
      >
        <Alert icon={<IconAlertCircle size={16} />} color={theme.colors[theme.primaryColor][9]} data-testid="user-activity-logs-error-alert">
          {error.message || 'Failed to load user activity logs'}
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
          <IconUser size={20} />
          <Text>User Activity Logs</Text>
        </Group>
      }
      size='xl'
      data-testid="user-activity-logs-modal"
    >
      <Stack gap='md' data-testid="user-activity-logs-content">
        {/* Search and Filter Controls */}
        <Card withBorder p='md' radius='md' data-testid="user-activity-logs-search-card">
          <Group justify='space-between' mb='md' data-testid="user-activity-logs-search-header">
            <Text size='sm' fw={500} data-testid="user-activity-logs-search-title">
              Search & Filter
            </Text>
            <Button
              variant='outline'
              size='xs'
              onClick={() => {
                setSearchUserId('');
                setDateFrom(null);
                setDateTo(null);
                setPage(1);
              }}
              data-testid="user-activity-logs-clear-button"
            >
              Clear
            </Button>
          </Group>
          <Grid data-testid="user-activity-logs-search-fields">
            <Grid.Col span={6} data-testid="user-activity-logs-user-id-col">
              <TextInput
                label='User ID'
                placeholder='Enter user ID to search'
                value={searchUserId}
                onChange={event => setSearchUserId(event.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                data-testid="user-activity-logs-user-id-input"
              />
            </Grid.Col>
            <Grid.Col span={3} data-testid="user-activity-logs-date-from-col">
              <DateInput
                label='From Date'
                placeholder='Select start date'
                value={dateFrom}
                onChange={setDateFrom}
                clearable
                data-testid="user-activity-logs-date-from-input"
              />
            </Grid.Col>
            <Grid.Col span={3} data-testid="user-activity-logs-date-to-col">
              <DateInput
                label='To Date'
                placeholder='Select end date'
                value={dateTo}
                onChange={setDateTo}
                clearable
                data-testid="user-activity-logs-date-to-input"
              />
            </Grid.Col>
          </Grid>
          <Group justify='flex-end' mt='md' data-testid="user-activity-logs-search-actions">
            <Button onClick={handleSearch} disabled={!searchUserId.trim()} data-testid="user-activity-logs-search-button">
              Search Activity
            </Button>
          </Group>
        </Card>

        <Group justify='space-between' data-testid="user-activity-logs-summary">
          <Text size='sm' c='dimmed' data-testid="user-activity-logs-total-count">
            {activityLogs?.pagination?.total || 0} activity entries found
          </Text>
          {searchUserId && (
            <Text size='sm' c='dimmed' data-testid="user-activity-logs-searched-user-id">
              User ID: {searchUserId}
            </Text>
          )}
        </Group>

        {isLoading ? (
          <Center h={200} data-testid="user-activity-logs-loading">
            <Loader size='md' data-testid="user-activity-logs-loader" />
          </Center>
        ) : !searchUserId ? (
          <Center h={200} data-testid="user-activity-logs-empty-state">
            <Stack align='center' gap='sm' data-testid="user-activity-logs-empty-state-content">
              <IconActivity size={48} color='var(--mantine-color-gray-4)' data-testid="user-activity-logs-empty-state-icon" />
              <Text c='dimmed' data-testid="user-activity-logs-empty-state-message">
                Enter a User ID to search for activity logs
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Card withBorder p='md' radius='md' data-testid="user-activity-logs-table-card">
              <Table striped highlightOnHover data-testid="user-activity-logs-table">
                <Table.Thead data-testid="user-activity-logs-table-head">
                  <Table.Tr data-testid="user-activity-logs-table-header-row">
                    <Table.Th data-testid="user-activity-logs-table-header-action">Action</Table.Th>
                    <Table.Th data-testid="user-activity-logs-table-header-resource">Resource</Table.Th>
                    <Table.Th data-testid="user-activity-logs-table-header-changes">Changes</Table.Th>
                    <Table.Th data-testid="user-activity-logs-table-header-ip">IP Address</Table.Th>
                    <Table.Th data-testid="user-activity-logs-table-header-date">Date</Table.Th>
                    <Table.Th data-testid="user-activity-logs-table-header-actions">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody data-testid="user-activity-logs-table-body">
                  {activityLogs?.items?.map((log: AuditLog) => (
                    <Table.Tr key={log.id} data-testid={`user-activity-logs-table-row-${log.id}`}>
                      <Table.Td data-testid={`user-activity-logs-table-row-action-${log.id}`}>
                        <Badge
                          color={actionColors[log.action] || 'gray'}
                          variant='light'
                          data-testid={`user-activity-logs-action-badge-${log.id}`}
                        >
                          {log.action}
                        </Badge>
                      </Table.Td>
                      <Table.Td data-testid={`user-activity-logs-table-row-resource-${log.id}`}>
                        <Text size='sm' data-testid={`user-activity-logs-resource-${log.id}`}>{log.resource}</Text>
                        {log.resourceId && (
                          <Text size='xs' c='dimmed' data-testid={`user-activity-logs-resource-id-${log.id}`}>
                            ID: {log.resourceId}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td data-testid={`user-activity-logs-table-row-changes-${log.id}`}>
                        <Text size='sm' lineClamp={2} data-testid={`user-activity-logs-changes-${log.id}`}>
                          {log.fieldName && log.oldValue && log.newValue
                            ? `${log.fieldName}: ${log.oldValue} → ${log.newValue}`
                            : log.metadata
                              ? JSON.stringify(log.metadata)
                              : 'No details'}
                        </Text>
                      </Table.Td>
                      <Table.Td data-testid={`user-activity-logs-table-row-ip-${log.id}`}>
                        <Text size='sm' c='dimmed' data-testid={`user-activity-logs-ip-${log.id}`}>
                          {log.ipAddress || 'N/A'}
                        </Text>
                      </Table.Td>
                      <Table.Td data-testid={`user-activity-logs-table-row-date-${log.id}`}>
                        <Group gap='xs' data-testid={`user-activity-logs-date-group-${log.id}`}>
                          <IconCalendar size={14} />
                          <Text size='sm' data-testid={`user-activity-logs-date-${log.id}`}>{formatDate(log.createdAt)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td data-testid={`user-activity-logs-table-row-actions-${log.id}`}>
                        <Tooltip label={t('viewDetails')}>
                          <ActionIcon variant='light' size='sm' data-testid={`user-activity-logs-view-details-${log.id}`}>
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>

            {/* Pagination */}
            {activityLogs?.pagination &&
              activityLogs.pagination.totalPages > 1 && (
                <Group justify='center' data-testid="user-activity-logs-pagination-group">
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={activityLogs.pagination.totalPages}
                    size='sm'
                    data-testid="user-activity-logs-pagination"
                  />
                </Group>
              )}
          </>
        )}
      </Stack>
    </Modal>
  );
}
