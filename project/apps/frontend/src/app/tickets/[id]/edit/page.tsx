'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Stack,
  Alert,
  Loader,
  Grid,
  Select,
  TextInput,
  useMantineTheme,
} from '@mantine/core';
import { RichTextEditorComponent } from '../../../../components/ui/RichTextEditor';
import { IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react';
import { RTLArrowLeft } from '../../../../components/ui/RTLIcon';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTicket, useUpdateTicket } from '../../../../hooks/useTickets';
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketImpact,
} from '../../../../types/unified';
import { useDynamicTheme } from '../../../../hooks/useDynamicTheme';

export default function EditTicketPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticket, isLoading, error } = useTicket(ticketId);
  const updateTicketMutation = useUpdateTicket();

  // Memoize initial values to prevent form recreation
  const initialValues = useMemo(
    () => ({
      title: ticket?.title || '',
      description: ticket?.description || '',
      category:
        (ticket?.category?.name as TicketCategory) || TicketCategory.SOFTWARE,
      priority: ticket?.priority || TicketPriority.MEDIUM,
      impact: ticket?.impact || TicketImpact.MODERATE,
      status: ticket?.status || TicketStatus.NEW,
      resolution: ticket?.resolution || '',
    }),
    [ticket]
  );

  const form = useForm({
    initialValues,
    validate: {
      title: value => (!value ? 'Title is required' : null),
      description: value => (!value ? 'Description is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        data: values,
      });
      notifications.show({
        title: 'Success',
        message: 'Ticket updated successfully',
        color: primaryLight,
      });
      router.push(`/tickets/${ticketId}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update ticket',
        color: primaryDark,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/tickets/${ticketId}`);
  };

  if (isLoading) {
    return (
      <Container size='xl' py='md' data-testid="edit-ticket-page-loading">
        <Group justify='center' mt='xl' data-testid="edit-ticket-page-loading-group">
          <Loader size='lg' data-testid="edit-ticket-page-loader" />
          <Text data-testid="edit-ticket-page-loading-text">Loading ticket details...</Text>
        </Group>
      </Container>
    );
  }

  if (error || !ticket) {
    return (
      <Container size='xl' py='md' data-testid="edit-ticket-page-error">
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]} data-testid="edit-ticket-page-error-alert">
          Failed to load ticket: {error?.message || 'Ticket not found'}
        </Alert>
        <Group mt='md' data-testid="edit-ticket-page-error-actions">
          <Button
            variant='outline'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.back()}
            data-testid="edit-ticket-page-error-back-button"
          >
            Go Back
          </Button>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md' data-testid="edit-ticket-page">
      <Group justify='space-between' mb='xl' data-testid="edit-ticket-page-header">
        <Group data-testid="edit-ticket-page-header-left">
          <Button
            variant='subtle'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={handleCancel}
            data-testid="edit-ticket-page-back-button"
          >
            Back to Ticket
          </Button>
          <div data-testid="edit-ticket-page-header-content">
            <Title order={1} data-testid="edit-ticket-page-title">Edit Ticket {ticket.ticketNumber}</Title>
            <Text c='dimmed' data-testid="edit-ticket-page-subtitle">Update ticket information and status</Text>
          </div>
        </Group>
        <Group data-testid="edit-ticket-page-header-right">
          {updateTicketMutation.isPending && <Loader size='sm' data-testid="edit-ticket-page-save-loader" />}
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            loading={isSubmitting}
            onClick={() => form.onSubmit(handleSubmit)()}
            data-testid="edit-ticket-page-save-button"
          >
            Save Changes
          </Button>
        </Group>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)} data-testid="edit-ticket-page-form">
        <Grid data-testid="edit-ticket-page-form-grid">
          <Grid.Col span={8} data-testid="edit-ticket-page-form-left-col">
            <Stack gap='md' data-testid="edit-ticket-page-form-left-stack">
              <Card withBorder p='md' data-testid="edit-ticket-page-basic-info-card">
                <Title order={3} mb='md' data-testid="edit-ticket-page-basic-info-title">
                  Basic Information
                </Title>
                <Stack gap='md' data-testid="edit-ticket-page-basic-info-stack">
                  <TextInput
                    label='Title'
                    placeholder='Brief description of the issue'
                    required
                    {...form.getInputProps('title')}
                    data-testid="edit-ticket-page-title-input"
                  />
                  <RichTextEditorComponent
                    label='Description'
                    placeholder='Detailed description of the issue'
                    required
                    minHeight={200}
                    maxHeight={400}
                    value={form.values.description}
                    onChange={(value: string) =>
                      form.setFieldValue('description', value)
                    }
                    error={form.errors.description}
                    allowImageUpload={true}
                    allowTableInsertion={true}
                    allowCodeBlocks={true}
                    allowHeadings={true}
                    allowLists={true}
                    allowTextFormatting={true}
                    allowTextAlignment={true}
                    allowTextColor={false}
                    allowHighlight={true}
                    allowLinks={true}
                    allowUndoRedo={true}
                    allowClearFormatting={true}
                    showToolbar={true}
                    toolbarPosition='top'
                    data-testid="edit-ticket-page-description-editor"
                  />
                </Stack>
              </Card>

              <Card withBorder p='md' data-testid="edit-ticket-page-classification-card">
                <Title order={3} mb='md' data-testid="edit-ticket-page-classification-title">
                  Classification
                </Title>
                <Grid data-testid="edit-ticket-page-classification-grid">
                  <Grid.Col span={6} data-testid="edit-ticket-page-category-col">
                    <Select
                      label='Category'
                      placeholder='Select category'
                      required
                      data={Object.values(TicketCategory).map(cat => ({
                        value: cat as string,
                        label: (cat as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('category')}
                      data-testid="edit-ticket-page-category-select"
                    />
                  </Grid.Col>
                  <Grid.Col span={6} data-testid="edit-ticket-page-priority-col">
                    <Select
                      label='Priority'
                      placeholder='Select priority'
                      required
                      data={Object.values(TicketPriority).map(pri => ({
                        value: pri as string,
                        label: (pri as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('priority')}
                      data-testid="edit-ticket-page-priority-select"
                    />
                  </Grid.Col>
                </Grid>
                <Grid mt='md' data-testid="edit-ticket-page-impact-grid">
                  <Grid.Col span={4} data-testid="edit-ticket-page-impact-col">
                    <Select
                      label='Impact'
                      placeholder='Select impact'
                      required
                      data={Object.values(TicketImpact).map(imp => ({
                        value: imp as string,
                        label: (imp as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('impact')}
                      data-testid="edit-ticket-page-impact-select"
                    />
                  </Grid.Col>
                </Grid>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={4} data-testid="edit-ticket-page-form-right-col">
            <Stack gap='md' data-testid="edit-ticket-page-form-right-stack">
              <Card withBorder p='md' data-testid="edit-ticket-page-info-card">
                <Title order={4} mb='md' data-testid="edit-ticket-page-info-title">
                  Ticket Information
                </Title>
                <Stack gap='sm' data-testid="edit-ticket-page-info-stack">
                  <Group justify='space-between' data-testid="edit-ticket-page-info-ticket-number">
                    <Text size='sm' fw={500} data-testid="edit-ticket-page-info-ticket-number-label">
                      Ticket Number
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="edit-ticket-page-info-ticket-number-value">
                      {ticket.ticketNumber}
                    </Text>
                  </Group>
                  <Group justify='space-between' data-testid="edit-ticket-page-info-created-by">
                    <Text size='sm' fw={500} data-testid="edit-ticket-page-info-created-by-label">
                      Created By
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="edit-ticket-page-info-created-by-value">
                      {ticket.requester.name}
                    </Text>
                  </Group>
                  <Group justify='space-between' data-testid="edit-ticket-page-info-assigned-to">
                    <Text size='sm' fw={500} data-testid="edit-ticket-page-info-assigned-to-label">
                      Assigned To
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="edit-ticket-page-info-assigned-to-value">
                      {ticket.assignedTo?.name || 'Unassigned'}
                    </Text>
                  </Group>
                  <Group justify='space-between' data-testid="edit-ticket-page-info-created">
                    <Text size='sm' fw={500} data-testid="edit-ticket-page-info-created-label">
                      Created
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="edit-ticket-page-info-created-value">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Group justify='space-between' data-testid="edit-ticket-page-info-updated">
                    <Text size='sm' fw={500} data-testid="edit-ticket-page-info-updated-label">
                      Last Updated
                    </Text>
                    <Text size='sm' c='dimmed' data-testid="edit-ticket-page-info-updated-value">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </form>

      {updateTicketMutation.isError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title='Error'
          color={theme.colors[theme.primaryColor][9]}
          mt='md'
          data-testid="edit-ticket-page-update-error-alert"
        >
          Failed to update ticket. Please check the form and try again.
        </Alert>
      )}
    </Container>
  );
}
