export interface StatCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}

export interface AdminMetrics {
  userStats: StatCard[];
  securityStats: StatCard[];
  failedLogins: number;
  isLoading: boolean;
}

