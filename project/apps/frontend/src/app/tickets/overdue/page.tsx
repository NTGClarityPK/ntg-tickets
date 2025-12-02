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
  useMantineTheme,
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
} from '../../../hooks/useTickets';
import { useRouter } from 'next/navigation';
import { SearchBar } from '../../../components/search/SearchBar';
import { AdvancedSearchModal } from '../../../components/search/AdvancedSearchModal';
import { SimpleFiltersModal } from '../../../components/forms/SimpleFiltersModal';
import { useSearch } from '../../../hooks/useSearch';
import { PAGINATION_CONFIG } from '../../../lib/constants';
import { Ticket, TicketStatus } from '../../../types/unified';

function OverdueTicketsPageContent() {
  const theme = useMantineTheme();
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
        return theme.primaryColor;
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return theme.primaryColor;
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
    <Container size='xl' py='md' data-testid="overdue-tickets-page">
      <Group justify='space-between' mb='xl' data-testid="overdue-tickets-header">
        <div data-testid="overdue-tickets-header-content">
          <Title order={2} data-testid="overdue-tickets-title">Overdue Tickets</Title>
          <Text c='dimmed' size='sm' data-testid="overdue-tickets-subtitle">
            Tickets that have exceeded their SLA deadlines
          </Text>
          {hasActiveFilters() && (
            <Text size='sm' c={theme.colors[theme.primaryColor][6]} mt='xs' data-testid="overdue-tickets-filter-count">
              Showing {tickets.length} of {totalOverdueTickets} tickets
            </Text>
          )}
        </div>
      </Group>

      <Grid mb='md' data-testid="overdue-tickets-toolbar">
        <Grid.Col span={{ base: 12, md: 6 }} data-testid="overdue-tickets-search-col">
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
        <Grid.Col span={{ base: 6, md: 3 }} data-testid="overdue-tickets-advanced-col">
          <Button
            variant='light'
            leftSection={<IconFilter size={16} />}
            fullWidth
            onClick={() => setAdvancedSearchOpen(true)}
            data-testid="overdue-tickets-advanced-button"
          >
            Advanced
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }} data-testid="overdue-tickets-reset-col">
          {hasActiveFilters() && (
            <Button
              variant='outline'
              leftSection={<IconX size={16} />}
              fullWidth
              onClick={() => {
                clearFilters();
                setCurrentPage(1);
              }}
              data-testid="overdue-tickets-reset-filters-button"
            >
              Reset Filters
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <Stack gap='md' data-testid="overdue-tickets-list">
        {tickets.map((ticket: Ticket) => (
          <Card key={ticket.id} shadow='sm' padding='lg' radius='md' withBorder data-testid={`overdue-ticket-card-${ticket.id}`}>
            <Group justify='space-between' mb='sm' data-testid={`overdue-ticket-header-${ticket.id}`}>
              <Group gap='sm' data-testid={`overdue-ticket-badges-${ticket.id}`}>
                <Badge color={getStatusColor(ticket.status)} variant='light' data-testid={`overdue-ticket-status-badge-${ticket.id}`}>
                  {ticket.status}
                </Badge>
                <Badge
                  color={getPriorityColor(ticket.priority)}
                  variant='outline'
                  data-testid={`overdue-ticket-priority-badge-${ticket.id}`}
                >
                  {ticket.priority}
                </Badge>
                <Text size='sm' c='dimmed' data-testid={`overdue-ticket-number-${ticket.id}`}>
                  {ticket.ticketNumber}
                </Text>
              </Group>
              <Menu shadow='md' width={200} data-testid={`overdue-ticket-menu-${ticket.id}`}>
                <Menu.Target>
                  <ActionIcon variant='subtle' data-testid={`overdue-ticket-menu-button-${ticket.id}`}>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown data-testid={`overdue-ticket-menu-dropdown-${ticket.id}`}>
                  <Menu.Item
                    leftSection={<IconEye size={14} />}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                    data-testid={`overdue-ticket-view-${ticket.id}`}
                  >
                    View
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                    data-testid={`overdue-ticket-edit-${ticket.id}`}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Divider data-testid={`overdue-ticket-menu-divider-${ticket.id}`} />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color={theme.colors[theme.primaryColor][9]}
                    onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                    data-testid={`overdue-ticket-delete-${ticket.id}`}
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
              data-testid={`overdue-ticket-title-${ticket.id}`}
            >
              {ticket.title}
            </Text>

            <Text size='sm' c='dimmed' mb='sm' lineClamp={2} data-testid={`overdue-ticket-description-${ticket.id}`}>
              {stripHtmlTags(ticket.description)}
            </Text>

            <Group justify='space-between' data-testid={`overdue-ticket-footer-${ticket.id}`}>
              <Group gap='md' data-testid={`overdue-ticket-info-${ticket.id}`}>
                <Text size='sm' data-testid={`overdue-ticket-requester-${ticket.id}`}>{ticket.requester?.name}</Text>
                <Text size='sm' data-testid={`overdue-ticket-created-date-${ticket.id}`}>
                  {new Date(ticket.createdAt).toLocaleDateString('en-US')}
                </Text>
                {ticket.assignedTo && (
                  <Group gap={4} data-testid={`overdue-ticket-assigned-${ticket.id}`}>
                    <IconTicket size={14} />
                    <Text size='sm' data-testid={`overdue-ticket-assigned-name-${ticket.id}`}>Assigned to {ticket.assignedTo.name}</Text>
                  </Group>
                )}
              </Group>
              <Badge variant='light' color='gray' data-testid={`overdue-ticket-overdue-badge-${ticket.id}`}>
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
        <Card shadow='sm' padding='xl' radius='md' withBorder data-testid="overdue-tickets-empty-state">
          <Stack align='center' gap='md' data-testid="overdue-tickets-empty-state-content">
            <Text size='lg' fw={500} data-testid="overdue-tickets-empty-state-title">
              No overdue tickets
            </Text>
            <Text c='dimmed' ta='center' data-testid="overdue-tickets-empty-state-message">
              No tickets match your current filters.
            </Text>
          </Stack>
        </Card>
      )}

      {(pagination?.totalPages || 0) > 1 && (
        <Group justify='center' mt='xl' data-testid="overdue-tickets-pagination-group">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={pagination?.totalPages || 1}
            data-testid="overdue-tickets-pagination"
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
