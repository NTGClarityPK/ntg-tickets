'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingOverlay } from '@mantine/core';
import { LandingPage } from '../components/pages/LandingPage';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Show landing page for unauthenticated users
    } else if (status === 'authenticated' && session?.user) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <LoadingOverlay visible />;
  }

  if (status === 'unauthenticated') {
    return <LandingPage />;
  }

  return null;
}
