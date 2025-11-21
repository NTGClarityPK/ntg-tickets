'use client';

import { useMemo, useState, useEffect } from 'react';
import { Container, Group, Loader } from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconPlayerPause,
  IconTicket,
} from '@tabler/icons-react';
import {
  useAllTicketsForCounting,
} from '../../../hooks/useTickets';
import { useTicketReport } from '../../../hooks/useReports';
import { Ticket } from '../../../types/unified';
import { useTranslations } from 'next-intl';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useWorkflows } from '../../../hooks/useWorkflows';
import { ManagerDashboardPresenter } from '../presenters/ManagerDashboardPresenter';
import { ManagerDashboardMetrics } from '../types/dashboard.types';

export function ManagerDashboardContainer() {
  const t = useTranslations('dashboard');
  const { primaryLight, primaryDark, primaryLighter, primaryDarker } =
    useDynamicTheme();

  const { data: allTicketsForStats, isLoading: ticketsLoading } =
    useAllTicketsForCounting();
  const { data: reportData } = useTicketReport();
  const { getDashboardStats } = useWorkflows();
  const [dashboardStats, setDashboardStats] = useState<{ all: number; working: number; done: number; hold: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch dashboard stats from backend on mount and when workflow changes
  useEffect(() => {
    setStatsLoading(true);
    
    const fetchStats = async () => {
      try {
        const stats = await getDashboardStats();
        setDashboardStats(stats);
        setStatsLoading(false);
      } catch (err) {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, [getDashboardStats]);

  const metrics = useMemo((): ManagerDashboardMetrics => {
    const allTickets = allTicketsForStats || [];

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
    allTickets.forEach((ticket: Ticket) => {
      const category = ticket.category?.customName || ticket.category?.name || 'Unknown';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const ticketsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    // Calculate tickets by status
    const statusMap = new Map<string, number>();
    allTickets.forEach((ticket: Ticket) => {
      const status = String(ticket.status);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const ticketsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Calculate tickets by impact
    const impactMap = new Map<string, number>();
    allTickets.forEach((ticket: Ticket) => {
      const impact = String(ticket.impact);
      impactMap.set(impact, (impactMap.get(impact) || 0) + 1);
    });
    const ticketsByImpact = Array.from(impactMap.entries()).map(([impact, count]) => ({
      impact,
      count,
    }));

    // Calculate tickets by urgency
    const urgencyMap = new Map<string, number>();
    allTickets.forEach((ticket: Ticket) => {
      const urgency = String(ticket.urgency);
      urgencyMap.set(urgency, (urgencyMap.get(urgency) || 0) + 1);
    });
    const ticketsByUrgency = Array.from(urgencyMap.entries()).map(([urgency, count]) => ({
      urgency,
      count,
    }));

    // Calculate tickets by priority
    const priorityMap = new Map<string, number>();
    allTickets.forEach((ticket: Ticket) => {
      const priority = String(ticket.priority);
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });
    const ticketsByPriority = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count,
    }));

    // Calculate staff performance
    const staffPerformanceMap = new Map<string, {
      staffName: string;
      totalTickets: number;
      workingTickets: number;
      doneTickets: number;
      holdTickets: number;
    }>();

    allTickets.forEach((ticket: Ticket) => {
      if (ticket.assignedTo) {
        const staffName = ticket.assignedTo.name || 'Unassigned';
        if (!staffPerformanceMap.has(staffName)) {
          staffPerformanceMap.set(staffName, {
            staffName,
            totalTickets: 0,
            workingTickets: 0,
            doneTickets: 0,
            holdTickets: 0,
          });
        }
        const perf = staffPerformanceMap.get(staffName);
        if (perf) {
          perf.totalTickets++;
          // For now, use simple status matching (backend handles workflow filtering for main stats)
          // This is a simplified version - ideally staff performance should also come from backend
          const normalizedStatus = ticket.status.toUpperCase().replace(/\s+/g, '_');
          const defaultWorking = ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'];
          const defaultDone = ['CLOSED', 'RESOLVED'];
          if (defaultWorking.includes(normalizedStatus)) {
            perf.workingTickets++;
          } else if (defaultDone.includes(normalizedStatus)) {
            perf.doneTickets++;
          } else {
            perf.holdTickets++;
          }
        }
      }
    });

    const staffPerformance = Array.from(staffPerformanceMap.values());

    return {
      stats: statsCards,
      ticketTrendData: reportData?.ticketTrendData || [],
      ticketsByCategory,
      ticketsByStatus,
      ticketsByImpact,
      ticketsByUrgency,
      ticketsByPriority,
      staffPerformance,
    };
  }, [
    allTicketsForStats,
    reportData,
    primaryLight,
    t,
    dashboardStats,
  ]);

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

