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
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
} from '@tabler/icons-react';
import { useUsers } from '../../hooks/useUsers';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchUsers();
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate user metrics
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(user => user.isActive).length || 0;
  const newUsers =
    users?.filter(
      user => user.createdAt && new Date(user.createdAt) > sevenDaysAgo
    ).length || 0;
  const inactiveUsers = users?.filter(user => !user.isActive).length || 0;

  // Security metrics (mock data for now)
  const failedLogins = 3;
  const passwordResets = 12;
  const auditEntries = 156;
  const activeSessions = 24;

  const userStats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: IconUsers,
      color: primaryLight,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: IconUserCheck,
      color: primaryLight,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'New Users',
      value: newUsers,
      icon: IconUserPlus,
      color: primaryLight,
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Inactive Users',
      value: inactiveUsers,
      icon: IconUserX,
      color: primaryLight,
      trend: '-3%',
      trendUp: false,
    },
  ];

  const securityStats = [
    {
      title: 'Failed Logins',
      value: failedLogins,
      icon: IconShield,
      color: primaryLight,
      trend: '-2',
      trendUp: true,
    },
    {
      title: 'Password Resets',
      value: passwordResets,
      icon: IconKey,
      color: primaryLight,
      trend: '+3',
      trendUp: false,
    },
    {
      title: 'Audit Entries',
      value: auditEntries,
      icon: IconHistory,
      color: primaryLight,
      trend: '+45',
      trendUp: true,
    },
    {
      title: 'Active Sessions',
      value: activeSessions,
      icon: IconActivity,
      color: primaryLight,
      trend: '+2',
      trendUp: true,
    },
  ];

  if (usersLoading) {
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
                      <Group gap={4} mt={4}>
                        {stat.trendUp ? (
                          <IconTrendingUp size={12} color='green' />
                        ) : (
                          <IconTrendingDown size={12} color='red' />
                        )}
                        <Text size='xs' c={stat.trendUp ? 'green' : 'red'}>
                          {stat.trend}
                        </Text>
                      </Group>
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
                      <Group gap={4} mt={4}>
                        {stat.trendUp ? (
                          <IconTrendingUp size={12} color='green' />
                        ) : (
                          <IconTrendingDown size={12} color='red' />
                        )}
                        <Text size='xs' c={stat.trendUp ? 'green' : 'red'}>
                          {stat.trend}
                        </Text>
                      </Group>
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
