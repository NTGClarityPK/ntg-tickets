'use client';

import { Box } from '@mantine/core';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

export function Logo({ size = 40, variant = 'full', className }: LogoProps) {
  if (variant === 'icon') {
    return (
      <Box className={className} data-testid="logo-icon">
        <svg
          width={size}
          height={size}
          viewBox='0 0 32 32'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          data-testid="logo-svg"
        >
          <circle
            cx='16'
            cy='16'
            r='15'
            fill='url(#gradient1)'
            stroke='url(#gradient2)'
            strokeWidth='2'
          />
          <g transform='translate(16, 16)'>
            <rect
              x='-8'
              y='-5'
              width='16'
              height='10'
              rx='2'
              fill='white'
              stroke='none'
            />
            <circle cx='-4' cy='0' r='1' fill='url(#gradient1)' />
            <circle cx='0' cy='0' r='1' fill='url(#gradient1)' />
            <circle cx='4' cy='0' r='1' fill='url(#gradient1)' />
            <rect
              x='-6'
              y='-3'
              width='12'
              height='1'
              rx='0.5'
              fill='url(#gradient1)'
            />
            <rect
              x='-5'
              y='-1'
              width='10'
              height='0.5'
              rx='0.25'
              fill='url(#gradient1)'
              opacity='0.7'
            />
            <rect
              x='-4'
              y='0.5'
              width='8'
              height='0.5'
              rx='0.25'
              fill='url(#gradient1)'
              opacity='0.5'
            />
            <circle cx='5' cy='-4' r='1' fill='#ff6b6b' />
          </g>
          <defs>
            <linearGradient id='gradient1' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop
                offset='0%'
                style={{ stopColor: '#C52720', stopOpacity: 1 }}
              />
              <stop
                offset='100%'
                style={{ stopColor: '#991b1b', stopOpacity: 1 }}
              />
            </linearGradient>
            <linearGradient id='gradient2' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop
                offset='0%'
                style={{ stopColor: '#C52720', stopOpacity: 0.8 }}
              />
              <stop
                offset='100%'
                style={{ stopColor: '#991b1b', stopOpacity: 0.8 }}
              />
            </linearGradient>
          </defs>
        </svg>
      </Box>
    );
  }

  if (variant === 'text') {
    return (
      <Box
        className={className}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        data-testid="logo-text"
      >
        <Logo size={size} variant='icon' />
        <span
          style={{
            fontSize: `${size * 0.6}px`,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #C52720 0%, #991b1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          data-testid="logo-text-label"
        >
          NTG Ticket
        </span>
      </Box>
    );
  }

  // Full variant (default)
  return (
    <Box
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
      data-testid="logo-full"
    >
      <Logo size={size} variant='icon' />
      <div data-testid="logo-text-container">
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
          data-testid="logo-title"
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
          data-testid="logo-subtitle"
        >
          IT Support System
        </div>
      </div>
    </Box>
  );
}
