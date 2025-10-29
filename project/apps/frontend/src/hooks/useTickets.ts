import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ticketApi,
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
} from '../lib/apiClient';
import { QUERY_CONFIG, PAGINATION_CONFIG } from '../lib/constants';
import { useAuthStore } from '../stores/useAuthStore';

export function useTickets(filters?: TicketFilters) {
  const { user } = useAuthStore();
  
  return useQuery<Ticket[]>({
    queryKey: ['tickets', filters, user?.activeRole],
    queryFn: async (): Promise<Ticket[]> => {
      try {
        const response = await ticketApi.getTickets(filters);
        // From chat history: response.data.data.data works for showing tickets
        if (
          response.data?.data?.data &&
          Array.isArray(response.data.data.data)
        ) {
          return response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else {
          return [];
        }
      } catch (error) {
        throw error;
      }
    },
    staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
  });
}

// Hook to get all tickets for counting (no pagination)
export function useAllTicketsForCounting(filters?: TicketFilters) {
  return useQuery<Ticket[]>({
    queryKey: ['all-tickets-counting', filters],
    queryFn: async (): Promise<Ticket[]> => {
      try {
        // Remove pagination parameters and set high limit to get all tickets
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { page, limit, ...countFilters } = filters || {};
        const response = await ticketApi.getTickets({
          ...countFilters,
          limit: 10000, // Set a very high limit to get all tickets
        });

        // Extract tickets from response
        let tickets: Ticket[] = [];
        if (
          response.data?.data?.data &&
          Array.isArray(response.data.data.data)
        ) {
          tickets = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          tickets = response.data.data;
        } else {
          tickets = [];
        }

        return tickets;
      } catch (error) {
        throw error;
      }
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT, // Use shorter stale time for counting queries
  });
}

// Hook to get total count of all tickets (no filters, no pagination)
export function useTotalTicketsCount() {
  return useQuery<number>({
    queryKey: ['total-tickets-count'],
    queryFn: async (): Promise<number> => {
      try {
        // Get all tickets without any filters or pagination
        const response = await ticketApi.getTickets({ limit: 1 }); // Just get 1 to get the total count

        // Extract total count from pagination
        if (response.data?.data?.pagination?.total) {
          return response.data.data.pagination.total;
        } else if (response.data?.pagination?.total) {
          return response.data.pagination.total;
        } else {
          return 0;
        }
      } catch (error) {
        throw error;
      }
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT, // Use shorter stale time for total count
  });
}

// New hook for backend pagination
export function useTicketsWithPagination(filters?: TicketFilters) {
  const { user } = useAuthStore();
  
  return useQuery<{
    tickets: Ticket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ['tickets-with-pagination', filters, user?.activeRole],
    queryFn: async () => {
      try {
        const response = await ticketApi.getTickets(filters);

        // Backend returns: { data: Ticket[], pagination: {...} }
        if (
          response.data?.data?.data &&
          Array.isArray(response.data.data.data) &&
          response.data.data.pagination
        ) {
          return {
            tickets: response.data.data.data,
            pagination: response.data.data.pagination,
          };
        } else if (
          response.data?.data &&
          Array.isArray(response.data.data) &&
          response.data.pagination
        ) {
          return {
            tickets: response.data.data,
            pagination: response.data.pagination,
          };
        } else {
          return {
            tickets: [],
            pagination: {
              page: 1,
              limit: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
              total: 0,
              totalPages: 0,
            },
          };
        }
      } catch (error) {
        throw error;
      }
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
      const response = await ticketApi.getTicket(id);
      return response.data.data as Ticket;
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketInput) => {
      const response = await ticketApi.createTicket(data);
      return response.data.data as Ticket;
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
      return response.data.data as Ticket;
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
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
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
      return response.data.data as Ticket;
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
      return response.data.data as Ticket;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}

export function useMyTickets(filters?: TicketFilters) {
  const { user } = useAuthStore();
  
  return useQuery<Ticket[]>({
    queryKey: ['my-tickets', filters, user?.activeRole],
    queryFn: async () => {
      const response = await ticketApi.getMyTickets(filters);
      return response.data.data.data;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
    enabled: !!user?.activeRole, // Only run query when user has an active role
  });
}

export function useAssignedTickets(filters?: TicketFilters) {
  const { user } = useAuthStore();
  
  return useQuery<Ticket[]>({
    queryKey: ['assigned-tickets', filters, user?.activeRole],
    queryFn: async () => {
      const response = await ticketApi.getAssignedTickets(filters);
      return response.data.data.data;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
    enabled: !!user?.activeRole, // Only run query when user has an active role
  });
}

export function useOverdueTickets() {
  return useQuery<Ticket[]>({
    queryKey: ['overdue-tickets'],
    queryFn: async () => {
      const response = await ticketApi.getOverdueTickets();
      return response.data.data;
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
      return response.data.data;
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
      return response.data.data;
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT,
    refetchInterval: QUERY_CONFIG.REFETCH_INTERVALS.SLOW,
  });
}
