'use client';

// Utility function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Stack,
  Badge,
  ActionIcon,
  Menu,
  Loader,
  Alert,
  Grid,
  Pagination,
  useMantineTheme,
} from '@mantine/core';
import { StaffAndAbove } from '../../../components/guards/RouteGuard';
import {
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconTicket,
  IconFilter,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useTicketsWithPagination,
} from '../../../hooks/useTickets';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Ticket, TicketStatus, TicketPriority } from '../../../types/unified';
import { SearchBar } from '../../../components/search/SearchBar';
import { AdvancedSearchModal } from '../../../components/search/AdvancedSearchModal';
import { SimpleFiltersModal } from '../../../components/forms/SimpleFiltersModal';
import { useSearch } from '../../../hooks/useSearch';
import { PAGINATION_CONFIG } from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useCanCreateTicket } from '../../../hooks/useCanCreateTicket';

function AssignedTicketsPageContent() {
  const theme = useMantineTheme();
  const { primaryLight, primaryLighter, primaryDark, primaryDarker, primaryLightest, primaryDarkest } = useDynamicTheme();

  const statusColors: Record<TicketStatus, string> = {
    NEW: primaryLight,
    OPEN: primaryLighter,
    IN_PROGRESS: primaryLighter,
    ON_HOLD: primaryLight,
    RESOLVED: primaryLighter,
    CLOSED: primaryDark,
    REOPENED: primaryDarker,
  };

  const priorityColors: Record<TicketPriority, string> = {
    LOW: primaryLightest,
    MEDIUM: primaryLight,
    HIGH: primaryDark,
    CRITICAL: primaryDarkest,
  };
  const router = useRouter();
  const { user } = useAuthStore();
  const { canCreate: canCreateTicket } = useCanCreateTicket();
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
  const ticketsQuery = {
    ...baseQuery,
    page: currentPage,
    limit: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    assignedToId: user?.id ? [user.id] : undefined,
  };

  const {
    data: ticketsData,
    isLoading,
    error,
    isFetching,
  } = useTicketsWithPagination(ticketsQuery);


  let assignedTickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination;

  // Client-side filters for resolution time (hours)
  if (
    typeof searchFilters.minResolutionHours === 'number' ||
    typeof searchFilters.maxResolutionHours === 'number'
  ) {
    const minH = searchFilters.minResolutionHours ?? 0;
    const maxH = searchFilters.maxResolutionHours ?? Number.POSITIVE_INFINITY;
    assignedTickets = assignedTickets.filter(t => {
      if (t.status !== 'CLOSED') return false;
      const hours =
        typeof t.resolutionTime === 'number' ? t.resolutionTime : undefined;
      if (typeof hours !== 'number') return false;
      return hours >= minH && hours <= maxH;
    });
  }

  const handleViewTicket = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    router.push(`/tickets/${ticketId}/edit`);
  };

  if (isLoading) {
    return (
      <Container size='xl' py='md' data-testid="assigned-tickets-page-loading">
        <Group justify='center' mt='xl' data-testid="assigned-tickets-page-loading-group">
          <Loader size='lg' data-testid="assigned-tickets-page-loader" />
          <Text data-testid="assigned-tickets-page-loading-text">Loading assigned tickets...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md' data-testid="assigned-tickets-page-error">
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]} data-testid="assigned-tickets-page-error-alert">
          Failed to load tickets: {String(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="assigned-tickets-page">
      <Group justify='space-between' mb='xl' data-testid="assigned-tickets-page-header">
        <div data-testid="assigned-tickets-page-header-content">
          <Title order={1} data-testid="assigned-tickets-page-title">Assigned to Me</Title>
          <Text c='dimmed' data-testid="assigned-tickets-page-subtitle">Tickets assigned to you</Text>
          {hasActiveFilters() && (
            <Text size='sm' c={theme.colors[theme.primaryColor][6]} mt='xs' data-testid="assigned-tickets-page-filter-count">
              Showing {assignedTickets.length} of {pagination?.total || 0}{' '}
              tickets
            </Text>
          )}
        </div>
      </Group>

      <Grid mb='md' data-testid="assigned-tickets-page-toolbar">
        <Grid.Col span={{ base: 12, md: 6 }} data-testid="assigned-tickets-page-search-col">
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
        <Grid.Col span={{ base: 6, md: 3 }} data-testid="assigned-tickets-page-advanced-col">
          <Button
            variant='light'
            leftSection={<IconFilter size={16} />}
            fullWidth
            onClick={() => setAdvancedSearchOpen(true)}
            data-testid="assigned-tickets-page-advanced-button"
          >
            Advanced
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }} data-testid="assigned-tickets-page-reset-col">
          {hasActiveFilters() && (
            <Button
              variant='outline'
              leftSection={<IconX size={16} />}
              fullWidth
              onClick={() => {
                clearFilters();
                setCurrentPage(1);
              }}
              data-testid="assigned-tickets-page-reset-filters-button"
            >
              Reset Filters
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <Stack gap='md' data-testid="assigned-tickets-page-list">
        {assignedTickets.map((ticket: Ticket) => (
          <Card key={ticket.id} shadow='sm' padding='lg' radius='md' withBorder data-testid={`assigned-ticket-card-${ticket.id}`}>
            <Group justify='space-between' mb='sm' data-testid={`assigned-ticket-header-${ticket.id}`}>
              <Group gap='sm' data-testid={`assigned-ticket-badges-${ticket.id}`}>
                <Badge color={statusColors[ticket.status]} variant='light' data-testid={`assigned-ticket-status-badge-${ticket.id}`}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Badge
                  color={priorityColors[ticket.priority]}
                  variant='outline'
                  data-testid={`assigned-ticket-priority-badge-${ticket.id}`}
                >
                  {ticket.priority}
                </Badge>
                <Text size='sm' c='dimmed' data-testid={`assigned-ticket-number-${ticket.id}`}>
                  {ticket.ticketNumber}
                </Text>
              </Group>
              <Menu shadow='md' width={200} data-testid={`assigned-ticket-menu-${ticket.id}`}>
                <Menu.Target>
                  <ActionIcon variant='subtle' data-testid={`assigned-ticket-menu-button-${ticket.id}`}>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown data-testid={`assigned-ticket-menu-dropdown-${ticket.id}`}>
                  <Menu.Item
                    leftSection={<IconEye size={14} />}
                    onClick={() => handleViewTicket(ticket.id)}
                    data-testid={`assigned-ticket-view-${ticket.id}`}
                  >
                    View
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => handleEditTicket(ticket.id)}
                    data-testid={`assigned-ticket-edit-${ticket.id}`}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Divider data-testid={`assigned-ticket-menu-divider-${ticket.id}`} />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color={theme.colors[theme.primaryColor][9]}
                    onClick={() => handleEditTicket(ticket.id)}
                    data-testid={`assigned-ticket-delete-${ticket.id}`}
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
              onClick={() => handleViewTicket(ticket.id)}
              data-testid={`assigned-ticket-title-${ticket.id}`}
            >
              {ticket.title}
            </Text>

            <Text size='sm' c='dimmed' mb='sm' lineClamp={2} data-testid={`assigned-ticket-description-${ticket.id}`}>
              {stripHtmlTags(ticket.description)}
            </Text>

            <Group justify='space-between' data-testid={`assigned-ticket-footer-${ticket.id}`}>
              <Group gap='md' data-testid={`assigned-ticket-info-${ticket.id}`}>
                <Text size='sm' data-testid={`assigned-ticket-requester-${ticket.id}`}>{ticket.requester?.name}</Text>
                <Text size='sm' data-testid={`assigned-ticket-created-date-${ticket.id}`}>
                  {new Date(ticket.createdAt).toLocaleDateString('en-US')}
                </Text>
                {ticket.assignedTo && (
                  <Text size='sm' data-testid={`assigned-ticket-assigned-${ticket.id}`}>Assigned to {ticket.assignedTo.name}</Text>
                )}
              </Group>
              <Badge variant='light' color='gray' data-testid={`assigned-ticket-category-badge-${ticket.id}`}>
                {ticket.category?.customName || ticket.category?.name || 'Unknown'}
              </Badge>
            </Group>
          </Card>
        ))}
      </Stack>

      {assignedTickets.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder data-testid="assigned-tickets-page-empty-state">
          <Stack align='center' gap='md' data-testid="assigned-tickets-page-empty-state-content">
            <IconTicket size={48} color='var(--mantine-color-dimmed)' data-testid="assigned-tickets-page-empty-state-icon" />
            <Text size='lg' fw={500} data-testid="assigned-tickets-page-empty-state-title">
              No assigned tickets
            </Text>
            <Text c='dimmed' ta='center' data-testid="assigned-tickets-page-empty-state-message">
              No tickets match your current filters.
            </Text>
            {canCreateTicket && (
              <Button onClick={() => router.push('/tickets/create')} data-testid="assigned-tickets-page-empty-state-create-button">
                Create New Ticket
              </Button>
            )}
          </Stack>
        </Card>
      )}

      {(pagination?.totalPages || 0) > 1 && (
        <Group justify='center' mt='xl' data-testid="assigned-tickets-page-pagination-group">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={pagination?.totalPages || 1}
            data-testid="assigned-tickets-page-pagination"
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
        }}
        onSearch={advancedFilters => {
          const searchCriteria = {
            search: advancedFilters.query || '',
            status: advancedFilters.status || [],
            priority: advancedFilters.priority || [],
            category: advancedFilters.category || [],
            impact: advancedFilters.impact || [],
            assignedTo: advancedFilters.assignedTo || [],
            requester: advancedFilters.requester || [],
            dateFrom: advancedFilters.createdFrom || null,
            dateTo: advancedFilters.createdTo || null,
            tags: [],
            customFields: advancedFilters.customFields || {},
            minResolutionHours: advancedFilters.minResolutionTime,
            maxResolutionHours: advancedFilters.maxResolutionTime,
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

export default function AssignedTicketsPage() {
  return (
    <StaffAndAbove>
      <AssignedTicketsPageContent />
    </StaffAndAbove>
  );
}
