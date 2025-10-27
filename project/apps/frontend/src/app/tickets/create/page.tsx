'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import { DynamicTicketForm } from '../../../components/forms/DynamicTicketForm';
import { DynamicTicketFormValues, UserRole } from '../../../types/unified';
import { ticketApi, CreateTicketInput } from '../../../lib/apiClient';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function CreateTicketPage() {
  const router = useRouter();
  const { status } = useSession();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please log in to create a ticket',
        color: 'red',
      });
      router.push('/auth/signin');
    } else if (user && user.activeRole !== UserRole.END_USER) {
      notifications.show({
        title: 'Access Denied',
        message:
          'Only end users can create tickets. Please switch to your end user role.',
        color: 'red',
      });
      router.push('/dashboard');
    }
  }, [status, user, router]);

  const handleSubmit = async (values: DynamicTicketFormValues) => {
    setLoading(true);

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
        slaLevel: values.slaLevel as CreateTicketInput['slaLevel'],
        customFields: (values.customFields || {}) as Record<string, string | number | boolean>,
      };

      const response = await ticketApi.createTicket(createTicketData);
      const result = response.data;

      notifications.show({
        title: 'Success',
        message: 'Ticket created successfully',
        color: 'green',
      });

      // Redirect to the created ticket
      router.push(`/tickets/${result.data.id}`);
    } catch (error) {
      // Handle ticket creation error
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to create ticket',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Redirecting to login...</div>;
  }

  return <DynamicTicketForm onSubmit={handleSubmit} loading={loading} />;
}
