'use client';

import { useMemo } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Card,
  Avatar,
  Loader,
  Timeline,
} from '@mantine/core';
import {
  IconSearch,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconTicket,
} from '@tabler/icons-react';
import { useTickets } from '../../hooks/useTickets';
import { useAuthStore } from '../../stores/useAuthStore';
import { Ticket } from '../../types/unified';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

export function SupportStaffDashboard() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { primaryLight, primaryDarker } = useDynamicTheme();

  const { user } = useAuthStore();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const assignedTickets = useMemo(
    () =>
      tickets?.filter((ticket: Ticket) => ticket.assignedTo?.id === user?.id) ||
      [],
    [tickets, user?.id]
  );

  const openTickets = assignedTickets.filter((ticket: Ticket) =>
    ['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)
  );
  const resolvedTickets = assignedTickets.filter(
    (ticket: Ticket) => ticket.status === 'RESOLVED'
  );
  const overdueTickets = assignedTickets.filter((ticket: Ticket) => {
    if (!ticket.dueDate) return false;
    return (
      new Date(ticket.dueDate) < new Date() &&
      !['RESOLVED', 'CLOSED'].includes(ticket.status)
    );
  });

  const stats = [
    {
      title: 'Total',
      value: assignedTickets.length,
      icon: IconTicket,
      color: primaryLight,
    },
    {
      title: 'Open',
      value: openTickets.length,
      icon: IconClock,
      color: primaryLight,
    },
    {
      title: 'Resolved',
      value: resolvedTickets.length,
      icon: IconCheck,
      color: primaryLight,
    },
    {
      title: 'Overdue',
      value: overdueTickets.length,
      icon: IconAlertCircle,
      color: primaryLight,
    },
  ];


  if (ticketsLoading) {
    return (
      <Container size='xl' py='md' data-testid="support-staff-dashboard-loading">
        <Group justify='center' py='xl' data-testid="support-staff-dashboard-loading-group">
          <Loader size='lg' data-testid="support-staff-dashboard-loader" />
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="support-staff-dashboard">
      <Stack gap='md' data-testid="support-staff-dashboard-content">
        {/* Header */}
        <Group justify='space-between' data-testid="support-staff-dashboard-header">
          <div data-testid="support-staff-dashboard-header-content">
            <Title order={2} data-testid="support-staff-dashboard-title">Support Staff Overview</Title>
            <Text c='dimmed' data-testid="support-staff-dashboard-subtitle">
              Manage your assigned tickets and track performance
            </Text>
          </div>
          <Group data-testid="support-staff-dashboard-actions">
            <Button
              className="pdf-hide-elements"
              variant='outline'
              leftSection={<IconSearch size={16} />}
              onClick={() => router.push('/tickets')}
              data-testid="support-staff-dashboard-search-button"
            >
              Search Tickets
            </Button>
          </Group>
        </Group>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
          data-testid="support-staff-dashboard-stats"
        >
          {stats.map(stat => (
            <Card key={stat.title} withBorder style={{ height: '100%' }} p='md' data-testid={`support-staff-dashboard-stat-${stat.title.toLowerCase()}`}>
              <Group style={{ height: '100%' }}>
                <Avatar color={stat.color} size='lg' data-testid={`support-staff-dashboard-stat-icon-${stat.title.toLowerCase()}`}>
                  <stat.icon size={24} />
                </Avatar>
                <div style={{ flex: 1 }} data-testid={`support-staff-dashboard-stat-content-${stat.title.toLowerCase()}`}>
                  <Text size='lg' fw={600} data-testid={`support-staff-dashboard-stat-value-${stat.title.toLowerCase()}`}>
                    {stat.value}
                  </Text>
                  <Text size='sm' c='dimmed' data-testid={`support-staff-dashboard-stat-label-${stat.title.toLowerCase()}`}>
                    {stat.title}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </div>


        {/* Recent Activity */}
        <Paper withBorder p='md' data-testid="support-staff-dashboard-recent-activity">
          <Title order={3} mb='md' data-testid="support-staff-dashboard-recent-activity-title">
            {t('recentActivity')}
          </Title>
          <Timeline active={-1} bulletSize={24} lineWidth={2} data-testid="support-staff-dashboard-timeline">
            {assignedTickets.slice(0, 5).map((ticket: Ticket) => (
              <Timeline.Item
                key={ticket.id}
                bullet={<IconTicket size={12} />}
                title={ticket.title}
                data-testid={`support-staff-dashboard-timeline-item-${ticket.id}`}
              >
                <Text c='dimmed' size='sm' data-testid={`support-staff-dashboard-timeline-item-status-${ticket.id}`}>
                  {ticket.status} •{' '}
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </Text>
                <Badge size='sm' mt={4} style={{ backgroundColor: primaryDarker, color: 'white' }} data-testid={`support-staff-dashboard-timeline-item-badge-${ticket.id}`}>
                  {ticket.ticketNumber}
                </Badge>
              </Timeline.Item>
            ))}
          </Timeline>
        </Paper>
      </Stack>
    </Container>
  );
}
