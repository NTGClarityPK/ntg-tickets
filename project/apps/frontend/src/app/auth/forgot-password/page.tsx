'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  TextInput,
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
  IconMail,
  IconCheck,
  IconArrowLeft,
} from '@tabler/icons-react';
import { authClient } from '../../../services/api/auth.client';
import { AuthLayout } from '../../../components/layouts/AuthLayout';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function ForgotPasswordPage() {
  const theme = useMantineTheme();
  const t = useTranslations('auth');
  const { primary, primaryDark } = useDynamicTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t('emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('emailInvalid'));
      return;
    }

    setLoading(true);

    try {
      await authClient.forgotPassword(email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title={t('forgotPassword')} subtitle={t('subtitle')} type='signin'>
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
              {t('resetPasswordEmailSent') || 'Check Your Email'}
            </Title>
            <Text c='dimmed' size='sm' mb='lg'>
              {t('resetPasswordEmailSentMessage') || 
                'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.'}
            </Text>
            <Text c='dimmed' size='sm' mb='xl'>
              {t('resetPasswordEmailCheckSpam') || 
                'If you don\'t see the email, please check your spam folder.'}
            </Text>
            <Button
              variant='light'
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push('/auth/signin')}
              fullWidth
              size='lg'
              radius='md'
            >
              {t('backToSignIn') || 'Back to Sign In'}
            </Button>
          </Box>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('forgotPassword')} subtitle={t('subtitle')} type='signin'>
      <form onSubmit={handleSubmit}>
        <Stack gap='lg'>
          <Box>
            <Title order={2} size='1.8rem' fw={700} mb='xs'>
              {t('forgotPassword')}
            </Title>
            <Text c='dimmed' size='sm'>
              {t('forgotPasswordSubtitle') || 
                'Enter your email address and we\'ll send you a link to reset your password.'}
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

          <TextInput
            label={t('email')}
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
            {t('sendResetLink') || 'Send Reset Link'}
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

