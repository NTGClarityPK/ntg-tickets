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
      // Check if user is in auth store (primary source of truth)
      if (user) {
        // Redirect admin users to overview, others to dashboard
        if (user.activeRole === UserRole.ADMIN) {
          router.push('/admin/overview');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // Check localStorage for access token (indicates active session)
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        // No token means user is logged out, stay on landing page
        return;
      }

      // If we have a token but no user in store, check Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Session exists but no user in store - redirect to dashboard
        // The dashboard will handle loading user data
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router, user]);

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
