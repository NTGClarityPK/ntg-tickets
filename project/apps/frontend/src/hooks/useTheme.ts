import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

export type Theme = 'light' | 'dark' | 'auto';

export const useTheme = () => {
  // Initialize with default values to prevent hydration mismatch
  const [theme, setTheme] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load theme from localStorage after mount
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Save theme to localStorage
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Resolve theme based on preference
    const resolveTheme = () => {
      if (theme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return theme;
    };

    const newResolvedTheme = resolveTheme();
    setResolvedTheme(newResolvedTheme);

    // Apply theme to document for Mantine
    document.documentElement.setAttribute(
      'data-mantine-color-scheme',
      newResolvedTheme
    );
    document.documentElement.classList.toggle(
      'dark',
      newResolvedTheme === 'dark'
    );

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const resolved = resolveTheme();
        setResolvedTheme(resolved);
        document.documentElement.setAttribute(
          'data-mantine-color-scheme',
          resolved
        );
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => {
      switch (prev) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isAuto: theme === 'auto',
  };
};
