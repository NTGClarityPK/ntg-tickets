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
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useCanCreateTicket } from '../../../hooks/useCanCreateTicket';
import { useTranslations } from 'next-intl';
import { useWorkflows } from '../../../hooks/useWorkflows';
import { EndUserDashboardPresenter } from '../presenters/EndUserDashboardPresenter';
import { EndUserDashboardMetrics } from '../types/dashboard.types';

export function EndUserDashboardContainer() {
  const t = useTranslations('dashboard');
  const user = useAuthUser();
  const router = useRouter();
  const { isLoading: ticketsLoading } = useTickets();
  const { primaryLight } = useDynamicTheme();
  const { canCreate: canCreateTicket } = useCanCreateTicket();
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

  const metrics = useMemo((): EndUserDashboardMetrics => {
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

    return {
      stats: statsCards,
      canCreateTicket,
    };
  }, [dashboardStats, primaryLight, canCreateTicket, t]);

  if (ticketsLoading || statsLoading) {
    return (
      <Container size='xl' py='md' data-testid="end-user-dashboard-container-loading">
        <Group justify='center' py='xl' data-testid="end-user-dashboard-loading-group">
          <Loader size='lg' data-testid="end-user-dashboard-loader" />
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

