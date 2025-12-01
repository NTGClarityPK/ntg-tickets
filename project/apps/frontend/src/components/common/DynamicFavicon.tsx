'use client';

import { useEffect, useRef } from 'react';
import { usePublicThemeSettings } from '@/hooks/useThemeSettings';

// Default logo SVG as data URL (32x32 favicon size)
// Pre-encoded base64 string to avoid build-time issues
const DEFAULT_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgZmlsbD0idXJsKCNncmFkaWVudDEpIiBzdHJva2U9InVybCgjZ3JhZGllbnQyKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYsIDE2KSI+PHJlY3QgeD0iLTgiIHk9Ii01IiB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIHJ4PSIyIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJub25lIi8+PGNpcmNsZSBjeD0iLTQiIGN5PSIwIiByPSIxIiBmaWxsPSJ1cmwoI2dyYWRpZW50MSkiLz48Y2lyY2xlIGN4PSIwIiBjeT0iMCIgcj0iMSIgZmlsbD0idXJsKCNncmFkaWVudDEpIi8+PGNpcmNsZSBjeD0iNCIgY3k9IjAiIHI9IjEiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIvPjxyZWN0IHg9Ii02IiB5PSItMyIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEiIHJ4PSIwLjUiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIvPjxyZWN0IHg9Ii01IiB5PSItMSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjAuNSIgcng9IjAuMjUiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIgb3BhY2l0eT0iMC43Ii8+PHJlY3QgeD0iLTQiIHk9IjAuNSIgd2lkdGg9IjgiIGhlaWdodD0iMC41IiByeD0iMC4yNSIgZmlsbD0idXJsKCNncmFkaWVudDEpIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI1IiBjeT0iLTQiIHI9IjEiIGZpbGw9IiNmZjZiNmIiLz48L2c+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNDNTI3MjA7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5OTFiMWI7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQzUyNzIwO3N0b3Atb3BhY2l0eTowLjgiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5OTFiMWI7c3RvcC1vcGFjaXR5OjAuOCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg==';

export function DynamicFavicon() {
  const { data: themeSettings } = usePublicThemeSettings();
  const createdLinksRef = useRef<HTMLLinkElement[]>([]);

  useEffect(() => {
    // Clean up previously created links
    createdLinksRef.current.forEach(link => {
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    createdLinksRef.current = [];

    // Only proceed if document is available
    if (typeof document === 'undefined') {
      return;
    }

    let faviconHref: string | null = null;

    // Determine which favicon to use
    // Check for explicit null/undefined values to ensure we don't use cleared data
    if (themeSettings?.faviconData && themeSettings.faviconData !== null && themeSettings.faviconData !== '') {
      // Use custom favicon data
      faviconHref = `data:image/png;base64,${themeSettings.faviconData}`;
    } else if (themeSettings?.faviconUrl && themeSettings.faviconUrl !== null && themeSettings.faviconUrl !== '') {
      // Use custom favicon URL
      faviconHref = themeSettings.faviconUrl;
    } else if (themeSettings?.logoData && themeSettings.logoData !== null && themeSettings.logoData !== '') {
      // Use logo data as favicon (fallback to logo if no favicon)
      faviconHref = `data:image/png;base64,${themeSettings.logoData}`;
    } else if (themeSettings?.logoUrl && themeSettings.logoUrl !== null && themeSettings.logoUrl !== '') {
      // Use logo URL as favicon (fallback to logo if no favicon)
      faviconHref = themeSettings.logoUrl;
    } else {
      // Use default logo SVG as favicon
      faviconHref = DEFAULT_LOGO_SVG;
    }

    // Create favicon link
    if (faviconHref) {
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = faviconHref.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';
      faviconLink.href = faviconHref;
      document.head.appendChild(faviconLink);
      createdLinksRef.current.push(faviconLink);

      // Also add apple-touch-icon
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconHref;
      document.head.appendChild(appleLink);
      createdLinksRef.current.push(appleLink);
    }

    // Cleanup function
    return () => {
      createdLinksRef.current.forEach(link => {
        if (link && link.parentNode) {
          try {
            link.parentNode.removeChild(link);
          } catch (error) {
            // Ignore errors if element is already removed
          }
        }
      });
      createdLinksRef.current = [];
    };
  }, [themeSettings?.faviconData, themeSettings?.faviconUrl, themeSettings?.logoData, themeSettings?.logoUrl]);

  return null; // This component doesn't render anything
}

