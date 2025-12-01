import { NextResponse } from 'next/server';
import { httpClient } from '@/services/api/http-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch theme settings from backend
    const response = await httpClient.get('/admin/public-theme-settings');
    const themeSettings = response.data.data;

    // Check if favicon data exists
    if (themeSettings?.faviconData) {
      // Convert base64 to buffer
      const faviconBuffer = Buffer.from(themeSettings.faviconData, 'base64');
      
      // Return as PNG (modern browsers support PNG favicons)
      return new NextResponse(faviconBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
      });
    }

    // Fallback: return 404 or default favicon
    // You could also serve a default favicon here
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    // If there's an error, return 404
    return new NextResponse(null, { status: 404 });
  }
}

