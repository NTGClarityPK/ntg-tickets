'use client';

import {
  Container,
  Grid,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Avatar,
  Alert,
  ActionIcon,
  Loader,
  useMantineTheme,
} from '@mantine/core';
import { IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { AdminMetrics } from '../types/admin.types';

interface AdminDashboardPresenterProps {
  metrics: AdminMetrics;
  refreshing: boolean;
  onRefresh: () => void;
}

export function AdminDashboardPresenter({
  metrics,
  refreshing,
  onRefresh,
}: AdminDashboardPresenterProps) {
  const theme = useMantineTheme();
  return (
    <Container size='xl' py='md' data-testid="admin-dashboard-container">
      <Stack gap='md' data-testid="admin-dashboard-stack">
        {/* Header */}
        <Group justify='space-between' data-testid="admin-dashboard-header">
          <div data-testid="admin-dashboard-header-text">
            <Title order={2} data-testid="admin-dashboard-title">Administrative Overview</Title>
            <Text c='dimmed' data-testid="admin-dashboard-subtitle">
              System administration and user management metrics
            </Text>
          </div>
          <ActionIcon
            className="pdf-hide-elements"
            variant='outline'
            size='lg'
            onClick={onRefresh}
            disabled={refreshing}
            title='Refresh Data'
            data-testid="admin-dashboard-refresh-button"
          >
            {refreshing ? <Loader size={16} data-testid="admin-dashboard-refresh-loader" /> : <IconRefresh size={20} data-testid="admin-dashboard-refresh-icon" />}
          </ActionIcon>
        </Group>

        {/* Overview Stats */}
        <div data-testid="admin-dashboard-overview-section">
          <Title order={3} mb='md' data-testid="admin-dashboard-overview-title">
            Overview
          </Title>
          <Grid data-testid="admin-dashboard-stats-grid">
            {metrics.userStats.map(stat => (
              <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 4 }} data-testid={`admin-dashboard-stat-col-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <Card withBorder data-testid={`admin-dashboard-stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Group data-testid={`admin-dashboard-stat-group-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Avatar color={stat.color} size='lg' data-testid={`admin-dashboard-stat-avatar-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <stat.icon size={24} />
                    </Avatar>
                    <div style={{ flex: 1 }} data-testid={`admin-dashboard-stat-content-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Text size='lg' fw={600} data-testid={`admin-dashboard-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.value}
                      </Text>
                      <Text size='sm' c='dimmed' data-testid={`admin-dashboard-stat-title-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
        {metrics.failedLogins > 10 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title='Security Alert'
            color={theme.colors[theme.primaryColor][9]}
            variant='light'
            data-testid="admin-dashboard-security-alert"
          >
            <Text size='sm' data-testid="admin-dashboard-security-alert-message">
              High number of failed login attempts detected. Consider reviewing
              security logs.
            </Text>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}

