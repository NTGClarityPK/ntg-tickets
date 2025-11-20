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
  Button,
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
            onClick={onRefresh}
            loading={refreshing}
            variant='outline'
          >
            Refresh Data
          </Button>
        </Group>

        {/* Overview Stats */}
        <div>
          <Title order={3} mb='md'>
            Overview
          </Title>
          <Grid>
            {metrics.userStats.map(stat => (
              <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 4 }}>
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
        {metrics.failedLogins > 10 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title='Security Alert'
            color={theme.colors[theme.primaryColor][9]}
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

