import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ticketApi,
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
} from '../lib/apiClient';
import { QUERY_CONFIG, PAGINATION_CONFIG } from '../lib/constants';
import { useAuthActiveRole } from '../stores/useAuthStore';
import {
  normalizeItemResponse,
  normalizeListResponse,
} from '../services/api/response-normalizer';

// Type for error with response property
interface ErrorWithResponse extends Error {
  response?: {
    status?: number;
    data?: unknown;
  };
}

// Type for ticket not found error
interface TicketNotFoundError extends Error {
  status: number;
  isNotFound: boolean;
}

export function useTickets(filters?: TicketFilters) {
  const activeRole = useAuthActiveRole();
  
  return useQuery<Ticket[]>({
    queryKey: ['tickets', filters, activeRole],
    queryFn: async (): Promise<Ticket[]> => {
      const response = await ticketApi.getTickets(filters);
      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
  });
}

// Hook to get all tickets for counting (no pagination)
export function useAllTicketsForCounting(filters?: TicketFilters) {
  return useQuery<Ticket[]>({
    queryKey: ['all-tickets-counting', filters],
    queryFn: async (): Promise<Ticket[]> => {
      // Remove pagination parameters and set high limit to get all tickets
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { page, limit, ...countFilters } = filters || {};
      const response = await ticketApi.getTickets({
        ...countFilters,
        limit: 10000, // Set a very high limit to get all tickets
      });

      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT, // Use shorter stale time for counting queries
  });
}

// Hook to get total count of all tickets (no filters, no pagination)
export function useTotalTicketsCount() {
  return useQuery<number>({
    queryKey: ['total-tickets-count'],
    queryFn: async (): Promise<number> => {
      // Get all tickets without any filters or pagination
      const response = await ticketApi.getTickets({ limit: 1 }); // Just get 1 to get the total count
      const { pagination } = normalizeListResponse<Ticket>(response.data);

      if (pagination?.total) {
        return pagination.total;
      }

      return 0;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT, // Use shorter stale time for total count
  });
}

// New hook for backend pagination
export function useTicketsWithPagination(filters?: TicketFilters) {
  const activeRole = useAuthActiveRole();
  
  return useQuery<{
    tickets: Ticket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ['tickets-with-pagination', filters, activeRole],
    queryFn: async () => {
      const response = await ticketApi.getTickets(filters);
      const { items, pagination } = normalizeListResponse<Ticket>(response.data);

      return {
        tickets: items,
        pagination: pagination ?? {
          page: 1,
          limit: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: QUERY_CONFIG.STALE_TIME.LONG, // increased for better performance
    gcTime: QUERY_CONFIG.GC_TIME.SHORT,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error instanceof Error) {
        return true;
      }
      return false;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      try {
        const response = await ticketApi.getTicket(id);
        const ticket = normalizeItemResponse<Ticket>(response.data);

        if (!ticket) {
          throw new Error('Ticket response payload is malformed.');
        }

        return ticket;
      } catch (error: unknown) {
        // Check if it's a 404 error (ticket not found)
        const errorWithResponse = error as ErrorWithResponse;
        if (errorWithResponse?.response?.status === 404) {
          const notFoundError = new Error('TICKET_NOT_FOUND') as TicketNotFoundError;
          notFoundError.status = 404;
          notFoundError.isNotFound = true;
          throw notFoundError;
        }
        throw error;
      }
    },
    enabled: !!id,
    // Always refetch when navigating to detail page to ensure fresh data
    // This prevents using stale cached data from the list view
    refetchOnMount: 'always',
    staleTime: 0, // Always consider data stale to force fresh fetch
    // Keep a short cache time for quick navigation back/forth
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketInput) => {
      const response = await ticketApi.createTicket(data);
      const ticket = normalizeItemResponse<Ticket>(response.data);

      if (!ticket) {
        throw new Error('Ticket creation response payload is malformed.');
      }

      return ticket;
    },
    onSuccess: () => {
      // Invalidate all ticket-related queries to ensure UI updates
      // Use a small delay to ensure backend has processed the new ticket
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({
          queryKey: ['tickets-with-pagination'],
        });
        queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] });
        queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] });
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        queryClient.invalidateQueries({ queryKey: ['assigned-tickets'] });
        queryClient.invalidateQueries({ queryKey: ['overdue-tickets'] });
        queryClient.invalidateQueries({
          queryKey: ['tickets-approaching-sla'],
        });
        queryClient.invalidateQueries({ queryKey: ['breached-sla-tickets'] });
      }, 100); // 100ms delay to ensure backend processing
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTicketInput;
    }) => {
      const response = await ticketApi.updateTicket(id, data);
      const ticket = normalizeItemResponse<Ticket>(response.data);

      if (!ticket) {
        throw new Error('Ticket update response payload is malformed.');
      }

      return ticket;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await ticketApi.deleteTicket(id);
    },
    onSuccess: (_, id) => {
      // Invalidate all ticket-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets-with-pagination'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets-with-pagination'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-approaching-sla'] });
      queryClient.invalidateQueries({ queryKey: ['breached-sla-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] });
      queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] });
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      assignedToId,
    }: {
      id: string;
      assignedToId: string;
    }) => {
      const response = await ticketApi.assignTicket(id, assignedToId);
      const ticket = normalizeItemResponse<Ticket>(response.data);

      if (!ticket) {
        throw new Error('Ticket assignment response payload is malformed.');
      }

      return ticket;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      resolution,
      comment,
    }: {
      id: string;
      status: string;
      resolution?: string;
      comment?: string;
      currentStatus?: string;
      userRole?: string;
    }) => {
      // Note: Status transition validation is now handled by the workflow system
      // The frontend checks workflow permissions before allowing transitions
      
      const response = await ticketApi.updateStatus(id, status, resolution, comment);
      const ticket = normalizeItemResponse<Ticket>(response.data);

      if (!ticket) {
        throw new Error('Ticket status update response payload is malformed.');
      }

      return ticket;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}

export function useMyTickets(filters?: TicketFilters) {
  const activeRole = useAuthActiveRole();
  
  return useQuery<Ticket[]>({
    queryKey: ['my-tickets', filters, activeRole],
    queryFn: async () => {
      const response = await ticketApi.getMyTickets(filters);
      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
    enabled: !!activeRole, // Only run query when user has an active role
  });
}

// Hook for paginated MyTickets (tickets created by or assigned to the current user)
export function useMyTicketsWithPagination(filters?: TicketFilters) {
  const activeRole = useAuthActiveRole();
  
  return useQuery<{
    tickets: Ticket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ['my-tickets-with-pagination', filters, activeRole],
    queryFn: async () => {
      const response = await ticketApi.getMyTickets(filters);
      const { items, pagination } = normalizeListResponse<Ticket>(response.data);

      return {
        tickets: items,
        pagination: pagination ?? {
          page: 1,
          limit: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: QUERY_CONFIG.STALE_TIME.LONG,
    gcTime: QUERY_CONFIG.GC_TIME.SHORT,
    refetchOnWindowFocus: false,
    enabled: !!activeRole, // Only run query when user has an active role
    retry: (failureCount, error) => {
      if (failureCount < 3 && error instanceof Error) {
        return true;
      }
      return false;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAssignedTickets(filters?: TicketFilters) {
  const activeRole = useAuthActiveRole();
  
  return useQuery<Ticket[]>({
    queryKey: ['assigned-tickets', filters, activeRole],
    queryFn: async () => {
      const response = await ticketApi.getAssignedTickets(filters);
      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
    enabled: !!activeRole, // Only run query when user has an active role
  });
}

export function useOverdueTickets() {
  return useQuery<Ticket[]>({
    queryKey: ['overdue-tickets'],
    queryFn: async () => {
      const response = await ticketApi.getOverdueTickets();
      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT,
    refetchInterval: QUERY_CONFIG.REFETCH_INTERVALS.SLOW,
  });
}

export function useTicketsApproachingSLA() {
  return useQuery<Ticket[]>({
    queryKey: ['tickets-approaching-sla'],
    queryFn: async () => {
      const response = await ticketApi.getTicketsApproachingSLA();
      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT,
    refetchInterval: QUERY_CONFIG.REFETCH_INTERVALS.SLOW,
  });
}

export function useBreachedSLATickets() {
  return useQuery<Ticket[]>({
    queryKey: ['breached-sla-tickets'],
    queryFn: async () => {
      const response = await ticketApi.getBreachedSLATickets();
      const { items } = normalizeListResponse<Ticket>(response.data);
      return items;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT,
    refetchInterval: QUERY_CONFIG.REFETCH_INTERVALS.SLOW,
  });
}
