'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Progress,
  Stack,
  Button,
  Alert,
  Divider,
  Table,
  ActionIcon,
  Modal,
  Code,
  useMantineTheme,
} from '@mantine/core';
import {
  IconRefresh,
  IconServer,
  IconDatabase,
  IconCpu,
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconClock,
  IconSettings,
  IconTrendingUp,
} from '@tabler/icons-react';
import {
  useSystemStats,
  useSystemHealth,
} from '../../../hooks/useSystemMonitoring';
import { useRouter } from 'next/navigation';

export default function SystemMonitoringPage() {
  const theme = useMantineTheme();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<{
    name: string;
    value: string | number;
    details: string;
  } | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const {
    data: systemStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useSystemStats();
  const {
    data: systemHealth,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useSystemHealth();

  const handleRefresh = () => {
    refetchStats();
    refetchHealth();
  };

  const getHealthColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <IconCheck size={16} />;
      case 'warning':
        return <IconAlertTriangle size={16} />;
      case 'critical':
        return <IconX size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>System Monitoring</Title>
          <Text c='dimmed' size='sm'>
            Monitor system performance and health
          </Text>
        </div>
        <Button
          variant='light'
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
          loading={statsLoading || healthLoading}
        >
          Refresh
        </Button>
      </Group>

      {/* System Health Overview */}
      <Grid mb='xl'>
        <Grid.Col span={12}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={3}>System Health</Title>
                <Badge
                  color={getHealthColor(systemHealth?.status || 'unhealthy')}
                  variant='light'
                  leftSection={getHealthIcon(
                    systemHealth?.status || 'unhealthy'
                  )}
                  size='lg'
                >
                  {systemHealth?.status || 'Unknown'}
                </Badge>
              </Group>

              {systemHealth?.status === 'unhealthy' && (
                <Alert
                  color={theme.colors[theme.primaryColor][9]}
                  title='Critical System Issues'
                  icon={<IconAlertTriangle size={16} />}
                >
                  The system is experiencing critical issues. Please check the
                  detailed metrics below.
                </Alert>
              )}

              {systemHealth?.status === 'degraded' && (
                <Alert
                  color={theme.colors[theme.primaryColor][4]}
                  title='System Warnings'
                  icon={<IconAlertTriangle size={16} />}
                >
                  The system is experiencing some issues. Monitor the metrics
                  below for more details.
                </Alert>
              )}

              {systemHealth?.status === 'healthy' && (
                <Alert
                  color={theme.primaryColor}
                  title='System Healthy'
                  icon={<IconCheck size={16} />}
                >
                  All systems are operating normally.
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* System Statistics */}
      <Grid mb='xl'>
        <Grid.Col span={6}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>CPU Usage</Title>
                <IconCpu size={24} />
              </Group>
              <Progress
                value={0} // CPU usage not available in current SystemStats interface
                color={theme.primaryColor}
                size='lg'
              />
              <Text size='sm' c='dimmed'>
                N/A - Not available in current interface
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Memory Usage</Title>
                <IconCpu size={24} />
              </Group>
              <Progress
                value={0} // Memory usage not available in current SystemStats interface
                color={theme.primaryColor}
                size='lg'
              />
              <Text size='sm' c='dimmed'>
                N/A - Not available in current interface
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Detailed Metrics */}
      <Grid>
        <Grid.Col span={8}>
          <Card>
            <Stack>
              <Title order={4}>System Metrics</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Metric</Table.Th>
                    <Table.Th>Value</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>
                      <Group gap='xs'>
                        <IconServer size={16} />
                        <Text size='sm'>Server Uptime</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        {systemStats?.systemUptime || 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        Healthy
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant='subtle'
                        onClick={() => {
                          setSelectedMetric({
                            name: 'Server Uptime',
                            value: systemStats?.systemUptime || 'N/A',
                            details: 'System uptime information',
                          });
                          setDetailModalOpen(true);
                        }}
                      >
                        <IconTrendingUp size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Td>
                      <Group gap='xs'>
                        <IconDatabase size={16} />
                        <Text size='sm'>Database Connections</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        N/A - Not available in current interface
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        Healthy
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant='subtle'
                        onClick={() => {
                          setSelectedMetric({
                            name: 'Database Connections',
                            value: 'N/A - Not available in current interface',
                            details: 'Active database connections',
                          });
                          setDetailModalOpen(true);
                        }}
                      >
                        <IconTrendingUp size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Td>
                      <Group gap='xs'>
                        <IconActivity size={16} />
                        <Text size='sm'>Active Users</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>{systemStats?.activeUsers || 'N/A'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        Healthy
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant='subtle'
                        onClick={() => {
                          setSelectedMetric({
                            name: 'Active Users',
                            value: systemStats?.activeUsers || 0,
                            details: 'Currently active users',
                          });
                          setDetailModalOpen(true);
                        }}
                      >
                        <IconTrendingUp size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>

                  <Table.Tr>
                    <Table.Td>
                      <Group gap='xs'>
                        <IconServer size={16} />
                        <Text size='sm'>Disk Usage</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>
                        N/A - Not available in current interface
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        Healthy
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant='subtle'
                        onClick={() => {
                          setSelectedMetric({
                            name: 'Disk Usage',
                            value: 'N/A - Not available in current interface',
                            details: 'Total disk space used',
                          });
                          setDetailModalOpen(true);
                        }}
                      >
                        <IconTrendingUp size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack>
            <Card>
              <Stack>
                <Title order={4}>Quick Actions</Title>
                <Button
                  variant='light'
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleRefresh}
                  fullWidth
                >
                  Refresh Metrics
                </Button>
                <Button
                  variant='light'
                  leftSection={<IconSettings size={16} />}
                  onClick={() => router.push('/admin/settings')}
                  fullWidth
                >
                  System Settings
                </Button>
              </Stack>
            </Card>

            <Card>
              <Stack>
                <Title order={4}>System Information</Title>
                <Group justify='space-between'>
                  <Text size='sm'>Version</Text>
                  <Text size='sm' c='dimmed'>
                    N/A - Not available in current interface
                  </Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>Environment</Text>
                  <Text size='sm' c='dimmed'>
                    N/A - Not available in current interface
                  </Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>Last Updated</Text>
                  <Text size='sm' c='dimmed'>
                    N/A - Not available in current interface
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Metric Detail Modal */}
      <Modal
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title='Metric Details'
        size='lg'
      >
        {selectedMetric && (
          <Stack>
            <Text size='sm' fw={500}>
              Metric: {selectedMetric.name}
            </Text>
            <Text size='sm' c='dimmed'>
              Value: {selectedMetric.value}
            </Text>
            <Text size='sm' c='dimmed'>
              Details: {selectedMetric.details}
            </Text>

            <Divider />

            <Text size='sm' fw={500}>
              Historical Data
            </Text>
            <Code block>
              {JSON.stringify(
                {
                  metric: selectedMetric.name,
                  value: selectedMetric.value,
                  timestamp: new Date().toISOString(),
                  details: selectedMetric.details,
                },
                null,
                2
              )}
            </Code>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
