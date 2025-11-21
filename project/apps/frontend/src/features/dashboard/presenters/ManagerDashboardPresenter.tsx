'use client';

import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Card,
  Avatar,
  Table,
  ScrollArea,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { ManagerDashboardMetrics } from '../types/dashboard.types';

interface ManagerDashboardPresenterProps {
  metrics: ManagerDashboardMetrics;
  themeColors: {
    primaryLight: string;
    primaryDark: string;
    primaryLighter: string;
    primaryDarker: string;
  };
}

export function ManagerDashboardPresenter({
  metrics,
}: ManagerDashboardPresenterProps) {
  return (
    <Container size='xl' py='md'>
      <Stack gap='md'>
        {/* Header */}
        <Group justify='space-between'>
          <div>
            <Title order={2}>Manager Overview</Title>
            <Text c='dimmed'>Monitor team performance and ticket metrics</Text>
          </div>
        </Group>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
        >
          {metrics.stats.map(stat => (
            <Card key={stat.title} withBorder style={{ height: '100%' }} p='md'>
              <Group style={{ height: '100%' }}>
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
          ))}
        </div>

        {/* Charts */}
        <Grid>
          <Grid.Col span={12}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>
                Ticket Trends
              </Title>
              <AreaChart
                h={300}
                data={metrics.ticketTrendData}
                dataKey='month'
                series={[
                  { name: 'tickets', color: 'dynamic.6' },
                  { name: 'resolved', color: 'dynamic.4' },
                ]}
                curveType='linear'
                unit=' tickets'
              />
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Tables */}
        <Grid>
          <Grid.Col span={6}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>Tickets by Category</Title>
              <ScrollArea h={300}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Count</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics.ticketsByCategory.map((item) => (
                      <Table.Tr key={`category-${item.category}`}>
                        <Table.Td>{item.category}</Table.Td>
                        <Table.Td>{item.count}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          <Grid.Col span={6}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>Tickets by Status</Title>
              <ScrollArea h={300}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Count</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics.ticketsByStatus.map((item) => (
                      <Table.Tr key={`status-${item.status}`}>
                        <Table.Td>
                          <Badge size='sm'>{item.status}</Badge>
                        </Table.Td>
                        <Table.Td>{item.count}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>Tickets by Impact</Title>
              <ScrollArea h={300}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Impact</Table.Th>
                      <Table.Th>Count</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics.ticketsByImpact.map((item) => (
                      <Table.Tr key={`impact-${item.impact}`}>
                        <Table.Td>{item.impact}</Table.Td>
                        <Table.Td>{item.count}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>Tickets by Urgency</Title>
              <ScrollArea h={300}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Urgency</Table.Th>
                      <Table.Th>Count</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics.ticketsByUrgency.map((item) => (
                      <Table.Tr key={`urgency-${item.urgency}`}>
                        <Table.Td>{item.urgency}</Table.Td>
                        <Table.Td>{item.count}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>Tickets by Priority</Title>
              <ScrollArea h={300}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Priority</Table.Th>
                      <Table.Th>Count</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics.ticketsByPriority.map((item) => (
                      <Table.Tr key={`priority-${item.priority}`}>
                        <Table.Td>
                          <Badge size='sm' color={item.priority === 'CRITICAL' ? 'red' : item.priority === 'HIGH' ? 'orange' : 'blue'}>
                            {item.priority}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{item.count}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          {/* Staff Performance Table - Manager Only */}
          <Grid.Col span={12}>
            <Paper withBorder p='md'>
              <Title order={3} mb='md'>Staff Performance</Title>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Staff Name</Table.Th>
                      <Table.Th>Total Tickets</Table.Th>
                      <Table.Th>Working</Table.Th>
                      <Table.Th>Done</Table.Th>
                      <Table.Th>Hold</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {metrics.staffPerformance?.map((staff) => (
                      <Table.Tr key={staff.staffName}>
                        <Table.Td>{staff.staffName}</Table.Td>
                        <Table.Td>{staff.totalTickets}</Table.Td>
                        <Table.Td>{staff.workingTickets}</Table.Td>
                        <Table.Td>{staff.doneTickets}</Table.Td>
                        <Table.Td>{staff.holdTickets}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}

