'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Table,
  MultiSelect,
  Modal,
  ActionIcon,
  Tabs,
  Code,
  Divider,
  Loader,
  useMantineTheme,
  Skeleton,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconX,
  IconEye,
  IconTrendingUp,
  IconFilter,
} from '@tabler/icons-react';
import {
  useElasticsearchSearch,
  useElasticsearchSuggestions,
  useElasticsearchAggregations,
  useElasticsearchHealth,
} from '../../hooks/useElasticsearch';
import { showErrorNotification } from '@/lib/notifications';
import { DatePickerInput } from '@mantine/dates';
import { Ticket } from '../../types/unified';

interface SearchFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  score: number;
  highlights?: {
    title?: string[];
    description?: string[];
  };
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function AdvancedSearch() {
  const theme = useMantineTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const search = useElasticsearchSearch();
  const getSuggestions = useElasticsearchSuggestions();
  const { data: aggregations } = useElasticsearchAggregations(filters);
  const { data: health, isLoading: healthLoading } = useElasticsearchHealth();

  const handleGetSuggestions = useCallback(async () => {
    try {
      const result = await getSuggestions.mutateAsync({
        query: searchQuery,
        field: 'title',
      });
      setSuggestions(result.map((s: { text: string }) => s.text));
      setShowSuggestions(true);
    } catch (error) {
      // Silently fail for suggestions
    }
  }, [searchQuery, getSuggestions]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        handleGetSuggestions();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, handleGetSuggestions]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showErrorNotification('Error', 'Please enter a search query');
      return;
    }

    try {
      // Convert Date objects to strings for API
      const apiFilters = {
        ...filters,
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString(),
      };

      const result = await search.mutateAsync({
        query: searchQuery,
        filters: apiFilters,
      });

      // Transform result to match SearchResult interface
      const searchResults: SearchResult[] = (result.data || []).map(
        (ticket: Ticket) => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category.name,
          assignedTo: ticket.assignedTo
            ? {
                name: ticket.assignedTo.name,
                email: ticket.assignedTo.email,
              }
            : undefined,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          score: 0.5, // Default score since Ticket doesn't have this property
          highlights: {}, // Default highlights since Ticket doesn't have this property
        })
      );

      setSearchResults(searchResults);
      setShowSuggestions(false);
    } catch (error) {
      showErrorNotification('Error', 'Search failed');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setDetailModalOpen(true);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSearchResults([]);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: theme.primaryColor,
      in_progress: theme.colors[theme.primaryColor][4],
      resolved: theme.primaryColor,
      closed: 'gray',
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: theme.primaryColor,
      medium: theme.colors[theme.primaryColor][4],
      high: 'orange',
      critical: theme.colors[theme.primaryColor][9],
    };
    return colors[priority] || 'gray';
  };

  const formatHighlight = (highlight: string) => {
    return highlight.replace(/<em>/g, '<mark>').replace(/<\/em>/g, '</mark>');
  };

  return (
    <Container size='xl' py='md' data-testid="advanced-search-container">
      <Group justify='space-between' mb='xl' data-testid="advanced-search-header">
        <div data-testid="advanced-search-header-text">
          <Title order={2} data-testid="advanced-search-title">Advanced Search</Title>
          <Text c='dimmed' size='sm' data-testid="advanced-search-subtitle">
            Search tickets with Elasticsearch-powered full-text search
          </Text>
        </div>
        <Group data-testid="advanced-search-header-actions">
          {healthLoading ? (
            <Loader size='sm' data-testid="advanced-search-health-loader" />
          ) : (
            <Badge
              color={health?.status === 'green' ? theme.primaryColor : theme.colors[theme.primaryColor][9]}
              variant='light'
              leftSection={<IconTrendingUp size={12} />}
              data-testid="advanced-search-health-badge"
            >
              {health?.status || 'Unknown'}
            </Badge>
          )}
          <ActionIcon
            variant='light'
            size='lg'
            onClick={() => window.location.reload()}
            title='Refresh'
            data-testid="advanced-search-refresh-button"
          >
            <IconRefresh size={20} />
          </ActionIcon>
        </Group>
      </Group>

      <Tabs
        value={activeTab}
        onChange={value => setActiveTab(value || 'search')}
        data-testid="advanced-search-tabs"
      >
        <Tabs.List data-testid="advanced-search-tabs-list">
          <Tabs.Tab value='search' leftSection={<IconSearch size={16} />} data-testid="advanced-search-tab-search">
            Search
          </Tabs.Tab>
          <Tabs.Tab value='filters' leftSection={<IconFilter size={16} />} data-testid="advanced-search-tab-filters">
            Filters
          </Tabs.Tab>
          <Tabs.Tab
            value='aggregations'
            leftSection={<IconTrendingUp size={16} />}
            data-testid="advanced-search-tab-analytics"
          >
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='search' data-testid="advanced-search-panel-search">
          <Card mt='md' data-testid="advanced-search-search-card">
            <Stack data-testid="advanced-search-search-stack">
              <Title order={4} data-testid="advanced-search-search-title">Search Tickets</Title>
              <Group data-testid="advanced-search-search-input-group">
                <TextInput
                  placeholder='Search tickets...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftSection={<IconSearch size={16} />}
                  rightSection={
                    searchQuery && (
                      <ActionIcon
                        variant='subtle'
                        size='sm'
                        onClick={() => setSearchQuery('')}
                        data-testid="advanced-search-clear-input-button"
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    )
                  }
                  style={{ flex: 1 }}
                  data-testid="advanced-search-query-input"
                />
                <Button onClick={handleSearch} loading={search.isPending} data-testid="advanced-search-submit-button">
                  Search
                </Button>
              </Group>

              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <Card padding='sm' data-testid="advanced-search-suggestions-card">
                  <Text size='sm' fw={500} mb='xs' data-testid="advanced-search-suggestions-title">
                    Suggestions:
                  </Text>
                  <Group gap='xs' data-testid="advanced-search-suggestions-group">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <Badge
                        key={suggestion}
                        variant='light'
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        data-testid={`advanced-search-suggestion-${index}`}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              )}

              {/* Search Results */}
              {search.isPending ? (
                <Stack gap='md' mt='md' data-testid="advanced-search-loading">
                  <Skeleton height={20} width={150} data-testid="advanced-search-loading-skeleton-1" />
                  <Table data-testid="advanced-search-loading-table">
                    <Table.Thead data-testid="advanced-search-loading-thead">
                      <Table.Tr>
                        <Table.Th>Title</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Priority</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Assigned To</Table.Th>
                        <Table.Th>Score</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody data-testid="advanced-search-loading-tbody">
                      {[...Array(5)].map((_, index) => (
                        <Table.Tr key={index} data-testid={`advanced-search-loading-row-${index}`}>
                          <Table.Td>
                            <Stack gap='xs'>
                              <Skeleton height={16} width='80%' />
                              <Skeleton height={14} width='100%' />
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Skeleton height={24} width={70} />
                          </Table.Td>
                          <Table.Td>
                            <Skeleton height={24} width={70} />
                          </Table.Td>
                          <Table.Td>
                            <Skeleton height={16} width={100} />
                          </Table.Td>
                          <Table.Td>
                            <Skeleton height={16} width={120} />
                          </Table.Td>
                          <Table.Td>
                            <Skeleton height={24} width={60} />
                          </Table.Td>
                          <Table.Td>
                            <Skeleton height={28} width={28} circle />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              ) : searchResults.length > 0 ? (
                <Stack data-testid="advanced-search-results">
                  <Group justify='space-between' data-testid="advanced-search-results-header">
                    <Text size='sm' c='dimmed' data-testid="advanced-search-results-count">
                      Found {searchResults.length} results
                    </Text>
                    <Button variant='light' size='xs' onClick={clearFilters} data-testid="advanced-search-clear-all-button">
                      Clear All
                    </Button>
                  </Group>
                  <Table data-testid="advanced-search-results-table">
                    <Table.Thead data-testid="advanced-search-results-thead">
                      <Table.Tr>
                        <Table.Th>Title</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Priority</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Assigned To</Table.Th>
                        <Table.Th>Score</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody data-testid="advanced-search-results-tbody">
                      {searchResults.map(result => (
                        <Table.Tr key={result.id} data-testid={`advanced-search-result-row-${result.id}`}>
                          <Table.Td data-testid={`advanced-search-result-title-${result.id}`}>
                            <Stack gap='xs'>
                              <Text fw={500} data-testid={`advanced-search-result-title-text-${result.id}`}>
                                {result.highlights?.title ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: formatHighlight(
                                        result.highlights.title[0]
                                      ),
                                    }}
                                  />
                                ) : (
                                  result.title
                                )}
                              </Text>
                              {result.highlights?.description && (
                                <Text size='sm' c='dimmed' data-testid={`advanced-search-result-description-${result.id}`}>
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: formatHighlight(
                                        result.highlights.description[0]
                                      ),
                                    }}
                                  />
                                </Text>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td data-testid={`advanced-search-result-status-${result.id}`}>
                            <Badge
                              color={getStatusColor(result.status)}
                              variant='light'
                              size='sm'
                              data-testid={`advanced-search-result-status-badge-${result.id}`}
                            >
                              {result.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td data-testid={`advanced-search-result-priority-${result.id}`}>
                            <Badge
                              color={getPriorityColor(result.priority)}
                              variant='light'
                              size='sm'
                              data-testid={`advanced-search-result-priority-badge-${result.id}`}
                            >
                              {result.priority}
                            </Badge>
                          </Table.Td>
                          <Table.Td data-testid={`advanced-search-result-category-${result.id}`}>
                            <Text size='sm'>{result.category}</Text>
                          </Table.Td>
                          <Table.Td data-testid={`advanced-search-result-assigned-${result.id}`}>
                            <Text size='sm'>
                              {result.assignedTo?.name || 'Unassigned'}
                            </Text>
                          </Table.Td>
                          <Table.Td data-testid={`advanced-search-result-score-${result.id}`}>
                            <Badge color={theme.primaryColor} variant='light' size='sm' data-testid={`advanced-search-result-score-badge-${result.id}`}>
                              {Math.round(result.score * 100)}%
                            </Badge>
                          </Table.Td>
                          <Table.Td data-testid={`advanced-search-result-actions-${result.id}`}>
                            <ActionIcon
                              variant='light'
                              size='sm'
                              onClick={() => handleResultClick(result)}
                              data-testid={`advanced-search-result-view-button-${result.id}`}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              ) : null}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='filters' data-testid="advanced-search-panel-filters">
          <Card mt='md' data-testid="advanced-search-filters-card">
            <Stack data-testid="advanced-search-filters-stack">
              <Title order={4} data-testid="advanced-search-filters-title">Search Filters</Title>
              <Grid data-testid="advanced-search-filters-grid">
                <Grid.Col span={6} data-testid="advanced-search-filter-status-col">
                  <MultiSelect
                    label='Status'
                    placeholder='Select status'
                    data={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={value =>
                      setFilters({ ...filters, status: value })
                    }
                    data-testid="advanced-search-filter-status"
                  />
                </Grid.Col>
                <Grid.Col span={6} data-testid="advanced-search-filter-priority-col">
                  <MultiSelect
                    label='Priority'
                    placeholder='Select priority'
                    data={PRIORITY_OPTIONS}
                    value={filters.priority}
                    onChange={value =>
                      setFilters({ ...filters, priority: value })
                    }
                    data-testid="advanced-search-filter-priority"
                  />
                </Grid.Col>
                <Grid.Col span={6} data-testid="advanced-search-filter-date-from-col">
                  <DatePickerInput
                    label='From Date'
                    placeholder='Select start date'
                    value={filters.dateFrom}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateFrom: date || undefined })
                    }
                    data-testid="advanced-search-filter-date-from"
                  />
                </Grid.Col>
                <Grid.Col span={6} data-testid="advanced-search-filter-date-to-col">
                  <DatePickerInput
                    label='To Date'
                    placeholder='Select end date'
                    value={filters.dateTo}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateTo: date || undefined })
                    }
                    data-testid="advanced-search-filter-date-to"
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='aggregations' data-testid="advanced-search-panel-analytics">
          <Card mt='md' data-testid="advanced-search-analytics-card">
            <Stack data-testid="advanced-search-analytics-stack">
              <Title order={4} data-testid="advanced-search-analytics-title">Search Analytics</Title>
              <Text size='sm' c='dimmed' data-testid="advanced-search-analytics-description">
                Aggregated data from your search results
              </Text>
              {aggregations && (
                <Code block data-testid="advanced-search-analytics-code">{JSON.stringify(aggregations, null, 2)}</Code>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Result Detail Modal */}
      <Modal
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title='Search Result Details'
        size='lg'
        data-testid="advanced-search-result-modal"
      >
        {selectedResult && (
          <Stack data-testid="advanced-search-result-modal-stack">
            <Group data-testid="advanced-search-result-modal-badges">
              <Badge
                color={getStatusColor(selectedResult.status)}
                variant='light'
                data-testid="advanced-search-result-modal-status-badge"
              >
                {selectedResult.status}
              </Badge>
              <Badge
                color={getPriorityColor(selectedResult.priority)}
                variant='light'
                data-testid="advanced-search-result-modal-priority-badge"
              >
                {selectedResult.priority}
              </Badge>
              <Badge color={theme.primaryColor} variant='light' data-testid="advanced-search-result-modal-score-badge">
                Score: {Math.round(selectedResult.score * 100)}%
              </Badge>
            </Group>
            <Divider data-testid="advanced-search-result-modal-divider" />
            <Stack data-testid="advanced-search-result-modal-title-section">
              <Text fw={500} data-testid="advanced-search-result-modal-title-label">Title</Text>
              <Text data-testid="advanced-search-result-modal-title-value">{selectedResult.title}</Text>
            </Stack>
            <Stack data-testid="advanced-search-result-modal-description-section">
              <Text fw={500} data-testid="advanced-search-result-modal-description-label">Description</Text>
              <Text data-testid="advanced-search-result-modal-description-value">{selectedResult.description}</Text>
            </Stack>
            <Grid data-testid="advanced-search-result-modal-details-grid">
              <Grid.Col span={6} data-testid="advanced-search-result-modal-category-col">
                <Text fw={500} data-testid="advanced-search-result-modal-category-label">Category</Text>
                <Text data-testid="advanced-search-result-modal-category-value">{selectedResult.category}</Text>
              </Grid.Col>
              <Grid.Col span={6} data-testid="advanced-search-result-modal-assigned-col">
                <Text fw={500} data-testid="advanced-search-result-modal-assigned-label">Assigned To</Text>
                <Text data-testid="advanced-search-result-modal-assigned-value">{selectedResult.assignedTo?.name || 'Unassigned'}</Text>
              </Grid.Col>
            </Grid>
            <Grid data-testid="advanced-search-result-modal-dates-grid">
              <Grid.Col span={6} data-testid="advanced-search-result-modal-created-col">
                <Text fw={500} data-testid="advanced-search-result-modal-created-label">Created</Text>
                <Text data-testid="advanced-search-result-modal-created-value">
                  {new Date(selectedResult.createdAt).toLocaleString()}
                </Text>
              </Grid.Col>
              <Grid.Col span={6} data-testid="advanced-search-result-modal-updated-col">
                <Text fw={500} data-testid="advanced-search-result-modal-updated-label">Updated</Text>
                <Text data-testid="advanced-search-result-modal-updated-value">
                  {new Date(selectedResult.updatedAt).toLocaleString()}
                </Text>
              </Grid.Col>
            </Grid>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
