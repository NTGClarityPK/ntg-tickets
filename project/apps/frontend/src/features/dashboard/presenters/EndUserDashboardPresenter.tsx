'use client';

import {
  Container,
  Grid,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Avatar,
} from '@mantine/core';
import { IconSearch, IconTicket } from '@tabler/icons-react';
import { EndUserDashboardMetrics } from '../types/dashboard.types';

interface EndUserDashboardPresenterProps {
  userName: string;
  metrics: EndUserDashboardMetrics;
  onViewTickets: () => void;
  onCreateTicket: () => void;
}

export function EndUserDashboardPresenter({
  userName,
  metrics,
  onViewTickets,
  onCreateTicket,
}: EndUserDashboardPresenterProps) {
  return (
    <Container size='xl' py='md' data-testid="end-user-dashboard-container">
      <Stack gap='md' data-testid="end-user-dashboard-stack">
        {/* Header */}
        <Group justify='space-between' data-testid="end-user-dashboard-header">
          <div data-testid="end-user-dashboard-header-text">
            <Title order={2} data-testid="end-user-dashboard-title">Welcome, {userName}!</Title>
            <Text c='dimmed' data-testid="end-user-dashboard-subtitle">View and manage your support tickets</Text>
          </div>
          <Group data-testid="end-user-dashboard-actions">
            <Button
              className="pdf-hide-elements"
              variant='outline'
              leftSection={<IconSearch size={16} />}
              onClick={onViewTickets}
              data-testid="end-user-dashboard-search-button"
            >
              Search Tickets
            </Button>
          </Group>
        </Group>

        {/* Stats Cards */}
        <Grid data-testid="end-user-dashboard-stats-grid">
          {metrics.stats.map(stat => (
            <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }} data-testid={`end-user-dashboard-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card withBorder data-testid={`end-user-dashboard-stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <Group data-testid={`end-user-dashboard-stat-group-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Avatar color={stat.color} size='lg' data-testid={`end-user-dashboard-stat-avatar-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <stat.icon size={24} />
                  </Avatar>
                  <div data-testid={`end-user-dashboard-stat-content-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Text size='lg' fw={600} data-testid={`end-user-dashboard-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </Text>
                    <Text size='sm' c='dimmed' data-testid={`end-user-dashboard-stat-title-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.title}
                    </Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Group justify='center' mt='xl' data-testid="end-user-dashboard-quick-actions">
          <Button
            variant='filled'
            leftSection={<IconSearch size={16} />}
            onClick={onViewTickets}
            size='lg'
            data-testid="end-user-dashboard-view-tickets-button"
          >
            View All My Tickets
          </Button>
          {metrics.canCreateTicket && (
            <Button
              variant='outline'
              leftSection={<IconTicket size={16} />}
              onClick={onCreateTicket}
              size='lg'
              data-testid="end-user-dashboard-create-ticket-button"
            >
              Create New Ticket
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}

