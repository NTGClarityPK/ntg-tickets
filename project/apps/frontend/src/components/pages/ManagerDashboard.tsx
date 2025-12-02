'use client';

import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Card,
  Avatar,
  Timeline,
  Loader,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import {
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconTicket,
} from '@tabler/icons-react';
import {
  useTotalTicketsCount,
  useAllTicketsForCounting,
} from '../../hooks/useTickets';
import { useTicketReport } from '../../hooks/useReports';
import { Ticket } from '../../types/unified';
import { useTranslations } from 'next-intl';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

export function ManagerDashboard() {
  const t = useTranslations('dashboard');
  const { primaryLight, primaryDarker } = useDynamicTheme();

  const { data: totalTicketsCount } = useTotalTicketsCount();
  const { data: allTicketsForStats, isLoading: ticketsLoading } =
    useAllTicketsForCounting();
  const { data: reportData } = useTicketReport();
  const openTickets =
    allTicketsForStats?.filter((ticket: Ticket) =>
      ['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)
    ) || [];
  const resolvedTickets =
    allTicketsForStats?.filter(
      (ticket: Ticket) => ticket.status === 'RESOLVED'
    ) || [];

  const overdueTickets =
    allTicketsForStats?.filter((ticket: Ticket) => {
      if (!ticket.dueDate) return false;
      return (
        new Date(ticket.dueDate) < new Date() &&
        !['RESOLVED', 'CLOSED'].includes(ticket.status)
      );
    }) || [];

  const stats = [
    {
      title: 'Total',
      value: totalTicketsCount || 0,
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
      title: t('resolvedTickets'),
      value: resolvedTickets.length,
      icon: IconCheck,
      color: primaryLight,
    },
    {
      title: t('overdueTickets'),
      value: overdueTickets.length,
      icon: IconAlertCircle,
      color: primaryLight,
    },
  ];

  // Real data for charts
  const ticketTrendData = reportData?.ticketTrendData || [];


  if (ticketsLoading) {
    return (
      <Container size='xl' py='md' data-testid="manager-dashboard-loading">
        <Group justify='center' py='xl' data-testid="manager-dashboard-loading-group">
          <Loader size='lg' data-testid="manager-dashboard-loader" />
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="manager-dashboard">
      <Stack gap='md' data-testid="manager-dashboard-content">
        {/* Header */}
        <Group justify='space-between' data-testid="manager-dashboard-header">
          <div data-testid="manager-dashboard-header-content">
            <Title order={2} data-testid="manager-dashboard-title">Manager Overview</Title>
            <Text c='dimmed' data-testid="manager-dashboard-subtitle">Monitor team performance and ticket metrics</Text>
          </div>
         
        </Group>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
          data-testid="manager-dashboard-stats"
        >
          {stats.map(stat => (
            <Card key={stat.title} withBorder style={{ height: '100%' }} p='md' data-testid={`manager-dashboard-stat-${stat.title.toLowerCase()}`}>
              <Group style={{ height: '100%' }}>
                <Avatar color={stat.color} size='lg' data-testid={`manager-dashboard-stat-icon-${stat.title.toLowerCase()}`}>
                  <stat.icon size={24} />
                </Avatar>
                <div style={{ flex: 1 }} data-testid={`manager-dashboard-stat-content-${stat.title.toLowerCase()}`}>
                  <Text size='lg' fw={600} data-testid={`manager-dashboard-stat-value-${stat.title.toLowerCase()}`}>
                    {stat.value}
                  </Text>
                  <Text size='sm' c='dimmed' data-testid={`manager-dashboard-stat-label-${stat.title.toLowerCase()}`}>
                    {stat.title}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <Grid data-testid="manager-dashboard-charts">
          <Grid.Col span={12} data-testid="manager-dashboard-chart-col">
            <Paper withBorder p='md' data-testid="manager-dashboard-ticket-trends">
              <Title order={3} mb='md' data-testid="manager-dashboard-ticket-trends-title">
                Ticket Trends
              </Title>
              <AreaChart
                h={300}
                data={ticketTrendData}
                dataKey='month'
                series={[
                  { name: 'tickets', color: 'dynamic.6' },
                  { name: 'resolved', color: 'dynamic.4' },
                ]}
                curveType='linear'
                unit=' tickets'
                data-testid="manager-dashboard-ticket-trends-chart"
              />
            </Paper>
          </Grid.Col>
        </Grid>


        {/* Recent Activity */}
        <Grid data-testid="manager-dashboard-recent-activity">
          <Grid.Col span={12} data-testid="manager-dashboard-recent-activity-col">
            <Paper withBorder p='md' data-testid="manager-dashboard-recent-activity-paper">
              <Title order={3} mb='md' data-testid="manager-dashboard-recent-activity-title">
                Recent Activity
              </Title>
              <Timeline active={-1} bulletSize={24} lineWidth={2} data-testid="manager-dashboard-timeline">
                {allTicketsForStats?.slice(0, 5).map((ticket: Ticket) => (
                  <Timeline.Item
                    key={ticket.id}
                    bullet={<IconTicket size={12} />}
                    title={ticket.title}
                    data-testid={`manager-dashboard-timeline-item-${ticket.id}`}
                  >
                    <Text c='dimmed' size='sm' data-testid={`manager-dashboard-timeline-item-status-${ticket.id}`}>
                      {ticket.status} •{' '}
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </Text>
                    <Badge size='sm' mt={4} style={{ backgroundColor: primaryDarker, color: 'white' }} data-testid={`manager-dashboard-timeline-item-badge-${ticket.id}`}>
                      {ticket.ticketNumber}
                    </Badge>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
