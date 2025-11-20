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

export interface ManagerDashboardMetrics {
  stats: StatCard[];
  ticketTrendData: Array<{ month: string; tickets: number; resolved: number }>;
  recentTickets: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    ticketNumber: string;
  }>;
}

export interface SupportStaffDashboardMetrics {
  stats: StatCard[];
  recentTickets: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    ticketNumber: string;
  }>;
}

