'use client';

// Utility function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

import { useState } from 'react';
import { StaffAndAbove } from '../../../components/guards/RouteGuard';
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
  IconTicket,
  IconX,
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
import { Ticket, TicketStatus } from '../../../types/unified';

function OverdueTicketsPageContent() {
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

  // Apply client-side overdue filtering
  let allOverdueTickets = ticketsData?.tickets || [];
  const now = new Date();
  allOverdueTickets = allOverdueTickets.filter(
    t =>
      t.dueDate &&
      new Date(t.dueDate) < now &&
      !(['RESOLVED', 'CLOSED'] as TicketStatus[]).includes(
        t.status as TicketStatus
      )
  );

  // Implement client-side pagination
  const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
  const totalOverdueTickets = allOverdueTickets.length;
  const totalPages = Math.ceil(totalOverdueTickets / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const tickets = allOverdueTickets.slice(startIndex, endIndex);

  // Create pagination object for the UI
  const pagination = {
    total: totalOverdueTickets,
    totalPages: totalPages,
    currentPage: currentPage,
    pageSize: pageSize,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'red';
      case 'HIGH':
        return 'orange';
      case 'MEDIUM':
        return 'blue';
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'blue';
      case 'IN_PROGRESS':
        return 'yellow';
      case 'PENDING':
        return 'orange';
      case 'RESOLVED':
        return 'green';
      case 'CLOSED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const calculateOverdueHours = (dueDate: string) => {
    const due = new Date(dueDate);
    const hours = (now.getTime() - due.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hours);
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>Overdue Tickets</Title>
          <Text c='dimmed' size='sm'>
            Tickets that have exceeded their SLA deadlines
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
                <Badge color={getStatusColor(ticket.status)} variant='light'>
                  {ticket.status}
                </Badge>
                <Badge
                  color={getPriorityColor(ticket.priority)}
                  variant='outline'
                >
                  {ticket.priority}
                </Badge>
                <Text size='sm' c='dimmed'>
                  {ticket.ticketNumber}
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
                <Text size='sm'>{ticket.requester?.name}</Text>
                <Text size='sm'>
                  {new Date(ticket.createdAt).toLocaleDateString('en-US')}
                </Text>
                {ticket.assignedTo && (
                  <Group gap={4}>
                    <IconTicket size={14} />
                    <Text size='sm'>Assigned to {ticket.assignedTo.name}</Text>
                  </Group>
                )}
              </Group>
              <Badge variant='light' color='gray'>
                Overdue{' '}
                {ticket.dueDate
                  ? Math.round(calculateOverdueHours(ticket.dueDate))
                  : 0}
                h
              </Badge>
            </Group>
          </Card>
        ))}
      </Stack>

      {tickets.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Stack align='center' gap='md'>
            <Text size='lg' fw={500}>
              No overdue tickets
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

export default function OverdueTicketsPage() {
  return (
    <StaffAndAbove>
      <OverdueTicketsPageContent />
    </StaffAndAbove>
  );
}
