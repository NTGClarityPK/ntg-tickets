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
    <Container size='xl' py='md'>
      <Stack gap='md'>
        {/* Header */}
        <Group justify='space-between'>
          <div>
            <Title order={2}>Welcome, {userName}!</Title>
            <Text c='dimmed'>View and manage your support tickets</Text>
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
        <Grid>
          {metrics.stats.map(stat => (
            <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder>
                <Group>
                  <Avatar color={stat.color} size='lg'>
                    <stat.icon size={24} />
                  </Avatar>
                  <div>
                    <Text size='lg' fw={600}>
                      {stat.value}
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {stat.title}
                    </Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Group justify='center' mt='xl'>
          <Button
            variant='filled'
            leftSection={<IconSearch size={16} />}
            onClick={onViewTickets}
            size='lg'
          >
            View All My Tickets
          </Button>
          {metrics.canCreateTicket && (
            <Button
              variant='outline'
              leftSection={<IconTicket size={16} />}
              onClick={onCreateTicket}
              size='lg'
            >
              Create New Ticket
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}

