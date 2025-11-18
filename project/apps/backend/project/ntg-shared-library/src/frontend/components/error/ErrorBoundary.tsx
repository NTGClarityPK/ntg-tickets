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
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconRefresh,
  IconHome,
  IconBug,
  IconCopy,
} from '@tabler/icons-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  homeUrl?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Generic error boundary component for React applications
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      // Example: Sentry.captureException(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    const homeUrl = this.props.homeUrl || '/dashboard';
    window.location.href = homeUrl;
  };

  handleCopyError = () => {
    const errorText = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      // You could show a toast notification here
      console.log('Error details copied to clipboard');
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
                  Go Home
                </Button>
              </Group>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert
                  icon={<IconBug size={16} />}
                  title='Development Error Details'
                  color='red'
                  variant='light'
                  style={{ width: '100%' }}
                >
                  <Stack gap='sm'>
                    <Text size='sm' fw={500}>
                      {this.state.error.message}
                    </Text>
                    <Group>
                      <ActionIcon
                        variant='subtle'
                        size='sm'
                        onClick={this.handleCopyError}
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
                      {this.state.error.stack}
                    </Code>
                    {this.state.errorInfo?.componentStack && (
                      <Code
                        block
                        style={{
                          fontSize: '12px',
                          maxHeight: '200px',
                          overflow: 'auto',
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Code>
                    )}
                  </Stack>
                </Alert>
              )}
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for functional components to trigger error boundary
 */
export const useErrorHandler = () => {
  return (error: Error) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

