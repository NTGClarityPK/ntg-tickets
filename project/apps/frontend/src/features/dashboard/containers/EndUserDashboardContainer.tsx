'use client';

import { useMemo } from 'react';
import { Container, Group, Loader, useMantineTheme } from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconX,
  IconTicket,
} from '@tabler/icons-react';
import { useTickets } from '../../../hooks/useTickets';
import { useAuthUser } from '../../../stores/useAuthStore';
import { Ticket } from '../../../types/unified';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useCanCreateTicket } from '../../../hooks/useCanCreateTicket';
import { useTranslations } from 'next-intl';
import { EndUserDashboardPresenter } from '../presenters/EndUserDashboardPresenter';
import { EndUserDashboardMetrics } from '../types/dashboard.types';

export function EndUserDashboardContainer() {
  const theme = useMantineTheme();
  const t = useTranslations('dashboard');
  const user = useAuthUser();
  const router = useRouter();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { primary } = useDynamicTheme();
  const { canCreate: canCreateTicket } = useCanCreateTicket();

  const metrics = useMemo((): EndUserDashboardMetrics => {
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
        color: theme.colors[theme.primaryColor][9],
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

    return {
      stats,
      canCreateTicket,
    };
  }, [tickets, user?.id, primary, canCreateTicket, t, theme]);

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
    <EndUserDashboardPresenter
      userName={user?.name || 'User'}
      metrics={metrics}
      onViewTickets={() => router.push('/tickets')}
      onCreateTicket={() => router.push('/tickets/create')}
    />
  );
}

