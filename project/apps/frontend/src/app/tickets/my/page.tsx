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
  Grid,
  Card,
  Stack,
  Badge,
  ActionIcon,
  Menu,
  Loader,
  Alert,
  Pagination,
  useMantineTheme,
  Modal,
} from '@mantine/core';
import {
  IconPlus,
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
  useMyTicketsWithPagination,
  useDeleteTicket,
} from '../../../hooks/useTickets';
import { Ticket, TicketStatus, TicketPriority } from '../../../types/unified';
import { SearchBar } from '../../../components/search/SearchBar';
import { AdvancedSearchModal } from '../../../components/search/AdvancedSearchModal';
import { SimpleFiltersModal } from '../../../components/forms/SimpleFiltersModal';
import { useSearch } from '../../../hooks/useSearch';
import { PAGINATION_CONFIG } from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useCanCreateTicket } from '../../../hooks/useCanCreateTicket';
import {
  showSuccessNotification,
  showErrorNotification,
} from '../../../lib/notifications';

export default function MyTicketsPage() {
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
  const { canCreate: canCreateTicket } = useCanCreateTicket();
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [simpleFiltersOpen, setSimpleFiltersOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const deleteTicketMutation = useDeleteTicket();

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

  const searchQuery = getSearchQuery();
  
  // Check if we need client-side filtering (resolution time or SLA breach time)
  const needsClientSideFiltering =
    typeof searchFilters.minResolutionHours === 'number' ||
    typeof searchFilters.maxResolutionHours === 'number' 

  // Fetch tickets where user is either the requester OR assigned to
  const ticketsQuery = {
    ...searchQuery,
    page: needsClientSideFiltering ? 1 : currentPage,
    limit: needsClientSideFiltering
      ? 1000 // Fetch more tickets for client-side filtering
      : PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    // The backend should handle showing tickets relevant to the user
  };

  const {
    data: ticketsData,
    isLoading,
    error,
    isFetching,
  } = useMyTicketsWithPagination(ticketsQuery);

  // Get tickets from the response (already filtered by backend to show only user's tickets)
  let allMyTickets = ticketsData?.tickets || [];
  const backendPagination = ticketsData?.pagination;

  // Client-side filters for resolution time and SLA breach time (in hours)
  if (
    typeof searchFilters.minResolutionHours === 'number' ||
    typeof searchFilters.maxResolutionHours === 'number'
  ) {
    const minH = searchFilters.minResolutionHours ?? 0;
    const maxH = searchFilters.maxResolutionHours ?? Number.POSITIVE_INFINITY;
    allMyTickets = allMyTickets.filter(t => {
      // Only include CLOSED tickets when filtering by resolution time
      if (t.status !== 'CLOSED') return false;
      const hours =
        typeof t.resolutionTime === 'number' ? t.resolutionTime : undefined;
      if (typeof hours !== 'number') return false;
      return hours >= minH && hours <= maxH;
    });
  }

  // Apply client-side pagination if we did client-side filtering
  let myTickets = allMyTickets;
  let pagination = backendPagination;

  if (needsClientSideFiltering) {
    const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    const totalFilteredTickets = allMyTickets.length;
    const totalPages = Math.ceil(totalFilteredTickets / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    myTickets = allMyTickets.slice(startIndex, endIndex);

    pagination = {
      page: currentPage,
      limit: pageSize,
      total: totalFilteredTickets,
      totalPages: totalPages,
    };
  }

  const handleViewTicket = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: string) => {
    router.push(`/tickets/${ticketId}/edit`);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
      showSuccessNotification('Success', 'Ticket deleted successfully');
      setDeleteModalOpen(false);
      setSelectedTicket(null);
    } catch (error) {
      showErrorNotification('Error', 'Failed to delete ticket');
    }
  };

  if (isLoading) {
    return (
      <Container size='xl' py='md' data-testid="my-tickets-page-loading">
        <Group justify='center' mt='xl' data-testid="my-tickets-page-loading-group">
          <Loader size='lg' data-testid="my-tickets-page-loader" />
          <Text data-testid="my-tickets-page-loading-text">Loading your tickets...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md' data-testid="my-tickets-page-error">
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]} data-testid="my-tickets-page-error-alert">
          Failed to load tickets: {String(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="my-tickets-page">
      <Group justify='space-between' mb='xl' data-testid="my-tickets-page-header">
        <div data-testid="my-tickets-page-header-content">
          <Title order={1} data-testid="my-tickets-page-title">My Tickets</Title>
          <Text c='dimmed' data-testid="my-tickets-page-subtitle">Tickets created by or assigned to you</Text>
          {hasActiveFilters() && (
            <Text size='sm' c={theme.colors[theme.primaryColor][6]} mt='xs' data-testid="my-tickets-page-filter-count">
              Showing {myTickets.length} of {pagination?.total || 0} tickets
            </Text>
          )}
        </div>
        {canCreateTicket && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push('/tickets/create')}
            data-testid="my-tickets-page-create-button"
          >
            Create Ticket
          </Button>
        )}
      </Group>

      <Grid mb='md' data-testid="my-tickets-page-toolbar">
        <Grid.Col span={{ base: 12, md: 6 }} data-testid="my-tickets-page-search-col">
          <SearchBar
            key={searchFilters.search || 'empty'}
            value={searchFilters.search}
            onChange={value => {
              updateFilters({ search: value });
              if (value.trim()) {
                addRecentSearch(value);
              }
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
        <Grid.Col span={{ base: 6, md: 3 }} data-testid="my-tickets-page-advanced-col">
          <Button
            variant='light'
            leftSection={<IconFilter size={16} />}
            fullWidth
            onClick={() => setAdvancedSearchOpen(true)}
            data-testid="my-tickets-page-advanced-button"
          >
            Advanced
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }} data-testid="my-tickets-page-clear-col">
          {hasActiveFilters() && (
            <Button
              variant='outline'
              leftSection={<IconX size={16} />}
              fullWidth
              onClick={clearFilters}
              data-testid="my-tickets-page-clear-filters-button"
            >
              Clear Filters
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <Stack gap='md' data-testid="my-tickets-page-list">
        {myTickets.map((ticket: Ticket) => (
          <Card key={ticket.id} shadow='sm' padding='lg' radius='md' withBorder data-testid={`my-ticket-card-${ticket.id}`}>
            <Group justify='space-between' mb='sm' data-testid={`my-ticket-header-${ticket.id}`}>
              <Group gap='sm' data-testid={`my-ticket-badges-${ticket.id}`}>
                <Badge color={statusColors[ticket.status]} variant='light' data-testid={`my-ticket-status-badge-${ticket.id}`}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Badge
                  color={priorityColors[ticket.priority]}
                  variant='outline'
                  data-testid={`my-ticket-priority-badge-${ticket.id}`}
                >
                  {ticket.priority}
                </Badge>
                <Text size='sm' c='dimmed' data-testid={`my-ticket-number-${ticket.id}`}>
                  {ticket.ticketNumber}
                </Text>
              </Group>
              <Menu shadow='md' width={200} data-testid={`my-ticket-menu-${ticket.id}`}>
                <Menu.Target>
                  <ActionIcon variant='subtle' data-testid={`my-ticket-menu-button-${ticket.id}`}>
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown data-testid={`my-ticket-menu-dropdown-${ticket.id}`}>
                  <Menu.Item
                    leftSection={<IconEye size={14} />}
                    onClick={() => handleViewTicket(ticket.id)}
                    data-testid={`my-ticket-view-${ticket.id}`}
                  >
                    View
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => handleEditTicket(ticket.id)}
                    data-testid={`my-ticket-edit-${ticket.id}`}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Divider data-testid={`my-ticket-menu-divider-${ticket.id}`} />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color={theme.colors[theme.primaryColor][9]}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setDeleteModalOpen(true);
                    }}
                    data-testid={`my-ticket-delete-${ticket.id}`}
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
              data-testid={`my-ticket-title-${ticket.id}`}
            >
              {ticket.title}
            </Text>

            <Text size='sm' c='dimmed' mb='sm' lineClamp={2} data-testid={`my-ticket-description-${ticket.id}`}>
              {stripHtmlTags(ticket.description)}
            </Text>

            <Group justify='space-between' data-testid={`my-ticket-footer-${ticket.id}`}>
              <Group gap='md' data-testid={`my-ticket-info-${ticket.id}`}>
                <Text size='sm' data-testid={`my-ticket-requester-${ticket.id}`}>{ticket.requester.name}</Text>
                <Text size='sm' data-testid={`my-ticket-created-date-${ticket.id}`}>
                  {new Date(ticket.createdAt).toLocaleDateString('en-US')}
                </Text>
                {ticket.assignedTo && (
                  <Text size='sm' data-testid={`my-ticket-assigned-${ticket.id}`}>Assigned to {ticket.assignedTo.name}</Text>
                )}
              </Group>
              <Badge variant='light' color='gray' data-testid={`my-ticket-category-badge-${ticket.id}`}>
                {ticket.category?.customName || ticket.category?.name || 'Unknown'}
              </Badge>
            </Group>
          </Card>
        ))}
      </Stack>

      {myTickets.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder data-testid="my-tickets-page-empty-state">
          <Stack align='center' gap='md' data-testid="my-tickets-page-empty-state-content">
            <IconTicket size={48} color='var(--mantine-color-dimmed)' data-testid="my-tickets-page-empty-state-icon" />
            <Text size='lg' fw={500} data-testid="my-tickets-page-empty-state-title">
              No tickets found
            </Text>
            <Text c='dimmed' ta='center' data-testid="my-tickets-page-empty-state-message">
              No tickets match your current filters.
            </Text>
            {canCreateTicket && (
              <Button onClick={() => router.push('/tickets/create')} data-testid="my-tickets-page-empty-state-create-button">
                Create your first ticket
              </Button>
            )}
          </Stack>
        </Card>
      )}

      {(pagination?.totalPages || 0) > 1 && (
        <Group justify='center' mt='xl' data-testid="my-tickets-page-pagination-group">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={pagination?.totalPages || 1}
            data-testid="my-tickets-page-pagination"
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
          createdFrom:
            typeof searchFilters.dateFrom === 'string' && searchFilters.dateFrom
              ? new Date(searchFilters.dateFrom)
              : undefined,
          createdTo:
            typeof searchFilters.dateTo === 'string' && searchFilters.dateTo
              ? new Date(searchFilters.dateTo)
              : undefined,
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
            // Numeric hour filters
            minResolutionHours: advancedFilters.minResolutionTime,
            maxResolutionHours: advancedFilters.maxResolutionTime,
            minSlaBreachHours: advancedFilters.minSlaBreachTime,
            maxSlaBreachHours: advancedFilters.maxSlaBreachTime,
          };
          updateFilters(searchCriteria);
          if (advancedFilters.query) {
            addRecentSearch(advancedFilters.query);
          }
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

      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedTicket(null);
        }}
        title='Delete Ticket'
        centered
        data-testid="my-tickets-page-delete-modal"
      >
        <Text mb='md' data-testid="my-tickets-page-delete-modal-message">
          Are you sure you want to delete ticket #{selectedTicket?.ticketNumber}
          ? This action cannot be undone.
        </Text>
        <Group justify='flex-end' data-testid="my-tickets-page-delete-modal-actions">
          <Button
            variant='light'
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedTicket(null);
            }}
            data-testid="my-tickets-page-delete-modal-cancel-button"
          >
            Cancel
          </Button>
          <Button
            color={theme.colors[theme.primaryColor][9]}
            onClick={() => {
              if (selectedTicket?.id) {
                handleDeleteTicket(selectedTicket.id);
              }
            }}
            loading={deleteTicketMutation.isPending}
            data-testid="my-tickets-page-delete-modal-confirm-button"
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
