'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Container, Alert, useMantineTheme } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import {
  useTicketsWithPagination,
  useDeleteTicket,
} from '../../../hooks/useTickets';
import { useSearch } from '../../../hooks/useSearch';
import { useBulkOperations } from '../../../hooks/useBulkOperations';
import { PAGINATION_CONFIG } from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { Ticket, TicketStatus, TicketFilters } from '../../../types/unified';
import { TicketsListPresenter } from '../presenters/TicketsListPresenter';
import {
  TicketsListMetrics,
  TicketsListPagination,
  TicketsListState,
  TicketsListColors,
  TicketsListHandlers,
  TicketsListSearch,
  TicketsListBulk,
} from '../types/tickets.types';

export function TicketsListContainer() {
  const theme = useMantineTheme();
  const router = useRouter();
  const {
    primaryLight,
    primaryLighter,
    primaryDark,
    primaryDarker,
    primaryLightest,
    primaryDarkest,
  } = useDynamicTheme();

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
    typeof searchFilters.maxResolutionHours === 'number';

  const ticketsQuery = {
    ...searchQuery,
    page: needsClientSideFiltering ? 1 : currentPage,
    limit: needsClientSideFiltering
      ? 1000
      : PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
  };

  // Reset to page 1 when search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery.search]);

  // Clear selection when switching pages
  useEffect(() => {
    clearSelection();
  }, [currentPage, clearSelection]);

  const {
    data: ticketsData,
    isLoading,
    error,
    isFetching,
  } = useTicketsWithPagination(ticketsQuery);

  const deleteTicketMutation = useDeleteTicket();

  // Extract tickets and pagination from the response
  const tickets = useMemo(() => ticketsData?.tickets || [], [ticketsData?.tickets]);
  const pagination = ticketsData?.pagination;

  // Custom clear filters function that also resets modal state
  const handleClearFilters = () => {
    clearFilters();
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
      setSelectedTicket(null);
    } catch (error) {
      showErrorNotification('Error', 'Failed to delete ticket');
    }
  };

  // Client-side filtering logic
  const { filteredTickets, clientSidePagination } = useMemo(() => {
    let allFilteredTickets = tickets;

    // Client-side filters for resolution time (in hours)
    if (
      typeof searchFilters.minResolutionHours === 'number' ||
      typeof searchFilters.maxResolutionHours === 'number'
    ) {
      const minH = searchFilters.minResolutionHours ?? 0;
      const maxH = searchFilters.maxResolutionHours ?? Number.POSITIVE_INFINITY;
      allFilteredTickets = allFilteredTickets.filter(t => {
        if (t.status !== 'CLOSED') return false;
        const hours =
          typeof t.resolutionTime === 'number' ? t.resolutionTime : undefined;
        if (typeof hours !== 'number') return false;
        return hours >= minH && hours <= maxH;
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

    return { filteredTickets, clientSidePagination };
  }, [
    tickets,
    searchFilters,
    needsClientSideFiltering,
    currentPage,
  ]);

  const metrics: TicketsListMetrics = {
    tickets: filteredTickets,
    totalCount: clientSidePagination?.total || pagination?.total || 0,
    filteredCount: filteredTickets.length,
    hasActiveFilters: !!hasActiveFilters(),
    needsClientSideFiltering,
  };

  const paginationData: TicketsListPagination | null =
    clientSidePagination || pagination
      ? {
          page: currentPage,
          limit: clientSidePagination?.limit || pagination?.limit || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
          total: clientSidePagination?.total || pagination?.total || 0,
          totalPages: clientSidePagination?.totalPages || pagination?.totalPages || 1,
        }
      : null;

  const state: TicketsListState = {
    currentPage,
    selectedTicket,
    deleteModalOpen,
    advancedSearchOpen,
    simpleFiltersOpen,
  };

  const colors: TicketsListColors = {
    statusColors: {
      NEW: primaryLight,
      OPEN: primaryLighter,
      IN_PROGRESS: primaryLighter,
      ON_HOLD: primaryLight,
      RESOLVED: primaryLighter,
      CLOSED: primaryDark,
      REOPENED: primaryDarker,
    },
    priorityColors: {
      LOW: primaryLightest,
      MEDIUM: primaryLight,
      HIGH: primaryDark,
      CRITICAL: primaryDarkest,
    },
  };

  const handlers: TicketsListHandlers = {
    onViewTicket: handleViewTicket,
    onEditTicket: handleEditTicket,
    onDeleteTicket: handleDeleteTicket,
    onPageChange: setCurrentPage,
    onClearFilters: handleClearFilters,
    onAdvancedSearchOpen: () => setAdvancedSearchOpen(true),
    onSimpleFiltersOpen: () => setSimpleFiltersOpen(true),
    onDeleteModalClose: () => setDeleteModalOpen(false),
  };

  const search: TicketsListSearch = {
    searchQuery: searchFilters.search || '',
    recentSearches,
    onSearchChange: (value: string) => {
      updateFilters({ search: value });
      if (value.trim()) {
        addRecentSearch(value);
      }
    },
    onAdvancedSearch: () => setAdvancedSearchOpen(true),
    onSimpleFilters: () => setSimpleFiltersOpen(true),
    onRecentSearchClick: addRecentSearch,
    onClearRecentSearches: clearRecentSearches,
    onRemoveRecentSearch: removeRecentSearch,
    isLoading: isFetching,
  };

  const bulk: TicketsListBulk = {
    selectedTickets,
    onToggleTicket: toggleTicket,
    onSelectAll: selectAll,
    onClearSelection: clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
    onBulkUpdate: bulkUpdate,
    isProcessing,
    selectedTicketsData: filteredTickets
      .filter(ticket => selectedTickets.includes(ticket.id))
      .map(ticket => ({
        id: ticket.id,
        status: ticket.status as TicketStatus,
        ticketNumber: ticket.ticketNumber,
      })),
  };


  if (error) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]}>
          Failed to load tickets: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <TicketsListPresenter
      metrics={metrics}
      pagination={paginationData}
      state={state}
      colors={colors}
      handlers={handlers}
      search={search}
      bulk={bulk}
      searchFilters={searchFilters}
      isLoading={isLoading}
      onSetSelectedTicket={(ticket) => {
        setSelectedTicket(ticket);
        setDeleteModalOpen(true);
      }}
      onUpdateFilters={updateFilters}
      onAddRecentSearch={addRecentSearch}
      onCloseAdvancedSearch={() => setAdvancedSearchOpen(false)}
      onCloseSimpleFilters={() => setSimpleFiltersOpen(false)}
    />
  );
}

