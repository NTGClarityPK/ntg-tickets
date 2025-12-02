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
  ActionIcon,
  Loader,
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
    <Container size='xl' py='md' data-testid="elasticsearch-page">
      <Group justify='space-between' mb='xl' data-testid="elasticsearch-page-header">
        <div data-testid="elasticsearch-page-header-content">
          <Title order={2} data-testid="elasticsearch-page-title">Elasticsearch Management</Title>
          <Text c='dimmed' size='sm' data-testid="elasticsearch-page-subtitle">
            Monitor and manage Elasticsearch cluster
          </Text>
        </div>
        <ActionIcon
          variant='light'
          size='lg'
          onClick={handleRefresh}
          disabled={healthLoading}
          title='Refresh'
          data-testid="elasticsearch-page-refresh-button"
        >
          {healthLoading ? <Loader size={16} data-testid="elasticsearch-page-refresh-loader" /> : <IconRefresh size={20} />}
        </ActionIcon>
      </Group>

      {/* Health Overview */}
      <Grid mb='xl' data-testid="elasticsearch-page-health-grid">
        <Grid.Col span={12} data-testid="elasticsearch-page-health-col">
          <Card data-testid="elasticsearch-page-health-card">
            <Stack data-testid="elasticsearch-page-health-stack">
              <Group justify='space-between' data-testid="elasticsearch-page-health-header">
                <Title order={3} data-testid="elasticsearch-page-health-title">Cluster Health</Title>
                <Badge
                  color={getHealthColor(health?.status || 'unknown')}
                  variant='light'
                  leftSection={getHealthIcon(health?.status || 'unknown')}
                  size='lg'
                  data-testid="elasticsearch-page-health-badge"
                >
                  {health?.status || 'Unknown'}
                </Badge>
              </Group>

              {health?.status === 'red' && (
                <Alert
                  color={theme.colors[theme.primaryColor][9]}
                  title='Critical Cluster Issues'
                  icon={<IconAlertTriangle size={16} />}
                  data-testid="elasticsearch-page-health-alert-red"
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
                  data-testid="elasticsearch-page-health-alert-yellow"
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
                  data-testid="elasticsearch-page-health-alert-green"
                >
                  The Elasticsearch cluster is operating normally.
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Cluster Statistics */}
      <Grid mb='xl' data-testid="elasticsearch-page-stats-grid">
        <Grid.Col span={4} data-testid="elasticsearch-page-stats-active-col">
          <Card data-testid="elasticsearch-page-stats-active-card">
            <Stack data-testid="elasticsearch-page-stats-active-stack">
              <Group justify='space-between' data-testid="elasticsearch-page-stats-active-header">
                <Title order={4} data-testid="elasticsearch-page-stats-active-title">Active Shards</Title>
                <IconDatabase size={24} data-testid="elasticsearch-page-stats-active-icon" />
              </Group>
              <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][6]} data-testid="elasticsearch-page-stats-active-value">
                N/A
              </Text>
              <Text size='sm' c='dimmed' data-testid="elasticsearch-page-stats-active-description">
                Active shards in cluster
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4} data-testid="elasticsearch-page-stats-relocating-col">
          <Card data-testid="elasticsearch-page-stats-relocating-card">
            <Stack data-testid="elasticsearch-page-stats-relocating-stack">
              <Group justify='space-between' data-testid="elasticsearch-page-stats-relocating-header">
                <Title order={4} data-testid="elasticsearch-page-stats-relocating-title">Relocating Shards</Title>
                <IconActivity size={24} data-testid="elasticsearch-page-stats-relocating-icon" />
              </Group>
              <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][4]} data-testid="elasticsearch-page-stats-relocating-value">
                N/A
              </Text>
              <Text size='sm' c='dimmed' data-testid="elasticsearch-page-stats-relocating-description">
                Shards being relocated
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4} data-testid="elasticsearch-page-stats-unassigned-col">
          <Card data-testid="elasticsearch-page-stats-unassigned-card">
            <Stack data-testid="elasticsearch-page-stats-unassigned-stack">
              <Group justify='space-between' data-testid="elasticsearch-page-stats-unassigned-header">
                <Title order={4} data-testid="elasticsearch-page-stats-unassigned-title">Unassigned Shards</Title>
                <IconAlertTriangle size={24} data-testid="elasticsearch-page-stats-unassigned-icon" />
              </Group>
              <Text size='xl' fw={700} c={theme.colors[theme.primaryColor][9]} data-testid="elasticsearch-page-stats-unassigned-value">
                N/A
              </Text>
              <Text size='sm' c='dimmed' data-testid="elasticsearch-page-stats-unassigned-description">
                Unassigned shards
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs defaultValue='health' data-testid="elasticsearch-page-tabs">
        <Tabs.List data-testid="elasticsearch-page-tabs-list">
          <Tabs.Tab value='health' leftSection={<IconDatabase size={16} />} data-testid="elasticsearch-page-tab-health">
            Health
          </Tabs.Tab>
          <Tabs.Tab value='search' leftSection={<IconSearch size={16} />} data-testid="elasticsearch-page-tab-search">
            Search
          </Tabs.Tab>
          <Tabs.Tab
            value='aggregations'
            leftSection={<IconTrendingUp size={16} />}
            data-testid="elasticsearch-page-tab-aggregations"
          >
            Aggregations
          </Tabs.Tab>
          <Tabs.Tab value='management' leftSection={<IconSettings size={16} />} data-testid="elasticsearch-page-tab-management">
            Management
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='health' data-testid="elasticsearch-page-panel-health">
          <Card mt='md' data-testid="elasticsearch-page-panel-health-card">
            <Stack data-testid="elasticsearch-page-panel-health-stack">
              <Title order={4} data-testid="elasticsearch-page-panel-health-title">Detailed Health Information</Title>
              <Table data-testid="elasticsearch-page-panel-health-table">
                <Table.Thead data-testid="elasticsearch-page-panel-health-table-head">
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-head-row">
                    <Table.Th data-testid="elasticsearch-page-panel-health-table-header-metric">Metric</Table.Th>
                    <Table.Th data-testid="elasticsearch-page-panel-health-table-header-value">Value</Table.Th>
                    <Table.Th data-testid="elasticsearch-page-panel-health-table-header-status">Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody data-testid="elasticsearch-page-panel-health-table-body">
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-row-cluster-name">
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-cluster-name-label">Cluster Name</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-cluster-name-value">{health?.cluster_name || 'N/A'}</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-cluster-name-status">
                      <Badge color={theme.primaryColor} variant='light' data-testid="elasticsearch-page-panel-health-table-cell-cluster-name-badge">
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-row-nodes">
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-nodes-label">Number of Nodes</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-nodes-value">N/A</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-nodes-status">
                      <Badge color={theme.primaryColor} variant='light' data-testid="elasticsearch-page-panel-health-table-cell-nodes-badge">
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-row-data-nodes">
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-data-nodes-label">Data Nodes</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-data-nodes-value">N/A</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-data-nodes-status">
                      <Badge color={theme.primaryColor} variant='light' data-testid="elasticsearch-page-panel-health-table-cell-data-nodes-badge">
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-row-active-shards">
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-active-shards-label">Active Shards</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-active-shards-value">N/A</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-active-shards-status">
                      <Badge color={theme.primaryColor} variant='light' data-testid="elasticsearch-page-panel-health-table-cell-active-shards-badge">
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-row-relocating-shards">
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-relocating-shards-label">Relocating Shards</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-relocating-shards-value">N/A</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-relocating-shards-status">
                      <Badge color={theme.primaryColor} variant='light' data-testid="elasticsearch-page-panel-health-table-cell-relocating-shards-badge">
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr data-testid="elasticsearch-page-panel-health-table-row-unassigned-shards">
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-unassigned-shards-label">Unassigned Shards</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-unassigned-shards-value">N/A</Table.Td>
                    <Table.Td data-testid="elasticsearch-page-panel-health-table-cell-unassigned-shards-status">
                      <Badge color={theme.primaryColor} variant='light' data-testid="elasticsearch-page-panel-health-table-cell-unassigned-shards-badge">
                        OK
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='search' data-testid="elasticsearch-page-panel-search">
          <Card mt='md' data-testid="elasticsearch-page-panel-search-card">
            <Stack data-testid="elasticsearch-page-panel-search-stack">
              <Title order={4} data-testid="elasticsearch-page-panel-search-title">Search Testing</Title>
              <Grid data-testid="elasticsearch-page-panel-search-grid">
                <Grid.Col span={8} data-testid="elasticsearch-page-panel-search-query-col">
                  <TextInput
                    label='Search Query'
                    placeholder='Enter search query...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="elasticsearch-page-panel-search-query-input"
                  />
                </Grid.Col>
                <Grid.Col span={4} data-testid="elasticsearch-page-panel-search-button-col">
                  <Button
                    onClick={handleSearch}
                    loading={search.isPending}
                    fullWidth
                    mt='xl'
                    data-testid="elasticsearch-page-panel-search-button"
                  >
                    Test Search
                  </Button>
                </Grid.Col>
              </Grid>

              <Divider data-testid="elasticsearch-page-panel-search-divider" />

              <Title order={4} data-testid="elasticsearch-page-panel-search-suggestions-title">Search Suggestions</Title>
              <Grid data-testid="elasticsearch-page-panel-search-suggestions-grid">
                <Grid.Col span={8} data-testid="elasticsearch-page-panel-search-suggestions-query-col">
                  <TextInput
                    label='Suggestion Query'
                    placeholder='Enter text for suggestions...'
                    value={suggestionQuery}
                    onChange={e => setSuggestionQuery(e.target.value)}
                    data-testid="elasticsearch-page-panel-search-suggestions-query-input"
                  />
                </Grid.Col>
                <Grid.Col span={4} data-testid="elasticsearch-page-panel-search-suggestions-button-col">
                  <Button
                    onClick={handleGetSuggestions}
                    loading={suggestions.isPending}
                    fullWidth
                    mt='xl'
                    data-testid="elasticsearch-page-panel-search-suggestions-button"
                  >
                    Get Suggestions
                  </Button>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='aggregations' data-testid="elasticsearch-page-panel-aggregations">
          <Card mt='md' data-testid="elasticsearch-page-panel-aggregations-card">
            <Stack data-testid="elasticsearch-page-panel-aggregations-stack">
              <Title order={4} data-testid="elasticsearch-page-panel-aggregations-title">Search Aggregations</Title>
              <Text size='sm' c='dimmed' data-testid="elasticsearch-page-panel-aggregations-description">
                Current aggregation data from Elasticsearch
              </Text>
              {aggregations && (
                <Code block data-testid="elasticsearch-page-panel-aggregations-code">{JSON.stringify(aggregations, null, 2)}</Code>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='management' data-testid="elasticsearch-page-panel-management">
          <Card mt='md' data-testid="elasticsearch-page-panel-management-card">
            <Stack data-testid="elasticsearch-page-panel-management-stack">
              <Title order={4} data-testid="elasticsearch-page-panel-management-title">Cluster Management</Title>
              <Alert color={theme.colors[theme.primaryColor][4]} title='Reindex Warning' data-testid="elasticsearch-page-panel-management-alert">
                Reindexing will rebuild the search index. This process may take
                several minutes and will temporarily affect search performance.
              </Alert>
              <Button
                color={theme.colors[theme.primaryColor][9]}
                leftSection={<IconRecycle size={16} />}
                onClick={handleReindex}
                loading={reindex.isPending}
                data-testid="elasticsearch-page-panel-management-reindex-button"
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
        data-testid="elasticsearch-page-health-detail-modal"
      >
        <Stack data-testid="elasticsearch-page-health-detail-modal-stack">
          <Text size='sm' fw={500} data-testid="elasticsearch-page-health-detail-modal-title">
            Cluster Health Details
          </Text>
          <Code block data-testid="elasticsearch-page-health-detail-modal-code">{JSON.stringify(health, null, 2)}</Code>
        </Stack>
      </Modal>
    </Container>
  );
}
