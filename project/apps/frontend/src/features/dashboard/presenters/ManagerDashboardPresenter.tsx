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
  Progress,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { IconTicket } from '@tabler/icons-react';
import { ManagerDashboardMetrics } from '../types/dashboard.types';

interface ManagerDashboardPresenterProps {
  metrics: ManagerDashboardMetrics;
  themeColors: {
    primaryLight: string;
    primaryDark: string;
    primaryLighter: string;
    primaryDarker: string;
  };
}

export function ManagerDashboardPresenter({
  metrics,
  themeColors,
}: ManagerDashboardPresenterProps) {
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
          {metrics.stats.map(stat => (
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

        {/* Performance Metrics */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 12 }}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>
                SLA Performance
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <div>
                    <Text size='sm' c='dimmed' mb={4}>
                      Response Time (Last 30 days)
                    </Text>
                    <Progress
                      value={metrics.slaMetrics?.responseTime || 0}
                      size='lg'
                      style={{ '--progress-color': themeColors.primaryLight }}
                    />
                    <Text size='sm' mt={4}>
                      {metrics.slaMetrics?.responseTime !== undefined
                        ? `${metrics.slaMetrics.responseTime}%`
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
                      value={metrics.slaMetrics?.resolutionTime || 0}
                      size='lg'
                      style={{ '--progress-color': themeColors.primaryDark }}
                    />
                    <Text size='sm' mt={4}>
                      {metrics.slaMetrics?.resolutionTime !== undefined
                        ? `${metrics.slaMetrics.resolutionTime}%`
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
                      value={metrics.slaMetrics?.customerSatisfaction || 92}
                      size='lg'
                      style={{ '--progress-color': themeColors.primaryLighter }}
                    />
                    <Text size='sm' mt={4}>
                      {(
                        (metrics.slaMetrics?.customerSatisfaction || 92) / 20
                      ).toFixed(1)}
                      /5.0 average
                    </Text>
                  </div>
                </Grid.Col>
              </Grid>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Charts */}
        <Grid>
          <Grid.Col span={12}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>
                Ticket Trends
              </Title>
              <AreaChart
                h={300}
                data={metrics.ticketTrendData}
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
                {metrics.recentTickets.map(ticket => (
                  <Timeline.Item
                    key={ticket.id}
                    bullet={<IconTicket size={12} />}
                    title={ticket.title}
                  >
                    <Text c='dimmed' size='sm'>
                      {ticket.status} •{' '}
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </Text>
                    <Badge
                      size='sm'
                      mt={4}
                      style={{
                        backgroundColor: themeColors.primaryDarker,
                        color: 'white',
                      }}
                    >
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

