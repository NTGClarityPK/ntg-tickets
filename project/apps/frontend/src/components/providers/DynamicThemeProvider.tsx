'use client';

import { useEffect } from 'react';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

/**
 * Provider component that updates CSS custom properties based on the current theme
 * This ensures that all components can use the dynamic colors via CSS variables
 */
export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const {
    primary,
    primaryLight,
    primaryLighter,
    primaryLightest,
    primaryDark,
    primaryDarker,
    primaryDarkest,
    background,
    surface,
    surfaceVariant,
    text,
    textSecondary,
    textMuted,
    border,
    borderLight,
  } = useDynamicTheme();

  useEffect(() => {
    // Update CSS custom properties
    const root = document.documentElement;
    
    
    // Primary colors
    root.style.setProperty('--dynamic-primary', primary);
    root.style.setProperty('--dynamic-primary-light', primaryLight);
    root.style.setProperty('--dynamic-primary-lighter', primaryLighter);
    root.style.setProperty('--dynamic-primary-lightest', primaryLightest);
    root.style.setProperty('--dynamic-primary-dark', primaryDark);
    root.style.setProperty('--dynamic-primary-darker', primaryDarker);
    root.style.setProperty('--dynamic-primary-darkest', primaryDarkest);
    
    // Background colors
    root.style.setProperty('--dynamic-background', background);
    root.style.setProperty('--dynamic-surface', surface);
    root.style.setProperty('--dynamic-surface-variant', surfaceVariant);
    
    // Text colors
    root.style.setProperty('--dynamic-text', text);
    root.style.setProperty('--dynamic-text-secondary', textSecondary);
    root.style.setProperty('--dynamic-text-muted', textMuted);
    
    // Border colors
    root.style.setProperty('--dynamic-border', border);
    root.style.setProperty('--dynamic-border-light', borderLight);
  }, [
    primary,
    primaryLight,
    primaryLighter,
    primaryLightest,
    primaryDark,
    primaryDarker,
    primaryDarkest,
    background,
    surface,
    surfaceVariant,
    text,
    textSecondary,
    textMuted,
    border,
    borderLight,
  ]);

  return <>{children}</>;
}
