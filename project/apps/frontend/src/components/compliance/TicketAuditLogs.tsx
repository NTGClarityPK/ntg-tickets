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
    CREATE: 'green',
    UPDATE: theme.primaryColor,
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

  if (error) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title='Ticket Audit Logs'
        size='xl'
      >
        <Alert icon={<IconAlertCircle size={16} />} color='red'>
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
    >
      <Stack gap='md'>
        <Group justify='space-between'>
          <Text size='sm' c='dimmed'>
            {auditLogs?.pagination?.total || 0} audit entries for this ticket
          </Text>
          <Text size='sm' c='dimmed'>
            Ticket ID: {ticketId}
          </Text>
        </Group>

        {isLoading ? (
          <Center h={200}>
            <Loader size='md' />
          </Center>
        ) : (
          <>
            <Card withBorder p='md' radius='md'>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Changes</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
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
            </Card>

            {/* Pagination */}
            {auditLogs?.pagination && auditLogs.pagination.totalPages > 1 && (
              <Group justify='center'>
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
      </Stack>
    </Modal>
  );
}
