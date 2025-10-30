'use client';

import { ReactNode } from 'react';
import { Box, Title, Text, Card, useMantineTheme } from '@mantine/core';
import Link from 'next/link';
import {
  IconTicket,
  IconHeadset,
  IconShield,
  IconChecklist,
  IconUsers,
  IconSettings,
} from '@tabler/icons-react';
import { LanguageSwitcher } from '../language/LanguageSwitcher';
import { ThemeToggle } from '../theme/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  type: 'signin' | 'signup';
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useMantineTheme();

  return (
    <Box
      dir='auto'
      style={{
        minHeight: '100vh',
        display: 'flex',
      }}
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
      >
        <LanguageSwitcher />
        <ThemeToggle />
      </Box>

      {/* Left Side - Colored Background (Hidden on Mobile) */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${theme.colors.red[6]} 0%, ${theme.colors.red[8]} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
        }}
        flex={1}
        visibleFrom='md'
      >
        {/* Background Pattern */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(197, 39, 32, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(197, 39, 32, 0.2) 0%, transparent 50%)
            `,
          }}
        />

        {/* Decorative Elements */}
        {/* Large Circle */}
        <Box
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        />

        {/* Medium Circle */}
        <Box
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '-5%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* Small Circle */}
        <Box
          style={{
            position: 'absolute',
            top: '30%',
            left: '10%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        />

        {/* Geometric Lines */}
        <Box
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '2px',
            height: '100px',
            background:
              'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)',
            transform: 'rotate(45deg)',
          }}
        />

        <Box
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '15%',
            width: '2px',
            height: '80px',
            background:
              'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent)',
            transform: 'rotate(-30deg)',
          }}
        />

        {/* Diagonal Lines */}
        <Box
          style={{
            position: 'absolute',
            top: '40%',
            right: '30%',
            width: '1px',
            height: '120px',
            background:
              'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.15), transparent)',
            transform: 'rotate(60deg)',
          }}
        />

        {/* Floating Dots */}
        <Box
          style={{
            position: 'absolute',
            top: '60%',
            left: '15%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
          }}
        />

        <Box
          style={{
            position: 'absolute',
            top: '25%',
            right: '25%',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)',
          }}
        />

        <Box
          style={{
            position: 'absolute',
            bottom: '40%',
            left: '25%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.2)',
          }}
        />

        {/* Main Logo/Icon */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            zIndex: 10,
          }}
        >
          {/* Large Ticket Icon */}
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
          >
            <IconTicket size={60} stroke={2} />
          </Box>

          {/* Feature Icons Grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginTop: '32px',
              maxWidth: '200px',
              margin: '32px auto 0',
            }}
          >
            <Box
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
              }}
            >
              <IconHeadset size={24} stroke={1.5} />
            </Box>

            <Box
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
              }}
            >
              <IconShield size={24} stroke={1.5} />
            </Box>

            <Box
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
              }}
            >
              <IconChecklist size={24} stroke={1.5} />
            </Box>

            <Box
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
              }}
            >
              <IconUsers size={24} stroke={1.5} />
            </Box>

            <Box
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
              }}
            >
              <IconSettings size={24} stroke={1.5} />
            </Box>

            <Box
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
              }}
            >
              <IconTicket size={24} stroke={1.5} />
            </Box>
          </Box>
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
        }}
        flex={1}
      >
        <Card
          shadow='xl'
          radius='xl'
          padding='xl'
          withBorder
          style={{
            backdropFilter: 'blur(20px)',
            maxWidth: '480px',
            width: '100%',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* App Name Header */}
          <Box ta='center' mb='xl'>
            <Link href='/' style={{ textDecoration: 'none' }}>
              <Title
                order={1}
                size='2.2rem'
                fw={800}
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.red[6]} 0%, ${theme.colors.red[8]} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                NTG Ticket
              </Title>
            </Link>
            <Text c='dimmed' size='sm' fw={500}>
              IT Support - Ticket Management System
            </Text>
          </Box>

          {children}
        </Card>
      </Box>
    </Box>
  );
}
