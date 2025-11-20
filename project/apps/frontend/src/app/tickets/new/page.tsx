'use client';

import React, { useState } from 'react';

// Utility function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// import { useTranslations } from 'next-intl'; // Removed unused import
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Grid,
  Card,
  Badge,
  Stack,
  Pagination,
  Loader,
  Alert,
  ActionIcon,
  Menu,
  Modal,
  useMantineTheme,
} from '@mantine/core';
import {
  IconFilter,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconTicket,
  IconCalendar,
  IconUser,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react';
import {
  useTicketsWithPagination,
  useTotalTicketsCount,
  useDeleteTicket,
} from '../../../hooks/useTickets';
import { useAuthStore } from '../../../stores/useAuthStore';
import {
  TicketStatus,
  TicketPriority,
  Ticket,
  TicketFilters,
} from '../../../types/unified';
import { useRouter } from 'next/navigation';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@/lib/notifications';
import { AdvancedSearchModal } from '../../../components/search/AdvancedSearchModal';
import { SimpleFiltersModal } from '../../../components/forms/SimpleFiltersModal';
import { SearchBar } from '../../../components/search/SearchBar';
import { useSearch } from '../../../hooks/useSearch';
import { BulkActionsBar } from '../../../components/bulk/BulkActionsBar';
import { BulkSelectCheckbox } from '../../../components/bulk/BulkSelectCheckbox';
import { useBulkOperations } from '../../../hooks/useBulkOperations';
import { PAGINATION_CONFIG } from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function NewTicketsPage() {
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
  // const t = useTranslations('tickets'); // Removed unused variable
  const router = useRouter();
  const {} = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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

  const {
    selectedTickets,
    toggleTicket,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
    bulkUpdate,
    isProcessing,
  } = useBulkOperations();

  const searchQuery = getSearchQuery() as TicketFilters;

  // Check if we need client-side filtering (resolution time or SLA breach time)
  const needsClientSideFiltering =
    typeof searchFilters.minResolutionHours === 'number' ||
    typeof searchFilters.maxResolutionHours === 'number' ||
    typeof searchFilters.minSlaBreachHours === 'number' ||
    typeof searchFilters.maxSlaBreachHours === 'number';

  const ticketsQuery = {
    ...searchQuery,
    status: ['NEW'] as TicketStatus[], // Only show NEW tickets
    page: needsClientSideFiltering ? 1 : currentPage,
    limit: needsClientSideFiltering
      ? 1000
      : PAGINATION_CONFIG.DEFAULT_PAGE_SIZE, // Fetch more tickets for client-side filtering
  };

  // Reset to page 1 when search filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery.search]);

  // Clear selection when switching pages
  React.useEffect(() => {
    clearSelection();
  }, [currentPage, clearSelection]);

  const {
    data: ticketsData,
    isLoading,
    error,
    isFetching,
  } = useTicketsWithPagination(ticketsQuery);

  // Get total count of new tickets only
  const { data: totalTicketsCount } = useTotalTicketsCount();

  // Extract tickets and pagination from the response
  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination;

  const deleteTicketMutation = useDeleteTicket();

  // Custom clear filters function that also resets modal state
  const handleClearFilters = () => {
    clearFilters();
    // Close any open modals so they reopen with cleared state
    setAdvancedSearchOpen(false);
    setSimpleFiltersOpen(false);
  };

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
    } catch (error) {
      showErrorNotification('Error', 'Failed to delete ticket');
    }
  };

  // Backend handles most filtering and pagination, but we need client-side filtering for resolution time and SLA breach time
  let allFilteredTickets = tickets;

  // Client-side filters for resolution time (in hours)
  if (
    typeof searchFilters.minResolutionHours === 'number' ||
    typeof searchFilters.maxResolutionHours === 'number'
  ) {
    const minH = searchFilters.minResolutionHours ?? 0;
    const maxH = searchFilters.maxResolutionHours ?? Number.POSITIVE_INFINITY;
    allFilteredTickets = allFilteredTickets.filter(t => {
      // Only include CLOSED tickets when filtering by resolution time
      if (t.status !== 'CLOSED') return false;
      const hours =
        typeof t.resolutionTime === 'number' ? t.resolutionTime : undefined;
      if (typeof hours !== 'number') return false;
      return hours >= minH && hours <= maxH;
    });
  }

  // Client-side filters for SLA breach time (in hours)
  if (
    typeof searchFilters.minSlaBreachHours === 'number' ||
    typeof searchFilters.maxSlaBreachHours === 'number'
  ) {
    const minB = searchFilters.minSlaBreachHours ?? 0;
    const maxB = searchFilters.maxSlaBreachHours ?? Number.POSITIVE_INFINITY;
    allFilteredTickets = allFilteredTickets.filter(t => {
      // Only include CLOSED tickets when filtering by SLA breach time
      if (t.status !== 'CLOSED') return false;
      if (!t.closedAt || !t.dueDate) return false;
      const breachHours =
        (new Date(t.closedAt).getTime() - new Date(t.dueDate).getTime()) /
        (1000 * 60 * 60);
      return breachHours >= minB && breachHours <= maxB;
    });
  }

  // Apply client-side pagination if we did client-side filtering
  let filteredTickets = allFilteredTickets;
  let clientSidePagination = null;

  if (needsClientSideFiltering) {
    const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    const totalFilteredTickets = allFilteredTickets.length;
    const totalPages = Math.ceil(totalFilteredTickets / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    filteredTickets = allFilteredTickets.slice(startIndex, endIndex);

    clientSidePagination = {
      page: currentPage,
      limit: pageSize,
      total: totalFilteredTickets,
      totalPages: totalPages,
    };
  }

  if (isLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading new tickets...</Text>
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]}>
          Failed to load new tickets: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={1}>New Tickets</Title>
          <Text c='dimmed'>
            Tickets requiring assignment or initial attention
          </Text>
          {hasActiveFilters() && (
            <Text size='sm' c={theme.colors[theme.primaryColor][6]} mt='xs'>
              Showing {filteredTickets.length} of{' '}
              {needsClientSideFiltering
                ? allFilteredTickets.length
                : totalTicketsCount || 0}{' '}
              new tickets
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
              if (value.trim()) {
                addRecentSearch(value);
              }
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
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <BulkActionsBar
        selectedTickets={selectedTickets}
        onClearSelection={clearSelection}
        onBulkUpdate={bulkUpdate}
        totalTickets={totalTicketsCount || 0}
        isProcessing={isProcessing}
        selectedTicketsData={filteredTickets
          .filter(ticket => selectedTickets.includes(ticket.id))
          .map(ticket => ({
            id: ticket.id,
            status: ticket.status as TicketStatus,
            ticketNumber: ticket.ticketNumber,
          }))}
      />

      {filteredTickets.length > 0 && (
        <Group mb='md'>
          <BulkSelectCheckbox
            checked={isAllSelected(filteredTickets.map((t: Ticket) => t.id))}
            indeterminate={isIndeterminate(
              filteredTickets.map((t: Ticket) => t.id)
            )}
            onChange={checked => {
              if (checked) {
                selectAll(filteredTickets.map((t: Ticket) => t.id));
              } else {
                clearSelection();
              }
            }}
            aria-label='Select all tickets'
          />
          <Text size='sm' c='dimmed'>
            Select all tickets
          </Text>
        </Group>
      )}

      <Stack gap='md'>
        {filteredTickets.map((ticket: Ticket) => (
          <Card key={ticket.id} shadow='sm' padding='lg' radius='md' withBorder>
            <Group justify='space-between' mb='sm'>
              <Group gap='sm'>
                <BulkSelectCheckbox
                  checked={isSelected(ticket.id)}
                  onChange={() => toggleTicket(ticket.id)}
                  aria-label={`Select ticket ${ticket.ticketNumber}`}
                />
                <Badge
                  color={statusColors[ticket.status as TicketStatus]}
                  variant='light'
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Badge
                  color={priorityColors[ticket.priority as TicketPriority]}
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
                    onClick={() => handleViewTicket(ticket.id)}
                  >
                    View
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => handleEditTicket(ticket.id)}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color={theme.colors[theme.primaryColor][9]}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setDeleteModalOpen(true);
                    }}
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
            >
              {ticket.title}
            </Text>

            <Text size='sm' c='dimmed' mb='sm' lineClamp={2}>
              {stripHtmlTags(ticket.description)}
            </Text>

            <Group justify='space-between'>
              <Group gap='md'>
                <Group gap={4}>
                  <IconUser size={14} />
                  <Text size='sm'>{ticket.requester.name}</Text>
                </Group>
                <Group gap={4}>
                  <IconCalendar size={14} />
                  <Text size='sm'>
                    {new Date(ticket.createdAt).toLocaleDateString('en-US')}
                  </Text>
                </Group>
                {ticket.assignedTo && (
                  <Group gap={4}>
                    <IconTicket size={14} />
                    <Text size='sm'>Assigned to {ticket.assignedTo.name}</Text>
                  </Group>
                )}
              </Group>
              <Badge variant='light' color='gray'>
                {ticket.category?.customName || ticket.category?.name || 'Unknown'}
              </Badge>
            </Group>
          </Card>
        ))}
      </Stack>

      {filteredTickets.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Stack align='center' gap='md'>
            <IconTicket size={48} color='var(--mantine-color-dimmed)' />
            <Text size='lg' fw={500}>
              No new tickets found
            </Text>
            <Text c='dimmed' ta='center'>
              No NEW tickets match your current filters.
            </Text>
          </Stack>
        </Card>
      )}

      {(clientSidePagination?.totalPages || pagination?.totalPages || 0) >
        1 && (
        <Group justify='center' mt='xl'>
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={
              clientSidePagination?.totalPages || pagination?.totalPages || 1
            }
          />
        </Group>
      )}

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete Ticket'
        centered
      >
        <Text mb='md'>
          Are you sure you want to delete ticket #{selectedTicket?.ticketNumber}
          ? This action cannot be undone.
        </Text>
        <Group justify='flex-end'>
          <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            color={theme.colors[theme.primaryColor][9]}
            onClick={() =>
              selectedTicket?.id && handleDeleteTicket(selectedTicket.id)
            }
          >
            Delete
          </Button>
        </Group>
      </Modal>

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
          // Map AdvancedSearchCriteria to SearchCriteria format
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
            minResolutionHours: advancedFilters.minResolutionTime,
            maxResolutionHours: advancedFilters.maxResolutionTime,
            minSlaBreachHours: advancedFilters.minSlaBreachTime,
            maxSlaBreachHours: advancedFilters.maxSlaBreachTime,
            tags: [],
            customFields: advancedFilters.customFields || {},
          };
          updateFilters(searchCriteria);
          if (advancedFilters.query) {
            addRecentSearch(advancedFilters.query);
          }
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
        }}
      />
    </Container>
  );
}
