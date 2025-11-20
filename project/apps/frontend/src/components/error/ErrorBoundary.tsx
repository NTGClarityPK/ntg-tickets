'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Alert,
  Group,
  Code,
  Paper,
  ActionIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconRefresh,
  IconHome,
  IconBug,
  IconCopy,
} from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Functional component for error details that can use hooks
function ErrorDetails({ error, errorInfo, onCopyError }: { error: Error; errorInfo: ErrorInfo | null; onCopyError: () => void }) {
  const theme = useMantineTheme();
  
  return (
    <Alert
      icon={<IconBug size={16} />}
      title='Development Error Details'
      color={theme.colors[theme.primaryColor][9]}
      variant='light'
      style={{ width: '100%' }}
    >
      <Stack gap='sm'>
        <Text size='sm' fw={500}>
          {error.message}
        </Text>
        <Group>
          <ActionIcon
            variant='subtle'
            size='sm'
            onClick={onCopyError}
            title='Copy error details'
          >
            <IconCopy size={14} />
          </ActionIcon>
        </Group>
        <Code
          block
          style={{
            fontSize: '12px',
            maxHeight: '200px',
            overflow: 'auto',
          }}
        >
          {error.stack}
        </Code>
        {errorInfo?.componentStack && (
          <Code
            block
            style={{
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {errorInfo.componentStack}
          </Code>
        )}
      </Stack>
    </Alert>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      // Log error for debugging
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      // Log production error
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleCopyError = () => {
    const errorText = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      // You could show a toast notification here
      // Error details copied to clipboard
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container size='md' py='xl'>
          <Paper withBorder p='xl' radius='md'>
            <Stack gap='lg' align='center'>
              <IconAlertTriangle size={64} color='var(--mantine-color-red-6)' />

              <div style={{ textAlign: 'center' }}>
                <Title order={2} mb='sm'>
                  Oops! Something went wrong
                </Title>
                <Text c='dimmed' size='lg'>
                  We encountered an unexpected error. Please try refreshing the
                  page or contact support if the problem persists.
                </Text>
              </div>

              <Group>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={this.handleRetry}
                  variant='filled'
                >
                  Try Again
                </Button>
                <Button
                  leftSection={<IconHome size={16} />}
                  onClick={this.handleGoHome}
                  variant='outline'
                >
                  Go to Dashboard
                </Button>
              </Group>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <ErrorDetails error={this.state.error} errorInfo={this.state.errorInfo} onCopyError={this.handleCopyError} />
              )}
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
  return (error: Error) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
