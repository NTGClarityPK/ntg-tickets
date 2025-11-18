'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface LanguageDetectorProps {
  /** Array of supported locale codes */
  supportedLocales?: string[];
  /** Default locale if detection fails */
  defaultLocale?: string;
  /** Cookie name for storing locale (default: 'locale') */
  cookieName?: string;
  /** Cookie max age in seconds (default: 31536000 = 1 year) */
  cookieMaxAge?: number;
}

const defaultSupportedLocales = ['en', 'ar'];

/**
 * Component that automatically detects and sets the user's preferred language
 * Runs once on mount and sets a cookie with the detected locale
 */
export function LanguageDetector({
  supportedLocales = defaultSupportedLocales,
  defaultLocale = 'en',
  cookieName = 'locale',
  cookieMaxAge = 31536000,
}: LanguageDetectorProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if locale cookie already exists
    const existingLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${cookieName}=`))
      ?.split('=')[1];

    if (existingLocale) {
      return; // Cookie already exists, no need to detect
    }

    // Detect language from browser
    const browserLanguage =
      navigator.language || navigator.languages?.[0] || defaultLocale;
    const detectedLocale = browserLanguage.split('-')[0]; // Get language code (e.g., 'en' from 'en-US')

    // Check if detected language is supported
    const locale = supportedLocales.includes(detectedLocale)
      ? detectedLocale
      : defaultLocale;

    // Set the cookie
    document.cookie = `${cookieName}=${locale}; path=/; max-age=${cookieMaxAge}`;

    // Use router.refresh() instead of window.location.reload() to prevent hydration issues
    router.refresh();
  }, [router, supportedLocales, defaultLocale, cookieName, cookieMaxAge]);

  return null; // This component doesn't render anything
}

