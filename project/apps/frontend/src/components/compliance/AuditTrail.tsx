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
  TextInput,
  Select,
  Grid,
  ActionIcon,
  Tooltip,
  Pagination,
  Loader,
  Center,
  useMantineTheme,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconEye,
  IconHistory,
  IconUser,
  IconCalendar,
  IconDownload,
} from '@tabler/icons-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { AuditLog } from '../../types/unified';
import {
  PAGINATION_CONFIG,
  EXTENDED_AUDIT_LOG_ACTIONS,
} from '../../lib/constants';

interface AuditTrailProps {
  opened: boolean;
  onClose: () => void;
  userId?: string;
  ticketId?: string;
}

export function AuditTrail({
  opened,
  onClose,
  userId,
  ticketId,
}: AuditTrailProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const tAdmin = useTranslations('admin');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    userId: userId || '',
    ticketId: ticketId || '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  });

  const {
    data: auditLogs,
    isLoading,
    error,
  } = useAuditLogs({
    page,
    limit: PAGINATION_CONFIG.ADMIN_PAGE_SIZE,
    ...filters,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  });

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

  const handleExport = () => {
    // Implement export functionality
    // eslint-disable-next-line no-console
    console.log('Exporting audit logs...');
  };

  const handleFilterChange = (field: string, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: userId || '',
      ticketId: ticketId || '',
      dateFrom: null,
      dateTo: null,
    });
    setPage(1);
  };

  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={tAdmin('auditTrail')}
        size='xl'
      >
        <Center h={200}>
          <Text c={theme.colors[theme.primaryColor][9]}>{t('error')}</Text>
        </Center>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap='sm'>
          <IconHistory size={20} />
          <Text>{tAdmin('auditTrail')}</Text>
        </Group>
      }
      size='xl'
    >
      <Stack gap='md'>
        {/* Filters */}
        <Card withBorder p='md' radius='md'>
          <Group justify='space-between' mb='md'>
            <Text size='sm' fw={500}>
              {t('filters')}
            </Text>
            <Button variant='outline' size='xs' onClick={clearFilters}>
              {t('clearAll')}
            </Button>
          </Group>
          <Grid>
            <Grid.Col span={3}>
              <Select
                label={t('action')}
                placeholder={t('selectAction')}
                data={EXTENDED_AUDIT_LOG_ACTIONS.map(action => ({
                  value: action.value,
                  label: t(action.label.toLowerCase().replace(' ', '')),
                }))}
                value={filters.action}
                onChange={value => handleFilterChange('action', value)}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                label={t('userId')}
                placeholder={t('enterUserId')}
                value={filters.userId}
                onChange={event =>
                  handleFilterChange('userId', event.currentTarget.value)
                }
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                label={t('ticketId')}
                placeholder={t('enterTicketId')}
                value={filters.ticketId}
                onChange={event =>
                  handleFilterChange('ticketId', event.currentTarget.value)
                }
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <DateInput
                label={t('dateFrom')}
                placeholder={t('selectStartDate')}
                value={filters.dateFrom}
                onChange={value => handleFilterChange('dateFrom', value)}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <DateInput
                label={t('dateTo')}
                placeholder={t('selectEndDate')}
                value={filters.dateTo}
                onChange={value => handleFilterChange('dateTo', value)}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Card>

        {/* Actions */}
        <Group justify='space-between'>
          <Text size='sm' c='dimmed'>
            {tAdmin('auditEntriesFound', {
              count: auditLogs?.pagination?.total || 0,
            })}
          </Text>
          <Button
            variant='outline'
            size='sm'
            leftSection={<IconDownload size={16} />}
            onClick={handleExport}
          >
            {t('export')}
          </Button>
        </Group>

        {/* Audit Logs Table */}
        <Card withBorder p='md' radius='md'>
          {isLoading ? (
            <Center h={200}>
              <Loader size='md' />
            </Center>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('action')}</Table.Th>
                    <Table.Th>{t('user')}</Table.Th>
                    <Table.Th>{t('resource')}</Table.Th>
                    <Table.Th>{t('changes')}</Table.Th>
                    <Table.Th>{t('date')}</Table.Th>
                    <Table.Th>{t('actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                        {auditLogs?.items?.map((log: AuditLog) => (
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
                        <Group gap='xs'>
                          <IconUser size={14} />
                          <Text size='sm'>
                            {log.user?.name || t('unknown')}
                          </Text>
                        </Group>
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

              {/* Pagination */}
              {auditLogs?.pagination && auditLogs.pagination.totalPages > 1 && (
                <Group justify='center' mt='md'>
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={auditLogs.pagination.totalPages}
                    size='sm'
                  />
                </Group>
              )}
            </>
          )}
        </Card>
      </Stack>
    </Modal>
  );
}
