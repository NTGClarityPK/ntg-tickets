'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Box,
  Badge,
  Group,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUser, IconLock, IconAlertCircle, IconCheck, IconBuilding } from '@tabler/icons-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface ThemeSettings {
  primaryColor: string;
  logoUrl?: string;
  logoData?: string;
}

interface InvitationData {
  email: string;
  name: string | null;
  roles: string[];
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  themeSettings?: ThemeSettings | null;
}

interface AcceptInviteFormValues {
  name: string;
  password: string;
  confirmPassword: string;
}

const DEFAULT_PRIMARY_COLOR = '#E03131';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const { primary, primaryDark } = useDynamicTheme();

  const form = useForm<AcceptInviteFormValues>({
    initialValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value) =>
        value.length < 2 ? 'Name must be at least 2 characters' : null,
      password: (value) =>
        value.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setIsLoading(false);
      return;
    }

    const validateInvitation = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(
          `${apiUrl}/api/v1/tenants/invitations/validate/${token}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Invalid or expired invitation');
        }

        setInvitation(data);
        if (data.name) {
          form.setFieldValue('name', data.name);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to validate invitation';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    validateInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (values: AcceptInviteFormValues) => {
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
        `${apiUrl}/api/v1/tenants/invitations/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            name: values.name,
            password: values.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }

      notifications.show({
        title: 'Welcome!',
        message: `You have successfully joined ${invitation?.organization.name}. Please sign in to continue.`,
        color: primary,
        icon: <IconCheck size={16} />,
      });

      router.push('/auth/signin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: primaryDark,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get theme colors from invitation or use defaults
  const primaryColor = invitation?.themeSettings?.primaryColor || DEFAULT_PRIMARY_COLOR;

  if (isLoading) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Center>
          <Stack align="center" gap="md">
            <Loader color="white" size="lg" />
            <Text c="white">Validating invitation...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  if (error && !invitation) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <Container size="md" style={{ width: '100%', maxWidth: 600 }}>
          <Paper radius="lg" p={40} withBorder shadow="xl">
            <Stack gap="lg" align="center">
              <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
              <Title order={3} ta="center">
                Invalid Invitation
              </Title>
              <Text c="dimmed" ta="center">
                {error}
              </Text>
              <Button
                component={Link}
                href="/auth/signin"
                variant="light"
                style={{ color: primaryColor }}
              >
                Go to Sign In
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Container size="md" style={{ width: '100%', maxWidth: 600 }}>
        <Paper radius="lg" p={40} withBorder shadow="xl">
          <Stack gap="lg">
            <Box ta="center">
              <Title order={2} mb="xs">
                Accept Invitation
              </Title>
              <Text c="dimmed" size="sm">
                Complete your account setup
              </Text>
            </Box>

            {invitation && (
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconBuilding size={18} />
                    <Text fw={500}>{invitation.organization.name}</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Email: {invitation.email}
                  </Text>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Role(s):
                    </Text>
                    {invitation.roles.map((role) => (
                      <Badge key={role} size="sm" variant="light" color={primary}>
                        {role.replace('_', ' ')}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </Paper>
            )}

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Your Name"
                  placeholder="Enter your full name"
                  leftSection={<IconUser size={16} />}
                  required
                  {...form.getInputProps('name')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Create a strong password"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  leftSection={<IconLock size={16} />}
                  required
                  {...form.getInputProps('confirmPassword')}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={isSubmitting}
                  mt="md"
                  style={{
                    background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                  }}
                >
                  Complete Setup
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default function AcceptInvitePage() {
  const { primary, primaryDark } = useDynamicTheme();
  return (
    <Suspense
      fallback={
        <Box
          style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader color="white" size="lg" />
        </Box>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
