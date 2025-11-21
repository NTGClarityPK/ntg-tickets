'use client';

import { useMemo } from 'react';
import { Container, Grid, Loader, Group, Card, Text, Avatar, Title, Stack } from '@mantine/core';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconShield,
  IconUser,
  IconAlertCircle,
  IconKey,
} from '@tabler/icons-react';
import { useUsers } from '../../../hooks/useUsers';
import { useSystemAuditLogs } from '../../../hooks/useAuditLogs';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { UserRole } from '../../../types/unified';

export function AdminOverviewContainer() {
  const { primaryLight } = useDynamicTheme();
  const { data: users = [], isLoading: usersLoading } = useUsers({ limit: 1000 });

  // Calculate date range for audit logs (last 30 days)
  const nowForAudit = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => new Date(nowForAudit.getTime() - 30 * 24 * 60 * 60 * 1000), [nowForAudit]);
  const auditDateFrom = useMemo(() => thirtyDaysAgo.toISOString().split('T')[0], [thirtyDaysAgo]);

  const {
    data: recentAuditLogs,
    isLoading: auditLogsLoading,
  } = useSystemAuditLogs(1, 1000, auditDateFrom || '');

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;
    const supportManagers = users.filter(u => u.roles?.includes(UserRole.SUPPORT_MANAGER)).length;
    const supportStaff = users.filter(u => u.roles?.includes(UserRole.SUPPORT_STAFF)).length;
    const endUsers = users.filter(u => u.roles?.includes(UserRole.END_USER)).length;
    const admins = users.filter(u => u.roles?.includes(UserRole.ADMIN)).length;

    const auditLogItems = recentAuditLogs?.items || [];
    const failedLogins = auditLogItems.filter(
      log => log.action === 'LOGIN' && log.metadata && 
      (log.metadata as { success?: boolean })?.success === false
    ).length;

    const passwordResets = auditLogItems.filter(
      log => log.action === 'UPDATE' && log.resource === 'user' && 
      log.fieldName === 'password'
    ).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      supportManagers,
      supportStaff,
      endUsers,
      admins,
      failedLogins,
      passwordResets,
    };
  }, [users, recentAuditLogs]);

  if (usersLoading || auditLogsLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' py='xl'>
          <Loader size='lg' />
        </Group>
      </Container>
    );
  }

  const cards = [
    {
      title: 'TotalUsers',
      value: stats.totalUsers,
      icon: IconUsers,
      color: primaryLight,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: IconUserCheck,
      color: primaryLight,
    },
    {
      title: 'Inactive Users',
      value: stats.inactiveUsers,
      icon: IconUserX,
      color: primaryLight,
    },
    {
      title: 'Support Manager',
      value: stats.supportManagers,
      icon: IconShield,
      color: primaryLight,
    },
    {
      title: 'Support Staff',
      value: stats.supportStaff,
      icon: IconUser,
      color: primaryLight,
    },
    {
      title: 'End user',
      value: stats.endUsers,
      icon: IconUser,
      color: primaryLight,
    },
    {
      title: 'Admin',
      value: stats.admins,
      icon: IconShield,
      color: primaryLight,
    },
    {
      title: 'Failed Login',
      value: stats.failedLogins,
      icon: IconAlertCircle,
      color: primaryLight,
    },
    {
      title: 'Pwd reset',
      value: stats.passwordResets,
      icon: IconKey,
      color: primaryLight,
    },
  ];

  return (
    <Container size='xl' py='md'>
      <Stack gap='md'>
        <div style={{ marginBottom: '2rem' }}>
          <Title order={2} >Administrative Overview</Title>
          <Text c='dimmed' size='sm'>
                System administration and user management metrics.
          </Text>
        </div>
        <Grid>
          {cards.map(card => (
            <Grid.Col key={card.title} span={{ base: 12, sm: 6, md: 4 }}>
              <Card withBorder>
                <Group>
                  <Avatar color={card.color} size='lg'>
                    <card.icon size={24} />
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size='lg' fw={600}>
                      {card.value}
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {card.title}
                    </Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

