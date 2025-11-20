'use client';

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
  Timeline,
} from '@mantine/core';
import { IconSearch, IconTicket } from '@tabler/icons-react';
import { SupportStaffDashboardMetrics } from '../types/dashboard.types';

interface SupportStaffDashboardPresenterProps {
  metrics: SupportStaffDashboardMetrics;
  themeColors: {
    primaryLight: string;
    primaryDark: string;
    primaryLighter: string;
    primaryDarker: string;
  };
  onViewTickets: () => void;
  recentActivityLabel: string;
}

export function SupportStaffDashboardPresenter({
  metrics,
  themeColors,
  onViewTickets,
  recentActivityLabel,
}: SupportStaffDashboardPresenterProps) {
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
              onClick={onViewTickets}
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

        {/* Recent Activity */}
        <Paper withBorder p='md'>
          <Title order={3} mb='md'>
            {recentActivityLabel}
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
      </Stack>
    </Container>
  );
}

