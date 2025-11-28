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
import { useUploadAttachment } from '../../../hooks/useAttachments';
import { UploadedFileInfo } from '../../../components/forms/FileUpload';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateTicketPage() {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { canCreate, loading: checkingPermission } = useCanCreateTicket();
  const createTicketMutation = useCreateTicket();
  const uploadAttachmentMutation = useUploadAttachment();
  const queryClient = useQueryClient();

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
        customFields: (values.customFields || {}) as Record<string, string | number | boolean>,
      };

      const ticket = await createTicketMutation.mutateAsync(createTicketData);

      // Upload attachments after ticket creation
      const uploadedFiles = (values as DynamicTicketFormValues & { uploadedFiles?: UploadedFileInfo[] }).uploadedFiles;
      if (uploadedFiles && uploadedFiles.length > 0) {
        try {
          // Upload each completed file to create attachment records
          const uploadPromises = uploadedFiles
            .filter(fileInfo => fileInfo.status === 'completed' && fileInfo.file)
            .map(fileInfo => 
              uploadAttachmentMutation.mutateAsync({
                ticketId: ticket.id,
                file: fileInfo.file,
              }).catch(error => {
                // Log error but don't fail the whole operation
                // eslint-disable-next-line no-console
                console.error(`Failed to upload attachment ${fileInfo.file.name}:`, error);
                notifications.show({
                  title: 'Warning',
                  message: `Failed to upload ${fileInfo.file.name}. You can upload it later.`,
                  color: 'yellow',
                });
                return null;
              })
            );
          
          await Promise.all(uploadPromises);
          
          // Invalidate ticket query to refresh attachments
          queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
        } catch (error) {
          // Log error but don't block ticket creation success
          // eslint-disable-next-line no-console
          console.error('Error uploading attachments:', error);
        }
      }

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
