'use client';

import { useState } from 'react';
import {
  Container,
  Grid,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Avatar,
  Loader,
  Alert,
  ActionIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconUserPlus,
  IconUserX,
  IconShield,
  IconAlertTriangle,
  IconKey,
  IconHistory,
  IconActivity,
  IconRefresh,
} from '@tabler/icons-react';
import { useUsers } from '../../hooks/useUsers';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { useSystemStats } from '../../hooks/useSystemMonitoring';
import { useAuditLogStats, useSystemAuditLogs } from '../../hooks/useAuditLogs';

export function AdminDashboard() {
  const theme = useMantineTheme();
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
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateFrom = sevenDaysAgo.toISOString().split('T')[0];

  const {
    data: auditLogStats,
    isLoading: auditStatsLoading,
    refetch: refetchAuditStats,
  } = useAuditLogStats(dateFrom);

  // Fetch recent audit logs to calculate failed logins and password resets
  const {
    data: recentAuditLogs,
    isLoading: auditLogsLoading,
  } = useSystemAuditLogs(1, 1000, dateFrom);

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

  // Calculate user metrics

  const totalUsers = (systemStats?.totalUsers ?? users?.length) || 0;
  const activeUsers = (systemStats?.activeUsers ?? users?.filter(user => user.isActive).length) || 0;
  const newUsers =
    users?.filter(
      user => user.createdAt && new Date(user.createdAt) > sevenDaysAgo
    ).length || 0;
  const inactiveUsers = users?.filter(user => !user.isActive).length || 0;

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

  const auditEntries = (auditLogStats as { totalLogs?: number })?.totalLogs || auditLogItems.length || 0;
  
  // Estimate active sessions from recent LOGIN actions (last 24 hours)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const activeSessions = auditLogItems.filter(
    log => log.action === 'LOGIN' && 
    log.createdAt && new Date(log.createdAt) > oneDayAgo &&
    log.metadata && (log.metadata as { success?: boolean })?.success === true
  ).length;

  const userStats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: IconUsers,
      color: primaryLight,
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: IconUserCheck,
      color: primaryLight,
    },
    {
      title: 'New Users',
      value: newUsers,
      icon: IconUserPlus,
      color: primaryLight,
    },
    {
      title: 'Inactive Users',
      value: inactiveUsers,
      icon: IconUserX,
      color: primaryLight,
    },
  ];

  const securityStats = [
    {
      title: 'Failed Logins',
      value: failedLogins,
      icon: IconShield,
      color: primaryLight,
    },
    {
      title: 'Password Resets',
      value: passwordResets,
      icon: IconKey,
      color: primaryLight,
    },
    {
      title: 'Audit Entries',
      value: auditEntries,
      icon: IconHistory,
      color: primaryLight,
    },
    {
      title: 'Active Sessions',
      value: activeSessions,
      icon: IconActivity,
      color: primaryLight,
    },
  ];

  const isLoading = usersLoading || systemStatsLoading || auditStatsLoading || auditLogsLoading;

  if (isLoading) {
    return (
      <Container size='xl' py='md' data-testid="admin-dashboard-loading">
        <Group justify='center' py='xl' data-testid="admin-dashboard-loading-group">
          <Loader size='lg' data-testid="admin-dashboard-loader" />
          <Text data-testid="admin-dashboard-loading-text">Loading administrative data...</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="admin-dashboard">
      <Stack gap='md' data-testid="admin-dashboard-content">
        {/* Header */}
        <Group justify='space-between' data-testid="admin-dashboard-header">
          <div data-testid="admin-dashboard-header-content">
            <Title order={2} data-testid="admin-dashboard-title">Administrative Overview</Title>
            <Text c='dimmed' data-testid="admin-dashboard-subtitle">
              System administration and user management metrics
            </Text>
          </div>
          <ActionIcon
            className="pdf-hide-elements"
            variant='outline'
            size='lg'
            onClick={handleRefresh}
            disabled={refreshing}
            title='Refresh Data'
            data-testid="admin-dashboard-refresh-button"
          >
            {refreshing ? <Loader size={16} /> : <IconRefresh size={20} />}
          </ActionIcon>
        </Group>

        {/* User Management Stats */}
        <div data-testid="admin-dashboard-user-management">
          <Title order={3} mb='md' data-testid="admin-dashboard-user-management-title">
            User Management
          </Title>
          <Grid data-testid="admin-dashboard-user-management-stats">
            {userStats.map(stat => (
              <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }} data-testid={`admin-dashboard-user-stat-col-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <Card withBorder data-testid={`admin-dashboard-user-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Group>
                    <Avatar color={stat.color} size='lg' data-testid={`admin-dashboard-user-stat-icon-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <stat.icon size={24} />
                    </Avatar>
                    <div style={{ flex: 1 }} data-testid={`admin-dashboard-user-stat-content-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Text size='lg' fw={600} data-testid={`admin-dashboard-user-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.value}
                      </Text>
                      <Text size='sm' c='dimmed' data-testid={`admin-dashboard-user-stat-label-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.title}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* Security & Compliance Stats */}
        <div data-testid="admin-dashboard-security">
          <Title order={3} mb='md' data-testid="admin-dashboard-security-title">
            Security & Compliance
          </Title>
          <Grid data-testid="admin-dashboard-security-stats">
            {securityStats.map(stat => (
              <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }} data-testid={`admin-dashboard-security-stat-col-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <Card withBorder data-testid={`admin-dashboard-security-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Group>
                    <Avatar color={stat.color} size='lg' data-testid={`admin-dashboard-security-stat-icon-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <stat.icon size={24} />
                    </Avatar>
                    <div style={{ flex: 1 }} data-testid={`admin-dashboard-security-stat-content-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Text size='lg' fw={600} data-testid={`admin-dashboard-security-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.value}
                      </Text>
                      <Text size='sm' c='dimmed' data-testid={`admin-dashboard-security-stat-label-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.title}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* System Alerts */}
        {failedLogins > 10 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title='Security Alert'
            color={theme.colors[theme.primaryColor][9]}
            variant='light'
            data-testid="admin-dashboard-security-alert"
          >
            High number of failed login attempts detected. Consider reviewing
            security logs.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
