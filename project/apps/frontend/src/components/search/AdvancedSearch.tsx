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
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Advanced Search</Title>
          <Text c='dimmed' size='sm'>
            Search tickets with Elasticsearch-powered full-text search
          </Text>
        </div>
        <Group>
          {healthLoading ? (
            <Loader size='sm' />
          ) : (
            <Badge
              color={health?.status === 'green' ? theme.primaryColor : theme.colors[theme.primaryColor][9]}
              variant='light'
              leftSection={<IconTrendingUp size={12} />}
            >
              {health?.status || 'Unknown'}
            </Badge>
          )}
          <Button
            variant='light'
            leftSection={<IconRefresh size={16} />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <Tabs
        value={activeTab}
        onChange={value => setActiveTab(value || 'search')}
      >
        <Tabs.List>
          <Tabs.Tab value='search' leftSection={<IconSearch size={16} />}>
            Search
          </Tabs.Tab>
          <Tabs.Tab value='filters' leftSection={<IconFilter size={16} />}>
            Filters
          </Tabs.Tab>
          <Tabs.Tab
            value='aggregations'
            leftSection={<IconTrendingUp size={16} />}
          >
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value='search'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Search Tickets</Title>
              <Group>
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
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    )
                  }
                  style={{ flex: 1 }}
                />
                <Button onClick={handleSearch} loading={search.isPending}>
                  Search
                </Button>
              </Group>

              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <Card padding='sm'>
                  <Text size='sm' fw={500} mb='xs'>
                    Suggestions:
                  </Text>
                  <Group gap='xs'>
                    {suggestions.slice(0, 5).map(suggestion => (
                      <Badge
                        key={suggestion}
                        variant='light'
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              )}

              {/* Search Results */}
              {search.isPending ? (
                <Stack gap='md' mt='md'>
                  <Skeleton height={20} width={150} />
                  <Table>
                    <Table.Thead>
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
                    <Table.Tbody>
                      {[...Array(5)].map((_, index) => (
                        <Table.Tr key={index}>
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
                <Stack>
                  <Group justify='space-between'>
                    <Text size='sm' c='dimmed'>
                      Found {searchResults.length} results
                    </Text>
                    <Button variant='light' size='xs' onClick={clearFilters}>
                      Clear All
                    </Button>
                  </Group>
                  <Table>
                    <Table.Thead>
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
                    <Table.Tbody>
                      {searchResults.map(result => (
                        <Table.Tr key={result.id}>
                          <Table.Td>
                            <Stack gap='xs'>
                              <Text fw={500}>
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
                                <Text size='sm' c='dimmed'>
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
                          <Table.Td>
                            <Badge
                              color={getStatusColor(result.status)}
                              variant='light'
                              size='sm'
                            >
                              {result.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={getPriorityColor(result.priority)}
                              variant='light'
                              size='sm'
                            >
                              {result.priority}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size='sm'>{result.category}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size='sm'>
                              {result.assignedTo?.name || 'Unassigned'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={theme.primaryColor} variant='light' size='sm'>
                              {Math.round(result.score * 100)}%
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              variant='light'
                              size='sm'
                              onClick={() => handleResultClick(result)}
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

        <Tabs.Panel value='filters'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Search Filters</Title>
              <Grid>
                <Grid.Col span={6}>
                  <MultiSelect
                    label='Status'
                    placeholder='Select status'
                    data={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={value =>
                      setFilters({ ...filters, status: value })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <MultiSelect
                    label='Priority'
                    placeholder='Select priority'
                    data={PRIORITY_OPTIONS}
                    value={filters.priority}
                    onChange={value =>
                      setFilters({ ...filters, priority: value })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DatePickerInput
                    label='From Date'
                    placeholder='Select start date'
                    value={filters.dateFrom}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateFrom: date || undefined })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DatePickerInput
                    label='To Date'
                    placeholder='Select end date'
                    value={filters.dateTo}
                    onChange={(date: Date | null) =>
                      setFilters({ ...filters, dateTo: date || undefined })
                    }
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value='aggregations'>
          <Card mt='md'>
            <Stack>
              <Title order={4}>Search Analytics</Title>
              <Text size='sm' c='dimmed'>
                Aggregated data from your search results
              </Text>
              {aggregations && (
                <Code block>{JSON.stringify(aggregations, null, 2)}</Code>
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
      >
        {selectedResult && (
          <Stack>
            <Group>
              <Badge
                color={getStatusColor(selectedResult.status)}
                variant='light'
              >
                {selectedResult.status}
              </Badge>
              <Badge
                color={getPriorityColor(selectedResult.priority)}
                variant='light'
              >
                {selectedResult.priority}
              </Badge>
              <Badge color={theme.primaryColor} variant='light'>
                Score: {Math.round(selectedResult.score * 100)}%
              </Badge>
            </Group>
            <Divider />
            <Stack>
              <Text fw={500}>Title</Text>
              <Text>{selectedResult.title}</Text>
            </Stack>
            <Stack>
              <Text fw={500}>Description</Text>
              <Text>{selectedResult.description}</Text>
            </Stack>
            <Grid>
              <Grid.Col span={6}>
                <Text fw={500}>Category</Text>
                <Text>{selectedResult.category}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>Assigned To</Text>
                <Text>{selectedResult.assignedTo?.name || 'Unassigned'}</Text>
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={6}>
                <Text fw={500}>Created</Text>
                <Text>
                  {new Date(selectedResult.createdAt).toLocaleString()}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={500}>Updated</Text>
                <Text>
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
