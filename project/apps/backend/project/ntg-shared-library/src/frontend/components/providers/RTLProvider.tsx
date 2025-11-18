'use client';

import { useRTL } from '../../hooks/useRTL';
import { ReactNode } from 'react';

export interface RTLProviderProps {
  children: ReactNode;
}

/**
 * Provider component for RTL (Right-to-Left) language support
 * Automatically handles document direction updates based on locale
 */
export function RTLProvider({ children }: RTLProviderProps) {
  // This hook will automatically handle RTL direction updates
  const { mounted } = useRTL();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

