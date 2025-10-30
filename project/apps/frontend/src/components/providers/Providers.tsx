'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createDynamicTheme } from '../../lib/theme';
import { AuthProvider } from './AuthProvider';
import { WebSocketProvider } from './WebSocketProvider';
import { DynamicThemeProvider } from './DynamicThemeProvider';
import { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { SkipLink } from '../accessibility/SkipLink';
import { ErrorBoundary } from '../error/ErrorBoundary';
import { GlobalErrorHandler } from '../error/GlobalErrorHandler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { primary } = useDynamicTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create dynamic theme based on current primary color
  const dynamicTheme = createDynamicTheme(primary);

  // During SSR and initial hydration, use light theme as default
  if (!mounted) {
    return (
      <MantineProvider theme={dynamicTheme} defaultColorScheme='light'>
        {children}
      </MantineProvider>
    );
  }

  return (
    <MantineProvider
      theme={dynamicTheme}
      defaultColorScheme={resolvedTheme}
      forceColorScheme={resolvedTheme}
    >
      {children}
    </MantineProvider>
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary>
            <SkipLink targetId='main-content'>Skip to main content</SkipLink>
            <GlobalErrorHandler />
            <main id='main-content' role='main'>
              <Notifications position='top-right' />
              <DynamicThemeProvider>
                <AuthProvider>
                  <WebSocketProvider>{children}</WebSocketProvider>
                </AuthProvider>
              </DynamicThemeProvider>
            </main>
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
