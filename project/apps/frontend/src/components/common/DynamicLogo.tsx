'use client';

import { useState } from 'react';
import { usePublicThemeSettings } from '../../hooks/useThemeSettings';
import { Box, Image } from '@mantine/core';
import { Logo } from './Logo';

interface DynamicLogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

export function DynamicLogo({ size = 40, variant = 'full', className }: DynamicLogoProps) {
  const { data: themeSettings } = usePublicThemeSettings();
  const [imageError, setImageError] = useState(false);

  // Get the logo source - prioritize uploaded data over URL
  const getLogoSrc = () => {
    if (themeSettings?.logoData) {
      return `data:image/png;base64,${themeSettings.logoData}`;
    }
    if (themeSettings?.logoUrl) {
      return themeSettings.logoUrl;
    }
    return null; // Will fall back to default
  };

  const logoSrc = getLogoSrc();

  if (variant === 'icon') {
    // If we have a custom logo and it hasn't errored, render it
    if (logoSrc && !imageError) {
      return (
        <Box className={className} data-testid="dynamic-logo-icon">
          <Image
            src={logoSrc}
            alt="Logo"
            width={size}
            height={size}
            fit="contain"
            onError={() => setImageError(true)}
            data-testid="dynamic-logo-image"
          />
        </Box>
      );
    }
    
    // Fallback to default Logo component when no custom logo is set or on error
    return <Logo size={size} variant="icon" className={className} />;
  }

  if (variant === 'text') {
    // If no custom logo, use default Logo component
    if (!logoSrc || imageError) {
      return <Logo size={size} variant="text" className={className} />;
    }
    
    return (
      <Box
        className={className}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        data-testid="dynamic-logo-text"
      >
        <DynamicLogo size={size} variant='icon' />
        <span
          style={{
            fontSize: `${size * 0.6}px`,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #C52720 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          data-testid="dynamic-logo-text-label"
        >
          NTG Ticket
        </span>
      </Box>
    );
  }

  // Full variant (default)
  // If no custom logo, use default Logo component
  if (!logoSrc || imageError) {
    return <Logo size={size} variant="full" className={className} />;
  }
  
  return (
    <Box
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
      data-testid="dynamic-logo-full"
    >
      <DynamicLogo size={size} variant='icon' />
      <div data-testid="dynamic-logo-text-container">
        <div
          style={{
            fontSize: `${size * 0.5}px`,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #C52720 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
          data-testid="dynamic-logo-title"
        >
          NTG Ticket
        </div>
        <div
          style={{
            fontSize: `${size * 0.25}px`,
            color: '#666',
            fontWeight: 500,
            lineHeight: 1,
          }}
          data-testid="dynamic-logo-subtitle"
        >
          IT Support System
        </div>
      </div>
    </Box>
  );
}
