'use client';

import { useTranslations } from 'next-intl';
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
  Loader,
} from '@mantine/core';
import {
  IconSearch,
  IconClock,
  IconCheck,
  IconX,
  IconTicket,
} from '@tabler/icons-react';
import { useTickets } from '../../hooks/useTickets';
import { useAuthStore } from '../../stores/useAuthStore';
import { Ticket } from '../../types/unified';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { useCanCreateTicket } from '../../hooks/useCanCreateTicket';

export function EndUserDashboard() {
  const t = useTranslations('dashboard');
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { primary } = useDynamicTheme();
  const { canCreate: canCreateTicket } = useCanCreateTicket();

  const myTickets =
    tickets?.filter((ticket: Ticket) => ticket.requester.id === user?.id) || [];
  const openTickets = myTickets.filter((ticket: Ticket) =>
    ['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)
  );
  const resolvedTickets = myTickets.filter(
    (ticket: Ticket) => ticket.status === 'RESOLVED'
  );
  const closedTickets = myTickets.filter(
    (ticket: Ticket) => ticket.status === 'CLOSED'
  );

  const stats = [
    {
      title: t('totalTickets'),
      value: myTickets.length,
      icon: IconTicket,
      color: 'red',
    },
    {
      title: t('openTickets'),
      value: openTickets.length,
      icon: IconClock,
      color: 'orange',
    },
    {
      title: t('resolvedTickets'),
      value: resolvedTickets.length,
      icon: IconCheck,
      color: primary,
    },
    {
      title: t('closedTickets'),
      value: closedTickets.length,
      icon: IconX,
      color: 'gray',
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
            <Title order={2}>
              {t('welcome')}, {user?.name}!
            </Title>
            <Text c='dimmed'>{t('subtitle')}</Text>
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
        <Grid>
          {stats.map(stat => (
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
            onClick={() => router.push('/tickets')}
            size='lg'
          >
            View All My Tickets
          </Button>
          {canCreateTicket && (
            <Button
              variant='outline'
              leftSection={<IconTicket size={16} />}
              onClick={() => router.push('/tickets/create')}
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
