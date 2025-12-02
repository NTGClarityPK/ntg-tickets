'use client';

import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Paper,
  Group,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconHome,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RTLArrowLeft } from '../ui/RTLIcon';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';

export function TicketNotFound() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { primaryDark } = useDynamicTheme();

  const handleGoBack = () => {
    // Invalidate all tickets-related queries to refetch the list
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-with-pagination'] });
    queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['my-tickets-with-pagination'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['overdue-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-approaching-sla'] });
    queryClient.invalidateQueries({ queryKey: ['breached-sla-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] });
    queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] });
    router.back();
  };

  const handleViewAllTickets = () => {
    // Invalidate all tickets-related queries to refetch the list
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-with-pagination'] });
    queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['my-tickets-with-pagination'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['overdue-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-approaching-sla'] });
    queryClient.invalidateQueries({ queryKey: ['breached-sla-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['all-tickets-counting'] });
    queryClient.invalidateQueries({ queryKey: ['total-tickets-count'] });
    router.push('/tickets');
  };

  return (
    <Container size='md' py='xl' data-testid="ticket-not-found">
      <Paper withBorder p='xl' radius='md' shadow='sm' data-testid="ticket-not-found-paper">
        <Stack gap='lg' align='center' data-testid="ticket-not-found-content">
          <IconAlertCircle size={64} color={primaryDark} data-testid="ticket-not-found-icon" />

          <div style={{ textAlign: 'center' }} data-testid="ticket-not-found-message">
            <Title order={2} mb='sm' data-testid="ticket-not-found-title">
              Ticket Not Available
            </Title>
            <Text c='dimmed' size='lg' mb='md' data-testid="ticket-not-found-description">
              The ticket you are looking for is not available. It may have been deleted or you may not have permission to view it.
            </Text>
            <Text c='dimmed' size='sm' fw={500} data-testid="ticket-not-found-help">
              Please contact your administrator if you believe this is an error.
            </Text>
          </div>

          <Group data-testid="ticket-not-found-actions">
            <Button
              variant='outline'
              leftSection={<RTLArrowLeft size={16} />}
              onClick={handleGoBack}
              data-testid="ticket-not-found-go-back-button"
            >
              Go Back
            </Button>
            <Button
              leftSection={<IconHome size={16} />}
              onClick={handleViewAllTickets}
              data-testid="ticket-not-found-view-all-button"
            >
              View All Tickets
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

