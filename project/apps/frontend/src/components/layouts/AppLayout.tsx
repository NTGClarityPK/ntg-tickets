'use client';

import { useRouter } from 'next/navigation';
import { AppShell, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuthUser, useAuthIsLoading, useAuthStore } from '../../stores/useAuthStore';
import { AppHeader } from './AppHeader';
import { AppNavbar } from './AppNavbar';
import { DynamicMetadata } from './DynamicMetadata';
import { useNotificationsStoreSync } from '../../hooks/useNotificationsStoreSync';
import { useTicketsStoreSync } from '../../hooks/useTicketsStoreSync';
import { useNotifications } from '../../hooks/useNotifications';
import { DataProtectionBanner } from '../compliance/DataProtectionBanner';
import { HelpSystem } from '../help/HelpSystem';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const user = useAuthUser();
  const isLoading = useAuthIsLoading();
  const [helpModalOpened, setHelpModalOpened] = useState(false);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Initialize stores with API data
  useNotificationsStoreSync();
  useTicketsStoreSync();
  
  // Always fetch notifications to keep sidebar badge updated
  // This hook also syncs data to the Zustand store
  useNotifications();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check store (fastest, from signin page)
        const storedUser = useAuthStore.getState()?.user;
        if (storedUser) {
          // eslint-disable-next-line no-console
          console.log('User found in store, allowing access');
          setIsCheckingAuth(false);
          return;
        }

        // Then check Supabase session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          // eslint-disable-next-line no-console
          console.error('Session check error:', sessionError);
        }

        if (session) {
          // eslint-disable-next-line no-console
          console.log('Session found, allowing access');
          setIsCheckingAuth(false);
        } else {
          // eslint-disable-next-line no-console
          console.log('No session or user found, redirecting to signin');
          router.push('/auth/signin');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Auth check error:', error);
        // Don't redirect if user is in store (might be from signin page)
        const storedUser = useAuthStore.getState()?.user;
        if (!storedUser) {
          router.push('/auth/signin');
        } else {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();
  }, [router]);

  // Redirect to signin when user logs out
  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push('/auth/signin');
    }
  }, [user, isCheckingAuth, router]);

  // Show loading state while checking authentication
  if (isCheckingAuth || isLoading) {
    return <LoadingOverlay visible />;
  }

  // Wait for user to be loaded (but don't wait forever)
  // If user is in store but not yet loaded from session, proceed
  const storedUser = useAuthStore.getState()?.user;
  if (!user && !storedUser) {
    // Only show loading if we're still checking
    if (isCheckingAuth) {
      return <LoadingOverlay visible />;
    }
    // If not checking and no user, redirect will happen
    return null;
  }

  // Use stored user if available (from signin page) while session loads
  const displayUser = user || storedUser;
  if (!displayUser) {
    return null;
  }

  return (
    <>
      <DynamicMetadata />
      <DataProtectionBanner />
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 280,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened },
        }}
        padding='md'
        data-testid="app-shell"
      >
        <AppHeader
          onHelpClick={() => setHelpModalOpened(true)}
          mobileOpened={mobileOpened}
          toggleMobile={toggleMobile}
        />
        <AppNavbar onMobileClose={() => mobileOpened && toggleMobile()} />
        <AppShell.Main data-testid="app-shell-main">{children}</AppShell.Main>
      </AppShell>
      <HelpSystem
        opened={helpModalOpened}
        onClose={() => setHelpModalOpened(false)}
      />
    </>
  );
}
