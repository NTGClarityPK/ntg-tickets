import { Ticket, TicketStatus, TicketPriority, SearchCriteria as SearchFilters, BulkUpdateData } from '../../../types/unified';

export interface TicketsListMetrics {
  tickets: Ticket[];
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  needsClientSideFiltering: boolean;
}

export interface TicketsListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketsListState {
  currentPage: number;
  selectedTicket: Ticket | null;
  deleteModalOpen: boolean;
  advancedSearchOpen: boolean;
  simpleFiltersOpen: boolean;
}

export interface TicketsListColors {
  statusColors: Record<TicketStatus, string>;
  priorityColors: Record<TicketPriority, string>;
}

export interface TicketsListHandlers {
  onViewTicket: (ticketId: string) => void;
  onEditTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onAdvancedSearchOpen: () => void;
  onSimpleFiltersOpen: () => void;
  onDeleteModalClose: () => void;
}

export interface TicketsListSearch {
  searchQuery: string;
  recentSearches: string[];
  onSearchChange: (value: string) => void;
  onAdvancedSearch: () => void;
  onSimpleFilters: () => void;
  onRecentSearchClick: (search: string) => void;
  onClearRecentSearches: () => void;
  onRemoveRecentSearch: (search: string) => void;
  isLoading: boolean;
}

export interface TicketsListBulk {
  selectedTickets: string[];
  onToggleTicket: (ticketId: string) => void;
  onSelectAll: (ticketIds: string[]) => void;
  onClearSelection: () => void;
  isSelected: (ticketId: string) => boolean;
  isAllSelected: (ticketIds: string[]) => boolean;
  isIndeterminate: (ticketIds: string[]) => boolean;
  onBulkUpdate: (action: string, data: BulkUpdateData) => Promise<void>;
  isProcessing: boolean;
  selectedTicketsData: Array<{
    id: string;
    status: TicketStatus;
    ticketNumber: string;
  }>;
}

export interface TicketsListPresenterProps {
  metrics: TicketsListMetrics;
  pagination: TicketsListPagination | null;
  state: TicketsListState;
  colors: TicketsListColors;
  handlers: TicketsListHandlers;
  search: TicketsListSearch;
  bulk: TicketsListBulk;
  searchFilters: SearchFilters;
  onSetSelectedTicket: (ticket: Ticket | null) => void;
  onUpdateFilters: (filters: Partial<SearchFilters> | Record<string, unknown>) => void;
  onAddRecentSearch: (search: string) => void;
  onCloseAdvancedSearch: () => void;
  onCloseSimpleFilters: () => void;
}

