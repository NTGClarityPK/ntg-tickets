import { create } from 'zustand';
import { Ticket, TicketFilters } from '../types/unified';

interface TicketState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
  error: string | null;
  setTickets: (tickets: Ticket[]) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setFilters: (filters: Partial<TicketFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  removeTicket: (id: string) => void;
  getMyTickets: (userId: string) => Ticket[];
  getAssignedTickets: (userId: string) => Ticket[];
  getOverdueTickets: () => Ticket[];
}

export const useTicketsStore = create<TicketState>((set, get) => ({
  tickets: [],
  selectedTicket: null,
  filters: {
    status: [],
    priority: [],
    category: [],
    assignedTo: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    search: '',
  },
  isLoading: false,
  error: null,
  setTickets: tickets =>
    set(state => {
      // If this is the initial load (empty store), just set the tickets
      if (state.tickets.length === 0) {
        return { tickets };
      }

      // For subsequent updates, merge intelligently to avoid duplicates
      const existingIds = new Set(state.tickets.map(t => t.id));
      const newTickets = tickets.filter(t => !existingIds.has(t.id));

      // If no new tickets, just return current state to avoid unnecessary updates
      if (newTickets.length === 0) {
        return state;
      }

      // Merge new tickets with existing ones, but prioritize existing tickets for updates
      const mergedTickets = [...newTickets, ...state.tickets];

      return { tickets: mergedTickets };
    }),
  setSelectedTicket: selectedTicket => set({ selectedTicket }),
  setFilters: filters =>
    set(state => ({ filters: { ...state.filters, ...filters } })),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
  addTicket: ticket =>
    set(state => {
      // Check if ticket already exists to prevent duplicates
      const existingTicket = state.tickets.find(t => t.id === ticket.id);
      if (existingTicket) {
        return state; // Don't add duplicate
      }
      return { tickets: [ticket, ...state.tickets] };
    }),
  updateTicket: (id, updates) =>
    set(state => ({
      tickets: state.tickets.map(ticket =>
        ticket.id === id ? { ...ticket, ...updates } : ticket
      ),
      selectedTicket:
        state.selectedTicket?.id === id
          ? { ...state.selectedTicket, ...updates }
          : state.selectedTicket,
    })),
  removeTicket: id =>
    set(state => ({
      tickets: state.tickets.filter(ticket => ticket.id !== id),
      selectedTicket:
        state.selectedTicket?.id === id ? null : state.selectedTicket,
    })),
  getMyTickets: (userId: string): Ticket[] => {
    const state = get();
    return state.tickets.filter(
      (ticket: Ticket) => ticket.requester?.id === userId
    );
  },
  getAssignedTickets: (userId: string): Ticket[] => {
    const state = get();
    return state.tickets.filter(
      (ticket: Ticket) => ticket.assignedTo?.id === userId
    );
  },
  getOverdueTickets: (): Ticket[] => {
    const state = get();
    const now = new Date();
    return state.tickets.filter((ticket: Ticket) => {
      if (!ticket.dueDate) return false;
      const dueDate = new Date(ticket.dueDate);
      return dueDate < now && !['RESOLVED', 'CLOSED'].includes(ticket.status);
    });
  },
}));
