'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/useAuthStore';
import { EndUserDashboard } from './EndUserDashboard';
import { SupportStaffDashboard } from './SupportStaffDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { AdminDashboard } from './AdminDashboard';

export function DashboardContent() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Redirect End Users to Reports page since they don't have access to Overview
  useEffect(() => {
    if (user?.activeRole === 'END_USER') {
      router.replace('/reports');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // End Users are redirected, so this won't render for them
  switch (user.activeRole) {
    case 'SUPPORT_STAFF':
      return <SupportStaffDashboard />;
    case 'SUPPORT_MANAGER':
      return <ManagerDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <EndUserDashboard />;
  }
}
