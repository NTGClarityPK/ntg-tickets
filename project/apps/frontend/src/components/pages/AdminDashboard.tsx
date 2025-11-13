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
  Button,
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
      <Container size='xl' py='md'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
          <Text>Loading administrative data...</Text>
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
            <Title order={2}>Administrative Overview</Title>
            <Text c='dimmed'>
              System administration and user management metrics
            </Text>
          </div>
          <Button
            className="pdf-hide-elements"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={refreshing}
            variant='outline'
          >
            Refresh Data
          </Button>
        </Group>

        {/* User Management Stats */}
        <div>
          <Title order={3} mb='md'>
            User Management
          </Title>
          <Grid>
            {userStats.map(stat => (
              <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder>
                  <Group>
                    <Avatar color={stat.color} size='lg'>
                      <stat.icon size={24} />
                    </Avatar>
                    <div style={{ flex: 1 }}>
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
        </div>

        {/* Security & Compliance Stats */}
        <div>
          <Title order={3} mb='md'>
            Security & Compliance
          </Title>
          <Grid>
            {securityStats.map(stat => (
              <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder>
                  <Group>
                    <Avatar color={stat.color} size='lg'>
                      <stat.icon size={24} />
                    </Avatar>
                    <div style={{ flex: 1 }}>
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
        </div>

        {/* System Alerts */}
        {failedLogins > 10 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title='Security Alert'
            color='red'
            variant='light'
          >
            High number of failed login attempts detected. Consider reviewing
            security logs.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
