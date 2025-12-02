'use client';

import { ReactNode } from 'react';
import { Box, Title, Text, Card } from '@mantine/core';
import { IconTicket } from '@tabler/icons-react';
import { LanguageSwitcher } from '../language/LanguageSwitcher';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  type: 'signin' | 'signup';
  maxWidth?: number;
}

export function AuthLayout({ children, maxWidth = 480 }: AuthLayoutProps) {
  const { primary, primaryDark } = useDynamicTheme();

  return (
    <Box
      dir='auto'
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
        padding: '20px',
        position: 'relative',
      }}
      data-testid="auth-layout-container"
    >
      {/* Language Switcher and Theme Toggle - Overlay */}
      <Box
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
        }}
        data-testid="auth-layout-controls"
      >
        <LanguageSwitcher />
        <ThemeToggle />
      </Box>

      {/* Left Side - Decorative (Hidden on Mobile) */}
      <Box
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        visibleFrom='md'
        data-testid="auth-layout-decorative-side"
      >
        <Box
          style={{
            textAlign: 'center',
            color: 'white',
            zIndex: 10,
          }}
          data-testid="auth-layout-decorative-content"
        >
          <Box
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
            data-testid="auth-layout-icon-wrapper"
          >
            <IconTicket size={60} stroke={2} data-testid="auth-layout-icon" />
          </Box>
          <Title order={1} size='2.5rem' fw={800} mb='md' c='white' data-testid="auth-layout-title">
            Ticket Management
          </Title>
          <Text size='lg' c='white' opacity={0.9} data-testid="auth-layout-subtitle">
            Streamline your IT support operations
          </Text>
        </Box>
      </Box>

      {/* Right Side - Form Container */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          minHeight: '100vh',
          width: '100%',
          flex: 1,
        }}
        data-testid="auth-layout-form-side"
      >
        <Card
          shadow='xl'
          radius='xl'
          padding='xl'
          withBorder
          style={{
            backdropFilter: 'blur(20px)',
            maxWidth: `${maxWidth}px`,
            width: '100%',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          data-testid="auth-layout-card"
        >
          {/* App Name Header */}
          <Box ta='center' mb='xl' data-testid="auth-layout-app-header">
            <Title
              order={1}
              size='2.2rem'
              fw={800}
              style={{
                background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              data-testid="auth-layout-app-name"
            >
              NTG Ticket
            </Title>
          </Box>

          <div data-testid="auth-layout-children">
            {children}
          </div>
        </Card>
      </Box>
    </Box>
  );
}
