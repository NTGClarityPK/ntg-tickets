'use client';

import { useAuthStore } from '../../../stores/useAuthStore';
import { ManagerDashboardContainer } from '../../../features/dashboard';
import { AdminOverviewContainer } from '../../../features/dashboard/containers/AdminOverviewContainer';
import { UserRole } from '../../../types/unified';

export default function OverviewPage() {
  const { user } = useAuthStore();
  
  // Show AdminOverviewContainer for Admin, ManagerDashboardContainer for Support Manager
  if (user?.activeRole === UserRole.ADMIN) {
    return <AdminOverviewContainer />;
  }
  
  return <ManagerDashboardContainer />;
}

