'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuthStore } from '../../stores/useAuthStore';
import { AppHeader } from './AppHeader';
import { AppNavbar } from './AppNavbar';
import { DynamicMetadata } from './DynamicMetadata';
import { useNotificationsStoreSync } from '../../hooks/useNotificationsStoreSync';
import { useTicketsStoreSync } from '../../hooks/useTicketsStoreSync';
import { DataProtectionBanner } from '../compliance/DataProtectionBanner';
import { HelpSystem } from '../help/HelpSystem';
import { useEffect, useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [helpModalOpened, setHelpModalOpened] = useState(false);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  // Initialize stores with API data
  useNotificationsStoreSync();
  useTicketsStoreSync();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading' || isLoading) {
    return <LoadingOverlay visible />;
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  // Wait for user to be loaded from session
  if (!user) {
    return <LoadingOverlay visible />;
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
      >
        <AppHeader
          onHelpClick={() => setHelpModalOpened(true)}
          mobileOpened={mobileOpened}
          toggleMobile={toggleMobile}
        />
        <AppNavbar onMobileClose={() => mobileOpened && toggleMobile()} />
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
      <HelpSystem
        opened={helpModalOpened}
        onClose={() => setHelpModalOpened(false)}
      />
    </>
  );
}
