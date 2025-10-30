'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/useAuthStore';
import { Container, Text, Button, Group, Stack } from '@mantine/core';
import { IconShield, IconHome } from '@tabler/icons-react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

export function RouteGuard({
  children,
  allowedRoles = [],
  redirectTo = '/reports',
  fallbackComponent,
}: RouteGuardProps) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // If specific roles are allowed and user's active role is not in the list
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.activeRole)) {
        router.replace(redirectTo);
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return null;
  }

  // If no user, redirect to login
  if (!user) {
    router.replace('/auth/signin');
    return null;
  }

  // If user's active role is not allowed, show fallback or redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.activeRole)) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <Container size='sm' py='xl'>
        <Stack align='center' gap='md'>
          <IconShield size={64} color='red' />
          <Text size='xl' fw={600} ta='center'>
            Access Denied
          </Text>
          <Text c='dimmed' ta='center'>
            You don't have permission to access this page.
          </Text>
          <Group>
            <Button
              leftSection={<IconHome size={16} />}
              onClick={() => router.push(redirectTo)}
            >
              Go to Dashboard
            </Button>
          </Group>
        </Stack>
      </Container>
    );
  }

  return <>{children}</>;
}

// Convenience components for common role restrictions
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['ADMIN']} redirectTo='/reports'>
      {children}
    </RouteGuard>
  );
}

export function ManagerAndAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={['SUPPORT_MANAGER', 'ADMIN']}
      redirectTo='/reports'
    >
      {children}
    </RouteGuard>
  );
}

export function StaffAndAbove({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedRoles={['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN']}
      redirectTo='/reports'
    >
      {children}
    </RouteGuard>
  );
}

export function EndUserOnly({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['END_USER']} redirectTo='/dashboard'>
      {children}
    </RouteGuard>
  );
}
