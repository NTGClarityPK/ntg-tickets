'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const supportedLocales = ['en', 'ar'];

export function LanguageDetector() {
  const router = useRouter();

  useEffect(() => {
    // Check if locale cookie already exists
    const existingLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1];

    if (existingLocale) {
      return; // Cookie already exists, no need to detect
    }

    // Detect language from browser
    const browserLanguage =
      navigator.language || navigator.languages?.[0] || 'en';
    const detectedLocale = browserLanguage.split('-')[0]; // Get language code (e.g., 'en' from 'en-US')

    // Check if detected language is supported
    const locale = supportedLocales.includes(detectedLocale)
      ? detectedLocale
      : 'en';

    // Set the cookie
    document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year

    // Use router.refresh() instead of window.location.reload() to prevent hydration issues
    router.refresh();
  }, [router]);

  return null; // This component doesn't render anything
}
