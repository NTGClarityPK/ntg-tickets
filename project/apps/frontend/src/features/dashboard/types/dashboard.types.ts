export interface StatCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}

export interface EndUserDashboardMetrics {
  stats: StatCard[];
  canCreateTicket: boolean;
}

export interface TicketTableRow {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  ticketNumber: string;
  priority?: string;
  assignedTo?: string;
  requester?: string;
}

export interface TicketsByCategory {
  category: string;
  count: number;
}

export interface TicketsByStatus {
  status: string;
  count: number;
}

export interface TicketsByImpact {
  impact: string;
  count: number;
}

export interface TicketsByUrgency {
  urgency: string;
  count: number;
}

export interface TicketsByPriority {
  priority: string;
  count: number;
}

export interface ManagerDashboardMetrics {
  stats: StatCard[];
  ticketTrendData: Array<{ month: string; tickets: number; resolved: number }>;
  ticketsByCategory: TicketsByCategory[];
  ticketsByStatus: TicketsByStatus[];
  ticketsByImpact: TicketsByImpact[];
  ticketsByUrgency: TicketsByUrgency[];
  ticketsByPriority: TicketsByPriority[];
  staffPerformance?: Array<{
    staffName: string;
    totalTickets: number;
    workingTickets: number;
    doneTickets: number;
    holdTickets: number;
  }>;
}

export interface SupportStaffDashboardMetrics {
  stats: StatCard[];
  ticketsByCategory: TicketsByCategory[];
  ticketsByStatus: TicketsByStatus[];
  ticketsByImpact: TicketsByImpact[];
  ticketsByUrgency: TicketsByUrgency[];
  ticketsByPriority: TicketsByPriority[];
}

