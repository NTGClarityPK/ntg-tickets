'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Group,
  Alert,
  Box,
  useMantineTheme,
  Stepper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBuilding, IconUser, IconMail, IconLock, IconAlertCircle, IconCheck, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { AuthLayout } from '@/components/layouts/AuthLayout';

interface SignupFormValues {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const theme = useMantineTheme();
  const router = useRouter();
  const { setUser, setOrganization } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const { primary, primaryDark } = useDynamicTheme();

  const form = useForm<SignupFormValues>({
    initialValues: {
      organizationName: '',
      adminName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      organizationName: (value) =>
        value.length < 2 ? 'Organization name must be at least 2 characters' : null,
      adminName: (value) =>
        value.length < 2 ? 'Name must be at least 2 characters' : null,
      adminEmail: (value) =>
        /^\S+@\S+$/.test(value) ? null : 'Invalid email address',
      password: (value) =>
        value.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      const orgError = form.validateField('organizationName');
      return !orgError.hasError;
    }
    if (currentStep === 1) {
      const nameError = form.validateField('adminName');
      const emailError = form.validateField('adminEmail');
      return !nameError.hasError && !emailError.hasError;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 2));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: values.organizationName,
          adminName: values.adminName,
          adminEmail: values.adminEmail,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create organization');
      }

      // Store tokens
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);

      // Update auth store
      setUser({
        ...data.data.user,
        activeRole: data.data.user.roles[0],
        isActive: true,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setOrganization(data.data.organization);

      notifications.show({
        title: 'Welcome!',
        message: `Your organization "${data.data.organization.name}" has been created successfully.`,
        color: primary,
        icon: <IconCheck size={16}/>,
      });

      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
          color: primaryDark,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = () => ({
    input: {
      border: `2px solid ${theme.colors.gray[3]}`,
      '&:focus': {
        borderColor: primary,
      },
    },
  });

  return (
    <AuthLayout title="Create Organization" subtitle="Get started with NTG Tickets for your team" type='signup'>
      <Stack gap='lg'>
        <Box>
          <Title order={2} size='1.8rem' fw={700} mb='xs'>
            Create Your Organization
          </Title>
          <Text c='dimmed' size='sm'>
            Step {step + 1} of 3
          </Text>
        </Box>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color={theme.colors[theme.primaryColor][9]}
            variant='light'
            radius='md'
          >
            {error}
          </Alert>
        )}

        <Stepper active={step} size="sm" color={primary}>
          <Stepper.Step label="Organization" icon={<IconBuilding size={18} />} />
          <Stepper.Step label="Account" icon={<IconUser size={18} />} />
          <Stepper.Step label="Security" icon={<IconLock size={18} />} />
        </Stepper>

        <form onSubmit={form.onSubmit(handleSubmit)} data-testid="signup-form">
          {step === 0 && (
            <Stack gap='lg'>
              <TextInput
                label="Organization Name"
                placeholder="Acme Corporation"
                leftSection={<IconBuilding size={18} />}
                required
                size='lg'
                radius='md'
                styles={inputStyles}
                disabled={isLoading}
                {...form.getInputProps('organizationName')}
                data-testid="signup-organization-name-input"
              />
              <Button
                fullWidth
                size='lg'
                radius='md'
                rightSection={<IconArrowRight size={18} />}
                onClick={nextStep}
                style={{
                  background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                  border: 'none',
                  fontWeight: 600,
                }}
                data-testid="signup-step-0-continue"
              >
                Continue
              </Button>
            </Stack>
          )}

          {step === 1 && (
            <Stack gap='lg'>
              <TextInput
                label="Your Name"
                placeholder="John Smith"
                leftSection={<IconUser size={18} />}
                required
                size='lg'
                radius='md'
                styles={inputStyles}
                disabled={isLoading}
                {...form.getInputProps('adminName')}
                data-testid="signup-admin-name-input"
              />
              <TextInput
                label="Email Address"
                placeholder="admin@company.com"
                leftSection={<IconMail size={18} />}
                required
                size='lg'
                radius='md'
                type='email'
                autoComplete='email'
                styles={inputStyles}
                disabled={isLoading}
                {...form.getInputProps('adminEmail')}
                data-testid="signup-admin-email-input"
              />
              <Group grow>
                <Button
                  variant='light'
                  size='lg'
                  radius='md'
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={prevStep}
                  data-testid="signup-step-1-back"
                >
                  Back
                </Button>
                <Button
                  size='lg'
                  radius='md'
                  rightSection={<IconArrowRight size={18} />}
                  onClick={nextStep}
                  style={{
                    background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                    border: 'none',
                    fontWeight: 600,
                  }}
                  data-testid="signup-step-1-continue"
                >
                  Continue
                </Button>
              </Group>
            </Stack>
          )}

          {step === 2 && (
            <Stack gap='lg'>
              <PasswordInput
                label="Password"
                placeholder="Create a strong password"
                leftSection={<IconLock size={18} />}
                required
                size='lg'
                radius='md'
                autoComplete='new-password'
                styles={inputStyles}
                disabled={isLoading}
                {...form.getInputProps('password')}
                data-testid="signup-password-input"
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your password"
                leftSection={<IconLock size={18} />}
                required
                size='lg'
                radius='md'
                autoComplete='new-password'
                styles={inputStyles}
                disabled={isLoading}
                {...form.getInputProps('confirmPassword')}
                data-testid="signup-confirm-password-input"
              />
              <Group grow>
                <Button
                  variant='light'
                  size='lg'
                  radius='md'
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={prevStep}
                  disabled={isLoading}
                  data-testid="signup-step-2-back"
                >
                  Back
                </Button>
                <Button
                  type='submit'
                  size='lg'
                  radius='md'
                  loading={isLoading}
                  style={{
                    background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                    border: 'none',
                    fontWeight: 600,
                  }}
                  data-testid="signup-submit-button"
                >
                  Create
                </Button>
              </Group>
            </Stack>
          )}
        </form>

        <Group justify="center">
          <Text size="sm" c="dimmed">
            Already have an account?{' '}
            <Link href="/auth/signin" style={{ color: primary, textDecoration: 'none' }} data-testid="signup-signin-link">
              Sign in
            </Link>
          </Text>
        </Group>
      </Stack>
    </AuthLayout>
  );
}
