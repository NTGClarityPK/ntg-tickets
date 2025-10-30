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
      >
        <Alert icon={<IconAlertCircle size={16} />} color='red'>
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
    >
      <Stack gap='md'>
        {/* Search and Filter Controls */}
        <Card withBorder p='md' radius='md'>
          <Group justify='space-between' mb='md'>
            <Text size='sm' fw={500}>
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
            >
              Clear
            </Button>
          </Group>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label='User ID'
                placeholder='Enter user ID to search'
                value={searchUserId}
                onChange={event => setSearchUserId(event.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <DateInput
                label='From Date'
                placeholder='Select start date'
                value={dateFrom}
                onChange={setDateFrom}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <DateInput
                label='To Date'
                placeholder='Select end date'
                value={dateTo}
                onChange={setDateTo}
                clearable
              />
            </Grid.Col>
          </Grid>
          <Group justify='flex-end' mt='md'>
            <Button onClick={handleSearch} disabled={!searchUserId.trim()}>
              Search Activity
            </Button>
          </Group>
        </Card>

        <Group justify='space-between'>
          <Text size='sm' c='dimmed'>
            {activityLogs?.pagination?.total || 0} activity entries found
          </Text>
          {searchUserId && (
            <Text size='sm' c='dimmed'>
              User ID: {searchUserId}
            </Text>
          )}
        </Group>

        {isLoading ? (
          <Center h={200}>
            <Loader size='md' />
          </Center>
        ) : !searchUserId ? (
          <Center h={200}>
            <Stack align='center' gap='sm'>
              <IconActivity size={48} color='var(--mantine-color-gray-4)' />
              <Text c='dimmed'>
                Enter a User ID to search for activity logs
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Card withBorder p='md' radius='md'>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>Resource</Table.Th>
                    <Table.Th>Changes</Table.Th>
                    <Table.Th>IP Address</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activityLogs?.data?.data?.map(log => (
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
                        <Text size='sm'>{log.resource}</Text>
                        {log.resourceId && (
                          <Text size='xs' c='dimmed'>
                            ID: {log.resourceId}
                          </Text>
                        )}
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
                        <Text size='sm' c='dimmed'>
                          {log.ipAddress || 'N/A'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap='xs'>
                          <IconCalendar size={14} />
                          <Text size='sm'>{formatDate(log.createdAt)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label={t('viewDetails')}>
                          <ActionIcon variant='light' size='sm'>
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
                <Group justify='center'>
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={activityLogs.pagination.totalPages}
                    size='sm'
                  />
                </Group>
              )}
          </>
        )}
      </Stack>
    </Modal>
  );
}
