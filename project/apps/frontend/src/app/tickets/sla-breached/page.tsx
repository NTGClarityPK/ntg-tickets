'use client';

// Utility function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

import { useState } from 'react';
import { ManagerAndAdmin } from '../../../components/guards/RouteGuard';
import {
  Container,
  Title,
  Button,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Card,
  Stack,
  Pagination,
  Grid,
} from '@mantine/core';
import {
  IconFilter,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
  IconX,
  IconTicket,
} from '@tabler/icons-react';
import {
  useTicketsWithPagination,
  useTotalTicketsCount,
} from '../../../hooks/useTickets';
import { useRouter } from 'next/navigation';
import { SearchBar } from '../../../components/search/SearchBar';
import { AdvancedSearchModal } from '../../../components/search/AdvancedSearchModal';
import { SimpleFiltersModal } from '../../../components/forms/SimpleFiltersModal';
import { useSearch } from '../../../hooks/useSearch';
import { PAGINATION_CONFIG } from '../../../lib/constants';
import { Ticket } from '../../../types/unified';

function SLABreachedTicketsPageContent() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [simpleFiltersOpen, setSimpleFiltersOpen] = useState(false);

  const {
    filters: searchFilters,
    recentSearches,
    updateFilters,
    clearFilters,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
    getSearchQuery,
    hasActiveFilters,
  } = useSearch();

  const baseQuery = getSearchQuery();
  // Get all tickets without pagination for client-side filtering
  const ticketsQuery = {
    ...baseQuery,
    page: 1,
    limit: 1000, // Get a large number to ensure we get all tickets
  };

  const { data: ticketsData, isFetching } =
    useTicketsWithPagination(ticketsQuery);

  // Get total count of all tickets (no filters)
  const { data: totalTicketsCount } = useTotalTicketsCount();

  // Apply client-side SLA breach filtering
  let allBreachedTickets = ticketsData?.tickets || [];
  allBreachedTickets = allBreachedTickets.filter(
    t => t.dueDate && t.closedAt && new Date(t.closedAt) > new Date(t.dueDate)
  );

  // Apply additional breach time filters if specified
  const minB = (searchFilters as { minSlaBreachHours?: number })
    .minSlaBreachHours;
  const maxB = (searchFilters as { maxSlaBreachHours?: number })
    .maxSlaBreachHours;
  if (typeof minB === 'number' || typeof maxB === 'number') {
    const minHours = minB ?? 0;
    const maxHours = maxB ?? Number.POSITIVE_INFINITY;
    allBreachedTickets = allBreachedTickets.filter(t => {
      if (!t.dueDate || !t.closedAt) return false;
      const breachHours =
        (new Date(t.closedAt).getTime() - new Date(t.dueDate).getTime()) /
        (1000 * 60 * 60);
      return breachHours >= minHours && breachHours <= maxHours;
    });
  }

  // Implement client-side pagination
  const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
  const totalBreachedTickets = allBreachedTickets.length;
  const totalPages = Math.ceil(totalBreachedTickets / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const tickets = allBreachedTickets.slice(startIndex, endIndex);

  // Create pagination object for the UI
  const pagination = {
    total: totalBreachedTickets,
    totalPages: totalPages,
    currentPage: currentPage,
    pageSize: pageSize,
  };

  // Quick action helpers removed in the simplified cards UI

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>SLA Breached Tickets</Title>
          <Text c='dimmed' size='sm'>
            Tickets that have severely breached their SLA deadlines
          </Text>
          {hasActiveFilters() && (
            <Text size='sm' c='blue' mt='xs'>
              Showing {tickets.length} of {totalTicketsCount || 0} tickets
            </Text>
          )}
        </div>
      </Group>

      <Grid mb='md'>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SearchBar
            key={searchFilters.search || 'empty'}
            value={searchFilters.search}
            onChange={value => {
              updateFilters({ search: value });
              if (value.trim()) addRecentSearch(value);
              setCurrentPage(1);
            }}
            onAdvancedSearch={() => setAdvancedSearchOpen(true)}
            onSimpleFilters={() => setSimpleFiltersOpen(true)}
            recentSearches={recentSearches}
            onRecentSearchClick={addRecentSearch}
            onClearRecentSearches={clearRecentSearches}
            onRemoveRecentSearch={removeRecentSearch}
            debounceMs={1500}
            isLoading={isFetching}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Button
            variant='light'
            leftSection={<IconFilter size={16} />}
            fullWidth
            onClick={() => setAdvancedSearchOpen(true)}
          >
            Advanced
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          {hasActiveFilters() && (
            <Button
              variant='outline'
              leftSection={<IconX size={16} />}
              fullWidth
              onClick={() => {
                clearFilters();
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <Stack gap='md'>
        {tickets.map((ticket: Ticket) => (
          <Card key={ticket.id} shadow='sm' padding='lg' radius='md' withBorder>
            <Group justify='space-between' mb='sm'>
              <Group gap='sm'>
                <Badge variant='light' color='red'>
                  SLA Breached
                </Badge>
                <Text size='sm' c='dimmed'>
                  #{ticket.ticketNumber}
                </Text>
              </Group>
              <Menu shadow='md' width={200}>
                <Menu.Target>
                  <ActionIcon variant='subtle'>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEye size={14} />}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    View
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color='red'
                    onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Text
              fw={500}
              mb='xs'
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/tickets/${ticket.id}`)}
            >
              {ticket.title}
            </Text>

            <Text size='sm' c='dimmed' mb='sm' lineClamp={2}>
              {stripHtmlTags(ticket.description)}
            </Text>

            <Group justify='space-between'>
              <Group gap='md'>
                <Text size='sm'>
                  Breach:{' '}
                  {ticket.closedAt && ticket.dueDate
                    ? Math.round(
                        (new Date(ticket.closedAt).getTime() -
                          new Date(ticket.dueDate).getTime()) /
                          (1000 * 60 * 60)
                      )
                    : 0}
                  h
                </Text>
                <Text size='sm'>
                  Closed:{' '}
                  {ticket.closedAt
                    ? new Date(ticket.closedAt).toLocaleDateString('en-US')
                    : '—'}
                </Text>
                <Text size='sm'>
                  Due:{' '}
                  {ticket.dueDate
                    ? new Date(ticket.dueDate).toLocaleDateString('en-US')
                    : '—'}
                </Text>
                {ticket.assignedTo && (
                  <Group gap={4}>
                    <IconTicket size={14} />
                    <Text size='sm'>Assigned to {ticket.assignedTo.name}</Text>
                  </Group>
                )}
              </Group>
              <Badge variant='light' color='red'>
                Breached
              </Badge>
            </Group>
          </Card>
        ))}
      </Stack>

      {tickets.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Stack align='center' gap='md'>
            <Text size='lg' fw={500}>
              No breached tickets
            </Text>
            <Text c='dimmed' ta='center'>
              No tickets match your current filters.
            </Text>
          </Stack>
        </Card>
      )}

      {(pagination?.totalPages || 0) > 1 && (
        <Group justify='center' mt='xl'>
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={pagination?.totalPages || 1}
          />
        </Group>
      )}

      <AdvancedSearchModal
        opened={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        initialCriteria={{
          query: searchFilters.search || '',
          status: (searchFilters.status as string[]) || [],
          priority: (searchFilters.priority as string[]) || [],
          category: (searchFilters.category as string[]) || [],
          impact: (searchFilters.impact as string[]) || [],
          urgency: (searchFilters.urgency as string[]) || [],
          slaLevel: (searchFilters.slaLevel as string[]) || [],
          assignedTo: searchFilters.assignedTo || [],
          requester: searchFilters.requester || [],
          createdFrom: searchFilters.dateFrom || undefined,
          createdTo: searchFilters.dateTo || undefined,
          minResolutionTime: (searchFilters as { minResolutionHours?: number })
            .minResolutionHours,
          maxResolutionTime: (searchFilters as { maxResolutionHours?: number })
            .maxResolutionHours,
          minSlaBreachTime: (searchFilters as { minSlaBreachHours?: number })
            .minSlaBreachHours,
          maxSlaBreachTime: (searchFilters as { maxSlaBreachHours?: number })
            .maxSlaBreachHours,
        }}
        onSearch={advancedFilters => {
          const searchCriteria = {
            search: advancedFilters.query || '',
            status: advancedFilters.status || [],
            priority: advancedFilters.priority || [],
            category: advancedFilters.category || [],
            impact: advancedFilters.impact || [],
            urgency: advancedFilters.urgency || [],
            slaLevel: advancedFilters.slaLevel || [],
            assignedTo: advancedFilters.assignedTo || [],
            requester: advancedFilters.requester || [],
            dateFrom: advancedFilters.createdFrom || null,
            dateTo: advancedFilters.createdTo || null,
            tags: [],
            customFields: advancedFilters.customFields || {},
            minResolutionHours: advancedFilters.minResolutionTime,
            maxResolutionHours: advancedFilters.maxResolutionTime,
            minSlaBreachHours: advancedFilters.minSlaBreachTime,
            maxSlaBreachHours: advancedFilters.maxSlaBreachTime,
          };
          updateFilters(searchCriteria);
          if (advancedFilters.query) addRecentSearch(advancedFilters.query);
          setCurrentPage(1);
        }}
      />

      <SimpleFiltersModal
        opened={simpleFiltersOpen}
        onClose={() => setSimpleFiltersOpen(false)}
        initialFilters={{
          status: (searchFilters.status as string[]) || [],
          priority: (searchFilters.priority as string[]) || [],
          category: (searchFilters.category as string[]) || [],
        }}
        onApply={filters => {
          updateFilters(filters);
          setCurrentPage(1);
        }}
      />
    </Container>
  );
}

export default function SLABreachedTicketsPage() {
  return (
    <ManagerAndAdmin>
      <SLABreachedTicketsPageContent />
    </ManagerAndAdmin>
  );
}
