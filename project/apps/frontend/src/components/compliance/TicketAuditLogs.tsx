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
  Modal,
  Pagination,
  Loader,
  Center,
  Alert,
  ActionIcon,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import {
  IconHistory,
  IconUser,
  IconCalendar,
  IconEye,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useTicketAuditLogs } from '../../hooks/useAuditLogs';
import { PAGINATION_CONFIG } from '../../lib/constants';
import { AuditLog } from '../../types/unified';

interface TicketAuditLogsProps {
  opened: boolean;
  onClose: () => void;
  ticketId: string;
}

export function TicketAuditLogs({
  opened,
  onClose,
  ticketId,
}: TicketAuditLogsProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const [page, setPage] = useState(1);
  const limit = PAGINATION_CONFIG.COMPLIANCE_PAGE_SIZE;

  const {
    data: auditLogs,
    isLoading,
    error,
  } = useTicketAuditLogs(ticketId, page, limit);

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

  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title='Ticket Audit Logs'
        size='xl'
        data-testid="ticket-audit-logs-modal"
      >
        <Alert icon={<IconAlertCircle size={16} />} color={theme.colors[theme.primaryColor][9]} data-testid="ticket-audit-logs-error-alert">
          {error.message || 'Failed to load ticket audit logs'}
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
          <IconHistory size={20} />
          <Text>Ticket Audit Logs</Text>
        </Group>
      }
      size='xl'
      data-testid="ticket-audit-logs-modal"
    >
      <Stack gap='md' data-testid="ticket-audit-logs-content">
        <Group justify='space-between' data-testid="ticket-audit-logs-summary">
          <Text size='sm' c='dimmed' data-testid="ticket-audit-logs-total-count">
            {auditLogs?.pagination?.total || 0} audit entries for this ticket
          </Text>
          <Text size='sm' c='dimmed' data-testid="ticket-audit-logs-ticket-id">
            Ticket ID: {ticketId}
          </Text>
        </Group>

        {isLoading ? (
          <Center h={200} data-testid="ticket-audit-logs-loading">
            <Loader size='md' data-testid="ticket-audit-logs-loader" />
          </Center>
        ) : (
          <>
            <Card withBorder p='md' radius='md' data-testid="ticket-audit-logs-table-card">
              <Table striped highlightOnHover data-testid="ticket-audit-logs-table">
                <Table.Thead data-testid="ticket-audit-logs-table-head">
                  <Table.Tr data-testid="ticket-audit-logs-table-header-row">
                    <Table.Th data-testid="ticket-audit-logs-table-header-action">Action</Table.Th>
                    <Table.Th data-testid="ticket-audit-logs-table-header-user">User</Table.Th>
                    <Table.Th data-testid="ticket-audit-logs-table-header-changes">Changes</Table.Th>
                    <Table.Th data-testid="ticket-audit-logs-table-header-date">Date</Table.Th>
                    <Table.Th data-testid="ticket-audit-logs-table-header-actions">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody data-testid="ticket-audit-logs-table-body">
                  {auditLogs?.items?.map((log: AuditLog) => (
                    <Table.Tr key={log.id} data-testid={`ticket-audit-logs-table-row-${log.id}`}>
                      <Table.Td data-testid={`ticket-audit-logs-table-row-action-${log.id}`}>
                        <Badge
                          color={actionColors[log.action] || 'gray'}
                          variant='light'
                          data-testid={`ticket-audit-logs-action-badge-${log.id}`}
                        >
                          {log.action}
                        </Badge>
                      </Table.Td>
                      <Table.Td data-testid={`ticket-audit-logs-table-row-user-${log.id}`}>
                        <Group gap='xs' data-testid={`ticket-audit-logs-user-group-${log.id}`}>
                          <IconUser size={14} />
                          <Text size='sm' data-testid={`ticket-audit-logs-user-${log.id}`}>
                            {log.user?.name || t('unknown')}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td data-testid={`ticket-audit-logs-table-row-changes-${log.id}`}>
                        <Text size='sm' lineClamp={2} data-testid={`ticket-audit-logs-changes-${log.id}`}>
                          {log.fieldName && log.oldValue && log.newValue
                            ? `${log.fieldName}: ${log.oldValue} → ${log.newValue}`
                            : log.metadata
                              ? JSON.stringify(log.metadata)
                              : 'No details'}
                        </Text>
                      </Table.Td>
                      <Table.Td data-testid={`ticket-audit-logs-table-row-date-${log.id}`}>
                        <Group gap='xs' data-testid={`ticket-audit-logs-date-group-${log.id}`}>
                          <IconCalendar size={14} />
                          <Text size='sm' data-testid={`ticket-audit-logs-date-${log.id}`}>{formatDate(log.createdAt)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td data-testid={`ticket-audit-logs-table-row-actions-${log.id}`}>
                        <Tooltip label={t('viewDetails')}>
                          <ActionIcon variant='light' size='sm' data-testid={`ticket-audit-logs-view-details-${log.id}`}>
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
            {auditLogs?.pagination && auditLogs.pagination.totalPages > 1 && (
              <Group justify='center' data-testid="ticket-audit-logs-pagination-group">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={auditLogs.pagination.totalPages}
                  size='sm'
                  data-testid="ticket-audit-logs-pagination"
                />
              </Group>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
}
