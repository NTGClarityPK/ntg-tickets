'use client';

import { useMemo } from 'react';
import { Container, Group, Loader } from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconTicket,
} from '@tabler/icons-react';
import { useTickets } from '../../../hooks/useTickets';
import { useAuthUser } from '../../../stores/useAuthStore';
import { Ticket } from '../../../types/unified';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { SupportStaffDashboardPresenter } from '../presenters/SupportStaffDashboardPresenter';
import { SupportStaffDashboardMetrics } from '../types/dashboard.types';

export function SupportStaffDashboardContainer() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { primaryLight, primaryDark, primaryLighter, primaryDarker } =
    useDynamicTheme();

  const user = useAuthUser();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const metrics = useMemo((): SupportStaffDashboardMetrics => {
    const assignedTickets =
      tickets?.filter((ticket: Ticket) => ticket.assignedTo?.id === user?.id) ||
      [];

    const openTickets = assignedTickets.filter((ticket: Ticket) =>
      ['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)
    );
    const resolvedTickets = assignedTickets.filter(
      (ticket: Ticket) => ticket.status === 'RESOLVED'
    );
    const overdueTickets = assignedTickets.filter((ticket: Ticket) => {
      if (!ticket.dueDate || ['RESOLVED', 'CLOSED'].includes(ticket.status)) {
        return false;
      }
      return new Date(ticket.dueDate) < new Date();
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

    const recentTickets = assignedTickets.slice(0, 5).map((ticket: Ticket) => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
      ticketNumber: ticket.ticketNumber,
    }));

    return {
      stats,
      recentTickets,
    };
  }, [tickets, user?.id, primaryLight]);

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
    <SupportStaffDashboardPresenter
      metrics={metrics}
      themeColors={{
        primaryLight,
        primaryDark,
        primaryLighter,
        primaryDarker,
      }}
      onViewTickets={() => router.push('/tickets')}
      recentActivityLabel={t('recentActivity')}
    />
  );
}

