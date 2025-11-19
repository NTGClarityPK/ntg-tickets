'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  Group,
  Box,
  ThemeIcon,
  Checkbox,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconMail,
  IconLock,
  IconClock,
  IconCheck,
} from '@tabler/icons-react';
import { useLoginAttempts } from '../../../hooks/useLoginAttempts';
import { AuthLayout } from '../../../components/layouts/AuthLayout';
import { RoleSelectionModal } from '../../../components/modals/RoleSelectionModal';
import { UserRole } from '../../../types/unified';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function SignInPage() {
  const t = useTranslations('auth');
  const { primary, primaryDark } = useDynamicTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<
    'login' | 'complete'
  >('login');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roleSelectionLoading, setRoleSelectionLoading] = useState(false);
  const [roleSelectionError, setRoleSelectionError] = useState<string | null>(
    null
  );
  const router = useRouter();
  const {
    attempts,
    isLocked,
    remainingAttempts,
    canAttemptLogin,
    formattedRemainingTime,
    incrementAttempts,
    resetAttempts,
  } = useLoginAttempts();

  // Real-time email validation (UIR7: Immediate error feedback)
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAttemptLogin) {
      setError(t('tooManyAttempts', { time: formattedRemainingTime }));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, validate credentials by making a direct API call to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        incrementAttempts();
        if (remainingAttempts <= 1) {
          setError(
            t('invalidCredentialsLocked', { attempts: remainingAttempts })
          );
        } else {
          setError(
            t('invalidCredentialsRemaining', { attempts: remainingAttempts })
          );
        }
        return;
      }

      const data = await response.json();

      if (data.message === 'Role selection required') {
        // User has multiple roles, show role selection modal
        setUserRoles(data.data.user.roles);
        setShowRoleSelection(true);
        setLoading(false);
        return;
      }

      // User has single role, proceed with NextAuth signIn
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        // Reset attempts on successful login
        resetAttempts();
        setCurrentStep('complete');
        // Redirect immediately after successful login
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      incrementAttempts();
      setError(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole: UserRole) => {
    setRoleSelectionLoading(true);
    setRoleSelectionError(null);

    try {
      // Make API call to login with selected role
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, activeRole: selectedRole }),
        }
      );

      if (!response.ok) {
        setRoleSelectionError(t('roleSelectionFailed'));
        return;
      }

      // Proceed with NextAuth signIn
      const result = await signIn('credentials', {
        email,
        password,
        activeRole: selectedRole,
        redirect: false,
      });

      if (result?.ok) {
        // Reset attempts on successful login
        resetAttempts();
        setShowRoleSelection(false);
        setCurrentStep('complete');
        // Redirect immediately after successful login
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      setRoleSelectionError(t('roleSelectionFailed'));
    } finally {
      setRoleSelectionLoading(false);
    }
  };

  // Render login form
  const renderStepContent = () => {
    switch (currentStep) {
      case 'login':
        return (
          <form onSubmit={handleSubmit}>
            <Stack gap='lg'>
              <Box>
                <Title order={2} size='1.8rem' fw={700} mb='xs'>
                  Welcome Back
                </Title>
                <Text c='dimmed' size='sm'>
                  Sign in to your account to continue
                </Text>
              </Box>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color='red'
                  variant='light'
                  radius='md'
                >
                  {error}
                </Alert>
              )}

              {isLocked && (
                <Alert
                  icon={<IconClock size={16} />}
                  color='orange'
                  variant='light'
                  radius='md'
                >
                  {t('accountLockedWait', { time: formattedRemainingTime })}
                </Alert>
              )}

              {attempts > 0 && !isLocked && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color='yellow'
                  variant='light'
                  radius='md'
                >
                  {t('invalidCredentialsRemaining', {
                    attempts: remainingAttempts,
                  })}
                </Alert>
              )}

              <TextInput
                label='Email'
                placeholder='your@email.com'
                required
                leftSection={<IconMail size={18} />}
                value={email}
                onChange={e => {
                  setEmail(e.currentTarget.value);
                  setError('');
                }}
                type='email'
                size='lg'
                radius='md'
                autoComplete='email'
                name='email'
                id='email'
                dir='auto'
                error={email && !validateEmail(email) ? t('emailInvalid') : ''}
                styles={theme => ({
                  input: {
                    border: `2px solid ${theme.colors.gray[3]}`,
                    '&:focus': {
                      borderColor: primary,
                    },
                  },
                })}
                disabled={loading}
              />

              <PasswordInput
                label='Password'
                placeholder='Enter your password'
                required
                leftSection={<IconLock size={18} />}
                value={password}
                onChange={e => {
                  setPassword(e.currentTarget.value);
                  setError('');
                }}
                size='lg'
                radius='md'
                autoComplete='current-password'
                name='password'
                id='password'
                dir='auto'
                styles={theme => ({
                  input: {
                    border: `2px solid ${theme.colors.gray[3]}`,
                    '&:focus': {
                      borderColor: primary,
                    },
                  },
                })}
                disabled={loading}
              />

              <Group justify='space-between'>
                <Checkbox
                  label='Remember me'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  disabled={loading}
                />
                <Text
                  size='sm'
                  c={primary}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // TODO: Implement password reset
                  }}
                >
                  Forgot password?
                </Text>
              </Group>

              <Button
                type='submit'
                fullWidth
                loading={loading}
                size='lg'
                radius='md'
                style={{
                  background:
                    `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Sign In
              </Button>
            </Stack>
          </form>
        );

      case 'complete':
        return (
          <Stack gap='lg' align='center'>
            <Box ta='center'>
              <ThemeIcon
                size={60}
                radius='xl'
                variant='gradient'
                gradient={{ from: primary, to: primaryDark }}
                mb='md'
              >
                <IconCheck size={30} />
              </ThemeIcon>
              <Title order={2} size='1.8rem' fw={700} mb='xs'>
                {t('welcome')}!
              </Title>
              <Text c='dimmed' size='sm'>
                {t('redirectingToDashboard')}
              </Text>
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <AuthLayout title={t('welcome')} subtitle={t('subtitle')} type='signin'>
      {renderStepContent()}

      <RoleSelectionModal
        opened={showRoleSelection}
        onClose={() => setShowRoleSelection(false)}
        roles={userRoles}
        activeRole={userRoles[0] || UserRole.END_USER}
        onRoleSelect={handleRoleSelection}
        loading={roleSelectionLoading}
        error={roleSelectionError}
      />
    </AuthLayout>
  );
}
