'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Define routes that should not have the app shell
  const noAppShellRoutes = ['/auth/signin', '/auth/signup', '/'];

  // Check if current path should not have app shell
  const shouldSkipAppShell = noAppShellRoutes.some(route => pathname === route);

  // If it's a route that shouldn't have app shell, render children directly
  if (shouldSkipAppShell) {
    return <>{children}</>;
  }

  // For all other routes, wrap with AppLayout (which handles authentication)
  return <AppLayout>{children}</AppLayout>;
}
