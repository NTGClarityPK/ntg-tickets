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
  slaMetrics?: {
    responseTime?: number;
    resolutionTime?: number;
    customerSatisfaction?: number;
  };
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
  slaMetrics?: {
    responseTime?: number;
    resolutionTime?: number;
    customerSatisfaction?: number;
  };
  recentTickets: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    ticketNumber: string;
  }>;
}

