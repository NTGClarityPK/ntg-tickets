'use client';

import { useState, useMemo } from 'react';
import { Container, Group, Loader, Text } from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconUserPlus,
  IconUserX,
  IconShield,
  IconKey,
  IconHistory,
  IconActivity,
  IconCheck,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useUsers } from '../../../hooks/useUsers';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useSystemStats } from '../../../hooks/useSystemMonitoring';
import { useAuditLogStats, useSystemAuditLogs } from '../../../hooks/useAuditLogs';
import { AdminDashboardPresenter } from '../presenters/AdminDashboardPresenter';
import { AdminMetrics } from '../types/admin.types';
import { UserRole } from '../../../types/unified';

export function AdminDashboardContainer() {
  const [refreshing, setRefreshing] = useState(false);
  const { primaryLight } = useDynamicTheme();

  // Fetch user data
  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useUsers({
    limit: 1000, // Get all users for admin overview
  });

  // Fetch system stats
  const {
    data: systemStats,
    isLoading: systemStatsLoading,
    refetch: refetchSystemStats,
  } = useSystemStats();

  // Calculate date range for audit logs (last 7 days)
  const now = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), [now]);
  const dateFrom = useMemo(() => sevenDaysAgo.toISOString().split('T')[0], [sevenDaysAgo]);

  const {
    data: auditLogStats,
    isLoading: auditStatsLoading,
    refetch: refetchAuditStats,
  } = useAuditLogStats(dateFrom || '');

  // Fetch recent audit logs to calculate failed logins and password resets
  const {
    data: recentAuditLogs,
    isLoading: auditLogsLoading,
  } = useSystemAuditLogs(1, 1000, dateFrom || '');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchSystemStats(),
        refetchAuditStats(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate metrics
  const metrics = useMemo((): AdminMetrics => {
    // Calculate user metrics
    const totalUsers = (systemStats?.totalUsers ?? users?.length) || 0;
    const activeUsers = (systemStats?.activeUsers ?? users?.filter(user => user.isActive).length) || 0;
    const inactiveUsers = users?.filter(user => !user.isActive).length || 0;

    // Calculate role-based user counts
    const supportManagerCount = users?.filter(u =>
      u.roles?.includes(UserRole.SUPPORT_MANAGER)
    ).length || 0;
    const supportStaffCount = users?.filter(u =>
      u.roles?.includes(UserRole.SUPPORT_STAFF)
    ).length || 0;
    const endUserCount = users?.filter(u =>
      u.roles?.includes(UserRole.END_USER)
    ).length || 0;
    const adminCount = users?.filter(u =>
      u.roles?.includes(UserRole.ADMIN)
    ).length || 0;

    // Calculate security metrics from audit logs
    const auditLogItems = recentAuditLogs?.items || [];
    const failedLogins = auditLogItems.filter(
      log => log.action === 'LOGIN' && log.metadata && 
      (log.metadata as { success?: boolean })?.success === false
    ).length;
    
    const passwordResets = auditLogItems.filter(
      log => log.action === 'UPDATE' && log.resource === 'user' && 
      log.fieldName === 'password'
    ).length;

    const userStats = [
      {
        title: 'TotalUsers',
        value: totalUsers,
        icon: IconUsers,
        color: primaryLight,
      },
      {
        title: 'Active Users',
        value: activeUsers,
        icon: IconCheck,
        color: primaryLight,
      },
      {
        title: 'Inactive users',
        value: inactiveUsers,
        icon: IconX,
        color: primaryLight,
      },
      {
        title: 'Support Manager',
        value: supportManagerCount,
        icon: IconShield,
        color: primaryLight,
      },
      {
        title: 'Support Staff',
        value: supportStaffCount,
        icon: IconUsers,
        color: primaryLight,
      },
      {
        title: 'End user',
        value: endUserCount,
        icon: IconUsers,
        color: primaryLight,
      },
      {
        title: 'Admin',
        value: adminCount,
        icon: IconShield,
        color: primaryLight,
      },
      {
        title: 'Failed Login',
        value: failedLogins,
        icon: IconAlertCircle,
        color: primaryLight,
      },
      {
        title: 'Pwd reset',
        value: passwordResets,
        icon: IconKey,
        color: primaryLight,
      },
    ];

    const securityStats: typeof userStats = [];

    return {
      userStats,
      securityStats,
      failedLogins,
      isLoading: false,
    };
  }, [users, systemStats, auditLogStats, recentAuditLogs, sevenDaysAgo, now, primaryLight]);

  const isLoading = usersLoading || systemStatsLoading || auditStatsLoading || auditLogsLoading;

  if (isLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
          <Text>Loading administrative data...</Text>
        </Group>
      </Container>
    );
  }

  return (
    <AdminDashboardPresenter
      metrics={metrics}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  );
}

