'use client';

import { useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Card,
  Avatar,
  Progress,
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
import { useTicketReport } from '../../hooks/useReports';
import { useAuthStore } from '../../stores/useAuthStore';
import { Ticket } from '../../types/unified';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

export function SupportStaffDashboard() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { primaryLight, primaryDark, primaryLighter, primaryDarker } = useDynamicTheme();

  const { user } = useAuthStore();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: reportData } = useTicketReport({ userId: user?.id });

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
  const slaBreachedTickets = assignedTickets.filter((ticket: Ticket) => {
    if (!ticket.dueDate || !ticket.closedAt) return false;
    return new Date(ticket.closedAt) > new Date(ticket.dueDate);
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
    {
      title: 'SLA Breached',
      value: slaBreachedTickets.length,
      icon: IconAlertCircle,
      color: primaryLight,
    },
  ];


  if (ticketsLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Stack gap='md'>
        {/* Header */}
        <Group justify='space-between'>
          <div>
            <Title order={2}>Support Staff Overview</Title>
            <Text c='dimmed'>
              Manage your assigned tickets and track performance
            </Text>
          </div>
          <Group>
            <Button
              className="pdf-hide-elements"
              variant='outline'
              leftSection={<IconSearch size={16} />}
              onClick={() => router.push('/tickets')}
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
        >
          {stats.map(stat => (
            <Card key={stat.title} withBorder style={{ height: '100%' }} p='md'>
              <Group style={{ height: '100%' }}>
                <Avatar color={stat.color} size='lg'>
                  <stat.icon size={24} />
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text size='lg' fw={600}>
                    {stat.value}
                  </Text>
                  <Text size='sm' c='dimmed'>
                    {stat.title}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </div>

        {/* SLA Compliance */}
        <Paper withBorder p='md'>
          <Title order={3} mb='md'>
            SLA Compliance
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div>
                <Text size='sm' c='dimmed' mb={4}>
                  Response Time (Last 30 days)
                </Text>
                <Progress
                  value={reportData?.slaMetrics?.responseTime || 0}
                  size='lg'
                      style={{ '--progress-color': primaryLight }}
                />
                <Text size='sm' mt={4}>
                  {reportData?.slaMetrics?.responseTime !== undefined
                    ? `${reportData.slaMetrics.responseTime}%`
                    : 'Loading...'}{' '}
                  within SLA
                </Text>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div>
                <Text size='sm' c='dimmed' mb={4}>
                  Resolution Time (Last 30 days)
                </Text>
                <Progress
                  value={reportData?.slaMetrics?.resolutionTime || 0}
                  size='lg'
                      style={{ '--progress-color': primaryDark }}
                />
                <Text size='sm' mt={4}>
                  {reportData?.slaMetrics?.resolutionTime !== undefined
                    ? `${reportData.slaMetrics.resolutionTime}%`
                    : 'Loading...'}{' '}
                  within SLA
                </Text>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div>
                <Text size='sm' c='dimmed' mb={4}>
                  Customer Satisfaction
                </Text>
                <Progress
                  value={reportData?.slaMetrics?.customerSatisfaction || 92}
                  size='lg'
                      style={{ '--progress-color': primaryLighter }}
                />
                <Text size='sm' mt={4}>
                  {(
                    (reportData?.slaMetrics?.customerSatisfaction || 92) / 20
                  ).toFixed(1)}
                  /5.0 average
                </Text>
              </div>
            </Grid.Col>
          </Grid>
        </Paper>


        {/* Recent Activity */}
        <Paper withBorder p='md'>
          <Title order={3} mb='md'>
            {t('recentActivity')}
          </Title>
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {assignedTickets.slice(0, 5).map((ticket: Ticket) => (
              <Timeline.Item
                key={ticket.id}
                bullet={<IconTicket size={12} />}
                title={ticket.title}
              >
                <Text c='dimmed' size='sm'>
                  {ticket.status} •{' '}
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </Text>
                <Badge size='sm' mt={4} style={{ backgroundColor: primaryDarker, color: 'white' }}>
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
