'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

export function useRTL() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Update document direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    // Update body direction for better RTL support
    document.body.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL, locale, mounted]);

  return {
    locale,
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    mounted,
  };
}
