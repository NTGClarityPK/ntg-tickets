'use client';

import { useMemo } from 'react';
import { Container, Group, Loader } from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconTicket,
} from '@tabler/icons-react';
import {
  useTotalTicketsCount,
  useAllTicketsForCounting,
} from '../../../hooks/useTickets';
import { useTicketReport } from '../../../hooks/useReports';
import { Ticket } from '../../../types/unified';
import { useTranslations } from 'next-intl';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { ManagerDashboardPresenter } from '../presenters/ManagerDashboardPresenter';
import { ManagerDashboardMetrics } from '../types/dashboard.types';

export function ManagerDashboardContainer() {
  const t = useTranslations('dashboard');
  const { primaryLight, primaryDark, primaryLighter, primaryDarker } =
    useDynamicTheme();

  const { data: totalTicketsCount } = useTotalTicketsCount();
  const { data: allTicketsForStats, isLoading: ticketsLoading } =
    useAllTicketsForCounting();
  const { data: reportData } = useTicketReport();

  const metrics = useMemo((): ManagerDashboardMetrics => {
    const openTickets =
      allTicketsForStats?.filter((ticket: Ticket) =>
        ['NEW', 'OPEN', 'IN_PROGRESS'].includes(ticket.status)
      ) || [];
    const resolvedTickets =
      allTicketsForStats?.filter(
        (ticket: Ticket) => ticket.status === 'RESOLVED'
      ) || [];

    const overdueTickets = (allTicketsForStats || []).filter((ticket: Ticket) => {
      if (!ticket.dueDate || ['RESOLVED', 'CLOSED'].includes(ticket.status)) {
        return false;
      }
      return new Date(ticket.dueDate) < new Date();
    });

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

    const recentTickets = (allTicketsForStats?.slice(0, 5) || []).map(
      (ticket: Ticket) => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
        ticketNumber: ticket.ticketNumber,
      })
    );

    return {
      stats,
      ticketTrendData: reportData?.ticketTrendData || [],
      recentTickets,
    };
  }, [
    allTicketsForStats,
    totalTicketsCount,
    reportData,
    primaryLight,
    t,
  ]);

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
    <ManagerDashboardPresenter
      metrics={metrics}
      themeColors={{
        primaryLight,
        primaryDark,
        primaryLighter,
        primaryDarker,
      }}
    />
  );
}

