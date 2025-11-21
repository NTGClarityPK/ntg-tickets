'use client';

import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Card,
  Avatar,
  Table,
  Grid,
  ScrollArea,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { SupportStaffDashboardMetrics } from '../types/dashboard.types';

interface SupportStaffDashboardPresenterProps {
  metrics: SupportStaffDashboardMetrics;
  themeColors: {
    primaryLight: string;
    primaryDark: string;
    primaryLighter: string;
    primaryDarker: string;
  };
  onViewTickets: () => void;
}

export function SupportStaffDashboardPresenter({
  metrics,
  onViewTickets,
}: SupportStaffDashboardPresenterProps) {
  return (
    <Container size='xl' py='md'>
      <Stack gap='md'>
        {/* Header */}
        <Group justify='space-between'>
          <div>
            <Title order={2}>Support Staff Overview</Title>
            <Text c='dimmed'>
              Manage your assigned tickets and track performance
            </Text>
          </div>
          <Group>
            <Button
              className="pdf-hide-elements"
              variant='outline'
              leftSection={<IconSearch size={16} />}
              onClick={onViewTickets}
            >
              Search Tickets
            </Button>
          </Group>
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
        </Grid>
      </Stack>
    </Container>
  );
}

