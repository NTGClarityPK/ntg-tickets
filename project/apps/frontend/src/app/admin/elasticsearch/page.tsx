'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Alert,
  Table,
  Modal,
  Code,
  Tabs,
  TextInput,
  Divider,
  useMantineTheme,
} from '@mantine/core';
import {
  IconRefresh,
  IconDatabase,
  IconSearch,
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconSettings,
  IconTrendingUp,
  IconRecycle,
} from '@tabler/icons-react';
import {
  useElasticsearchHealth,
  useElasticsearchAggregations,
  useElasticsearchReindex,
  useElasticsearchSearch,
  useElasticsearchSuggestions,
} from '../../../hooks/useElasticsearch';
import { notifications } from '@mantine/notifications';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function ElasticsearchPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    category: [] as string[],
  });
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useElasticsearchHealth();
  const { data: aggregations } = useElasticsearchAggregations(searchFilters);
  const reindex = useElasticsearchReindex();
  const search = useElasticsearchSearch();
  const suggestions = useElasticsearchSuggestions();

  const handleRefresh = () => {
    refetchHealth();
  };

  const handleReindex = async () => {
    try {
      await reindex.mutateAsync();
      notifications.show({
        title: 'Reindex Started',
        message: 'Elasticsearch reindexing has been started',
        color: primaryLight,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to start reindexing',
        color: primaryDark,
      });
    }
  };

  const handleSearch = async () => {
    try {
      const result = await search.mutateAsync({
        query: searchQuery,
        filters: searchFilters,
      });
      notifications.show({
        title: 'Search Completed',
        message: `Found ${result.data?.length || 0} results`,
        color: primaryLight,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Search failed',
        color: primaryDark,
      });
    }
  };

  const handleGetSuggestions = async () => {
    try {
      const result = await suggestions.mutateAsync({
        query: suggestionQuery,
        field: 'title',
      });
      notifications.show({
        title: 'Suggestions Retrieved',
        message: `Found ${result.length} suggestions`,
        color: primaryLight,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to get suggestions',
        color: primaryDark,
      });
    }
  };

  const getHealthColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green':
        return theme.primaryColor;
      case 'yellow':
        return theme.colors[theme.primaryColor][4];
      case 'red':
        return theme.colors[theme.primaryColor][9];
      default:
        return 'gray';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green':
        return <IconCheck size={16} />;
      case 'yellow':
        return <IconAlertTriangle size={16} />;
      case 'red':
        return <IconX size={16} />;
      default:
        return <IconDatabase size={16} />;
    }
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Elasticsearch Management</Title>
          <Text c='dimmed' size='sm'>
            Monitor and manage Elasticsearch cluster
          </Text>
        </div>
        <Button
          variant='light'
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
          loading={healthLoading}
        >
          Refresh
        </Button>
      </Group>

      {/* Health Overview */}
      <Grid mb='xl'>
        <Grid.Col span={12}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={3}>Cluster Health</Title>
                <Badge
                  color={getHealthColor(health?.status || 'unknown')}
                  variant='light'
                  leftSection={getHealthIcon(health?.status || 'unknown')}
                  size='lg'
                >
                  {health?.status || 'Unknown'}
                </Badge>
              </Group>

              {health?.status === 'red' && (
                <Alert
                  color={theme.colors[theme.primaryColor][9]}
                  title='Critical Cluster Issues'
                  icon={<IconAlertTriangle size={16} />}
                >
                  The Elasticsearch cluster is experiencing critical issues.
                  Please check the detailed metrics below.
                </Alert>
              )}

              {health?.status === 'yellow' && (
                <Alert
                  color={theme.colors[theme.primaryColor][4]}
                  title='Cluster Warnings'
                  icon={<IconAlertTriangle size={16} />}
                >
                  The Elasticsearch cluster is experiencing some issues. Monitor
                  the metrics below for more details.
                </Alert>
              )}

              {health?.status === 'green' && (
                <Alert
                  color={theme.primaryColor}
                  title='Cluster Healthy'
                  icon={<IconCheck size={16} />}
                >
                  The Elasticsearch cluster is operating normally.
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Cluster Statistics */}
      <Grid mb='xl'>
        <Grid.Col span={4}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Active Shards</Title>
                <IconDatabase size={24} />
              </Group>
              <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][6]}>
                N/A
              </Text>
              <Text size='sm' c='dimmed'>
                Active shards in cluster
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Relocating Shards</Title>
                <IconActivity size={24} />
              </Group>
              <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][4]}>
                N/A
              </Text>
              <Text size='sm' c='dimmed'>
                Shards being relocated
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>Unassigned Shards</Title>
                <IconAlertTriangle size={24} />
              </Group>
              <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][9]}>
                N/A
              </Text>
              <Text size='sm' c='dimmed'>
                Unassigned shards
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs defaultValue='health'>
        <Tabs.List>
          <Tabs.Tab value='health' leftSection={<IconDatabase size={16} />}>
            Health
          </Tabs.Tab>
          <Tabs.Tab value='search' leftSection={<IconSearch size={16} />}>
            Search
          </Tabs.Tab>
          <Tabs.Tab
            value='aggregations'
            leftSection={<IconTrendingUp size={16} />}
          >
            Aggregations
          </Tabs.Tab>
          <Tabs.Tab value='management' leftSection={<IconSettings size={16} />}>
            Management
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='health'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Detailed Health Information</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Metric</Table.Th>
                    <Table.Th>Value</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>Cluster Name</Table.Td>
                    <Table.Td>{health?.cluster_name || 'N/A'}</Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Number of Nodes</Table.Td>
                    <Table.Td>N/A</Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Data Nodes</Table.Td>
                    <Table.Td>N/A</Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Active Shards</Table.Td>
                    <Table.Td>N/A</Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Relocating Shards</Table.Td>
                    <Table.Td>N/A</Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Unassigned Shards</Table.Td>
                    <Table.Td>N/A</Table.Td>
                    <Table.Td>
                      <Badge color={theme.primaryColor} variant='light'>
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='search'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Search Testing</Title>
              <Grid>
                <Grid.Col span={8}>
                  <TextInput
                    label='Search Query'
                    placeholder='Enter search query...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button
                    onClick={handleSearch}
                    loading={search.isPending}
                    fullWidth
                    mt='xl'
                  >
                    Test Search
                  </Button>
                </Grid.Col>
              </Grid>

              <Divider />

              <Title order={4}>Search Suggestions</Title>
              <Grid>
                <Grid.Col span={8}>
                  <TextInput
                    label='Suggestion Query'
                    placeholder='Enter text for suggestions...'
                    value={suggestionQuery}
                    onChange={e => setSuggestionQuery(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button
                    onClick={handleGetSuggestions}
                    loading={suggestions.isPending}
                    fullWidth
                    mt='xl'
                  >
                    Get Suggestions
                  </Button>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='aggregations'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Search Aggregations</Title>
              <Text size='sm' c='dimmed'>
                Current aggregation data from Elasticsearch
              </Text>
              {aggregations && (
                <Code block>{JSON.stringify(aggregations, null, 2)}</Code>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='management'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Cluster Management</Title>
              <Alert color={theme.colors[theme.primaryColor][4]} title='Reindex Warning'>
                Reindexing will rebuild the search index. This process may take
                several minutes and will temporarily affect search performance.
              </Alert>
              <Button
                color={theme.colors[theme.primaryColor][9]}
                leftSection={<IconRecycle size={16} />}
                onClick={handleReindex}
                loading={reindex.isPending}
              >
                Reindex Cluster
              </Button>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Health Detail Modal */}
      <Modal
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title='Elasticsearch Health Details'
        size='lg'
      >
        <Stack>
          <Text size='sm' fw={500}>
            Cluster Health Details
          </Text>
          <Code block>{JSON.stringify(health, null, 2)}</Code>
        </Stack>
      </Modal>
    </Container>
  );
}
