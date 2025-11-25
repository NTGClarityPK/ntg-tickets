'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { DynamicTicketForm } from '../../../components/forms/DynamicTicketForm';
import { DynamicTicketFormValues } from '../../../types/unified';
import { CreateTicketInput } from '../../../lib/apiClient';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCanCreateTicket } from '../../../hooks/useCanCreateTicket';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';
import { useCreateTicket } from '../../../hooks/useTickets';

export default function CreateTicketPage() {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { canCreate, loading: checkingPermission } = useCanCreateTicket();
  const createTicketMutation = useCreateTicket();

  useEffect(() => {
    if (!isAuthenticated) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please log in to create a ticket',
        color: primaryDark,
      });
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router, primaryDark]);

  // Check workflow-based permissions after hook has loaded
  useEffect(() => {
    if (!checkingPermission && user && !canCreate) {
      notifications.show({
        title: 'Access Denied',
        message:
          'You do not have permission to create tickets according to the current workflow configuration.',
        color: primaryDark,
      });
      router.push('/dashboard');
    }
  }, [checkingPermission, canCreate, user, router, primaryDark]);

  const handleSubmit = async (values: DynamicTicketFormValues) => {
    try {
      // Convert DynamicTicketFormValues to CreateTicketInput
      const createTicketData: CreateTicketInput = {
        title: values.title,
        description: values.description,
        category: values.category, // Now sending category ID
        subcategory: values.subcategory, // Now sending subcategory ID
        priority: values.priority as CreateTicketInput['priority'],
        impact: values.impact as CreateTicketInput['impact'],
        urgency: values.urgency as CreateTicketInput['urgency'],
        customFields: (values.customFields || {}) as Record<string, string | number | boolean>,
      };

      const ticket = await createTicketMutation.mutateAsync(createTicketData);

      notifications.show({
        title: 'Success',
        message: 'Ticket created successfully',
        color: primaryLight,
      });

      // Redirect to the created ticket
      router.push(`/tickets/${ticket.id}`);
    } catch (error) {
      // Handle ticket creation error
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to create ticket',
        color: primaryDark,
      });
    }
  };

  if (status === 'loading' || checkingPermission) {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Redirecting to login...</div>;
  }

  if (!canCreate) {
    return <div>Checking permissions...</div>;
  }

  return <DynamicTicketForm onSubmit={handleSubmit} loading={createTicketMutation.isPending} />;
}
