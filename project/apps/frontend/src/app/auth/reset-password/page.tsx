'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  Box,
  ThemeIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconLock,
  IconCheck,
  IconArrowLeft,
} from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { AuthLayout } from '../../../components/layouts/AuthLayout';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function ResetPasswordPage() {
  const theme = useMantineTheme();
  const t = useTranslations('auth');
  const { primary, primaryDark } = useDynamicTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid session from the reset token
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Try to get the token from URL hash (Supabase redirects with hash)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session with the tokens from the URL
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              setError(t('resetPasswordTokenInvalid') || 'Invalid or expired reset token. Please request a new password reset.');
              setValidating(false);
              return;
            }
          } else {
            setError(t('resetPasswordTokenInvalid') || 'Invalid or expired reset token. Please request a new password reset.');
            setValidating(false);
            return;
          }
        }
        setValidating(false);
      } catch (error) {
        setError(t('resetPasswordTokenInvalid') || 'Invalid or expired reset token. Please request a new password reset.');
        setValidating(false);
      }
    };

    checkSession();
  }, [t]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return t('passwordTooShort');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error(t('resetPasswordTokenInvalid') || 'Invalid or expired reset token');
      }

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message || t('resetPasswordFailed') || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || t('resetPasswordFailed') || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <AuthLayout title={t('resetPassword')} subtitle={t('subtitle')} type='signin'>
        <Stack gap='lg' align='center'>
          <Text c='dimmed' size='sm'>
            {t('validatingToken') || 'Validating reset token...'}
          </Text>
        </Stack>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title={t('resetPassword')} subtitle={t('subtitle')} type='signin'>
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
              {t('passwordResetSuccess') || 'Password Reset Successful!'}
            </Title>
            <Text c='dimmed' size='sm' mb='lg'>
              {t('passwordResetSuccessMessage') || 
                'Your password has been successfully reset. You can now sign in with your new password.'}
            </Text>
            <Text c='dimmed' size='sm'>
              {t('redirectingToSignIn') || 'Redirecting to sign in...'}
            </Text>
          </Box>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('resetPassword')} subtitle={t('subtitle')} type='signin'>
      <form onSubmit={handleSubmit}>
        <Stack gap='lg'>
          <Box>
            <Title order={2} size='1.8rem' fw={700} mb='xs'>
              {t('resetPassword')}
            </Title>
            <Text c='dimmed' size='sm'>
              {t('resetPasswordSubtitle') || 
                'Enter your new password below.'}
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

          <PasswordInput
            label={t('newPassword') || 'New Password'}
            placeholder={t('enterNewPassword') || 'Enter your new password'}
            required
            leftSection={<IconLock size={18} />}
            value={password}
            onChange={e => {
              setPassword(e.currentTarget.value);
              setError('');
            }}
            size='lg'
            radius='md'
            autoComplete='new-password'
            name='password'
            id='password'
            dir='auto'
            error={password && validatePassword(password) ? validatePassword(password) : ''}
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
            label={t('confirmNewPassword') || 'Confirm New Password'}
            placeholder={t('confirmNewPasswordPlaceholder') || 'Confirm your new password'}
            required
            leftSection={<IconLock size={18} />}
            value={confirmPassword}
            onChange={e => {
              setConfirmPassword(e.currentTarget.value);
              setError('');
            }}
            size='lg'
            radius='md'
            autoComplete='new-password'
            name='confirmPassword'
            id='confirmPassword'
            dir='auto'
            error={confirmPassword && password !== confirmPassword ? t('passwordMismatch') : ''}
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

          <Button
            type='submit'
            fullWidth
            loading={loading}
            size='lg'
            radius='md'
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
              border: 'none',
              fontWeight: 600,
            }}
          >
            {t('resetPassword')}
          </Button>

          <Button
            variant='subtle'
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push('/auth/signin')}
            fullWidth
            size='md'
            radius='md'
          >
            {t('backToSignIn') || 'Back to Sign In'}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}

