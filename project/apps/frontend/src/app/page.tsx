'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingOverlay } from '@mantine/core';
import { LandingPage } from '../components/pages/LandingPage';
import { useAuthStore } from '../stores/useAuthStore';
import { UserRole } from '../types/unified';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Show landing page for unauthenticated users
    } else if (status === 'authenticated' && session?.user) {
      // Redirect admin users to overview, others to dashboard
      if (user?.activeRole === UserRole.ADMIN) {
        router.push('/admin/overview');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router, user]);

  if (status === 'loading') {
    return <LoadingOverlay visible />;
  }

  if (status === 'unauthenticated') {
    return <LandingPage />;
  }

  return null;
}
