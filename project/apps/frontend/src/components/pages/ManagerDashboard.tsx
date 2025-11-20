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
            <Title order={2}>Manager Overview</Title>
            <Text c='dimmed'>Monitor team performance and ticket metrics</Text>
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

        {/* Charts */}
        <Grid>
          <Grid.Col span={12}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>
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
              />
            </Paper>
          </Grid.Col>
        </Grid>


        {/* Recent Activity */}
        <Grid>
          <Grid.Col span={12}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>
                Recent Activity
              </Title>
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {allTicketsForStats?.slice(0, 5).map((ticket: Ticket) => (
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
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
