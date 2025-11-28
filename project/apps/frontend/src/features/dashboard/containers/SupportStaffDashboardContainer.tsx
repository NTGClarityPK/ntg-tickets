'use client';

import { useMemo, useState, useEffect } from 'react';
import { Container, Group, Loader } from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconPlayerPause,
  IconTicket,
} from '@tabler/icons-react';
import { useTickets } from '../../../hooks/useTickets';
import { useAuthUser } from '../../../stores/useAuthStore';
import { Ticket } from '../../../types/unified';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useWorkflows } from '../../../hooks/useWorkflows';
import { SupportStaffDashboardPresenter } from '../presenters/SupportStaffDashboardPresenter';
import { SupportStaffDashboardMetrics } from '../types/dashboard.types';

export function SupportStaffDashboardContainer() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { primaryLight, primaryDark, primaryLighter, primaryDarker } =
    useDynamicTheme();

  const user = useAuthUser();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { getDashboardStats } = useWorkflows();
  const [dashboardStats, setDashboardStats] = useState<{ all: number; working: number; done: number; hold: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch dashboard stats from backend on mount
  useEffect(() => {
    setStatsLoading(true);
    getDashboardStats()
      .then((stats) => {
        setDashboardStats(stats);
        setStatsLoading(false);
      })
      .catch(() => {
        setStatsLoading(false);
      });
  }, [getDashboardStats]);

  const metrics = useMemo((): SupportStaffDashboardMetrics => {
    const assignedTickets =
      tickets?.filter((ticket: Ticket) => ticket.assignedTo?.id === user?.id) ||
      [];

    // Use backend stats for cards (calculated on backend with proper workflow filtering)
    const stats = dashboardStats || { all: 0, working: 0, done: 0, hold: 0 };

    // Use backend stats for cards
    const statsCards = [
      {
        title: t('allTickets') || 'All',
        value: stats.all,
        icon: IconTicket,
        color: primaryLight,
      },
      {
        title: t('workingTickets') || 'Working',
        value: stats.working,
        icon: IconClock,
        color: primaryLight,
      },
      {
        title: t('doneTickets') || 'Done',
        value: stats.done,
        icon: IconCheck,
        color: primaryLight,
      },
      {
        title: t('holdTickets') || 'Hold',
        value: stats.hold,
        icon: IconPlayerPause,
        color: primaryLight,
      },
    ];

    // Calculate tickets by category
    const categoryMap = new Map<string, number>();
    assignedTickets.forEach((ticket: Ticket) => {
      const category = ticket.category?.customName || ticket.category?.name || 'Unknown';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const ticketsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    // Calculate tickets by status
    const statusMap = new Map<string, number>();
    assignedTickets.forEach((ticket: Ticket) => {
      const status = String(ticket.status);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const ticketsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Calculate tickets by impact
    const impactMap = new Map<string, number>();
    assignedTickets.forEach((ticket: Ticket) => {
      const impact = String(ticket.impact);
      impactMap.set(impact, (impactMap.get(impact) || 0) + 1);
    });
    const ticketsByImpact = Array.from(impactMap.entries()).map(([impact, count]) => ({
      impact,
      count,
    }));

    // Calculate tickets by priority
    const priorityMap = new Map<string, number>();
    assignedTickets.forEach((ticket: Ticket) => {
      const priority = String(ticket.priority);
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });
    const ticketsByPriority = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count,
    }));

    return {
      stats: statsCards,
      ticketsByCategory,
      ticketsByStatus,
      ticketsByImpact,
      ticketsByPriority,
    };
  }, [tickets, user?.id, primaryLight, dashboardStats, t]);

  if (ticketsLoading || statsLoading) {
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
    />
  );
}

