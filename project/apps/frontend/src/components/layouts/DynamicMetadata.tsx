'use client';

import { usePublicSettings } from '../../hooks/usePublicSettings';
import { useEffect } from 'react';

export function DynamicMetadata() {
  const { data: settings } = usePublicSettings();

  useEffect(() => {
    if (settings) {
      // Update document title
      document.title = settings.siteName || 'NTG Ticket';

      // Update meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          settings.siteDescription || 'IT Support - Ticket Management System'
        );
      }
    }
  }, [settings]);

  return null;
}
