'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn as supabaseSignIn } from '../../../lib/supabase-auth';
import { useAuthActions, useAuthStore } from '../../../stores/useAuthStore';
import { authClient } from '../../../services/api/auth.client';
import { UserRole } from '../../../types/unified';
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
  useMantineTheme,
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
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function SignInPage() {
  const theme = useMantineTheme();
  const t = useTranslations('auth');
  const { primary, primaryDark } = useDynamicTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep ] = useState<
    'login' | 'complete'
  >('login');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roleSelectionLoading, setRoleSelectionLoading] = useState(false);
  const [roleSelectionError, setRoleSelectionError] = useState<string | null>(
    null
  );
  const router = useRouter();
  const { setUser, setOrganization } = useAuthActions();
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
    
    // eslint-disable-next-line no-console
    console.log('=== SIGNIN STARTED ===');
    // eslint-disable-next-line no-console
    console.log('Email:', email);
    // eslint-disable-next-line no-console
    console.log('Can attempt login:', canAttemptLogin);

    if (!canAttemptLogin) {
      setError(t('tooManyAttempts', { time: formattedRemainingTime }));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // eslint-disable-next-line no-console
      console.log('Calling supabaseSignIn...');
      // Use Supabase Auth for sign in
      const result = await supabaseSignIn(email, password);
      // eslint-disable-next-line no-console
      console.log('Signin result:', result);
      // eslint-disable-next-line no-console
      console.log('Result structure:', {
        hasUser: !!result?.user,
        userId: result?.user?.id,
        userEmail: result?.user?.email,
        userRoles: result?.user?.roles,
      });

      // Check if result has the expected structure
      if (!result || !result.user) {
        throw new Error('Invalid signin response: missing user data');
      }

      // Set user in auth store immediately
      const userData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles as UserRole[],
        activeRole: (result.user.activeRole || result.user.roles[0]) as UserRole,
        isActive: true,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUser(userData);
      
      // Set organization if available in the response
      if (result.organization) {
        setOrganization(result.organization);
      }
      
      // Verify user is set in store
      const storedUser = useAuthStore.getState()?.user;
      // eslint-disable-next-line no-console
      console.log('User set in store:', storedUser);

      if (result.user.roles.length > 1) {
        // User has multiple roles, show role selection modal
        setUserRoles(result.user.roles as UserRole[]);
        setShowRoleSelection(true);
        setLoading(false);
        return;
      }

      // Reset attempts on successful login
      resetAttempts();
      setLoading(false);
      
      // Use router.push for client-side navigation
      // eslint-disable-next-line no-console
      console.log('Redirecting to dashboard with user:', storedUser);
      router.push('/dashboard');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('=== SIGNIN ERROR ===', error);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole: UserRole) => {
    setRoleSelectionLoading(true);
    setRoleSelectionError(null);

    try {
      // Call switch-role API to set the active role on the backend
      const response = await authClient.switchRole({ activeRole: selectedRole });

      if (response.data?.data) {
        const updatedUser = response.data.data.user;
        
        // Set user in auth store with selected role
        setUser({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          roles: updatedUser.roles as UserRole[],
          activeRole: selectedRole,
          isActive: true,
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Reset attempts on successful login
      resetAttempts();
      setShowRoleSelection(false);
      setLoading(false);
      
      // Use router.push for client-side navigation
      router.push('/dashboard');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Role selection error:', error);
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
                  color={theme.colors[theme.primaryColor][9]}
                  variant='light'
                  radius='md'
                >
                  {error}
                </Alert>
              )}

              {isLocked && (
                <Alert
                  icon={<IconClock size={16} />}
                  color={theme.colors[theme.primaryColor][4]}
                  variant='light'
                  radius='md'
                >
                  {t('accountLockedWait', { time: formattedRemainingTime })}
                </Alert>
              )}

              {attempts > 0 && !isLocked && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color={theme.colors[theme.primaryColor][4]}
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
                  component='a'
                  href='/auth/forgot-password'
                  size='sm'
                  c={primary}
                  style={{ cursor: 'pointer', textDecoration: 'none' }}
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

              <Text ta='center' size='sm' c='dimmed'>
                Don&apos;t have an account?{' '}
                <Text
                  component='a'
                  href='/auth/signup'
                  c={primary}
                  fw={600}
                  style={{ cursor: 'pointer' }}
                >
                  Sign up
                </Text>
              </Text>
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
