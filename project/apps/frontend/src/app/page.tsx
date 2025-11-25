'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LandingPage } from '../components/pages/LandingPage';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/unified';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session || user) {
        // Redirect admin users to overview, others to dashboard
        if (user?.activeRole === UserRole.ADMIN) {
          router.push('/admin/overview');
        } else {
          router.push('/dashboard');
        }
      }
    };

    checkAuth();
  }, [router, user]);

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
