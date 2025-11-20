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
import { useAuthStore } from '../../../../stores/useAuthStore';
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketImpact,
  TicketUrgency,
  SlaLevel,
} from '../../../../types/unified';
import { useDynamicTheme } from '../../../../hooks/useDynamicTheme';

export default function EditTicketPage() {
  const theme = useMantineTheme();
  const { primaryLight, primaryDark } = useDynamicTheme();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
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
      urgency: ticket?.urgency || TicketUrgency.NORMAL,
      slaLevel: ticket?.slaLevel || SlaLevel.STANDARD,
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

  const canEdit =
    user?.activeRole === 'ADMIN' ||
    user?.activeRole === 'SUPPORT_MANAGER' ||
    (user?.activeRole === 'SUPPORT_STAFF' &&
      ticket?.assignedTo?.id === user?.id);

  if (isLoading) {
    return (
      <Container size='xl' py='md'>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
          <Text>Loading ticket details...</Text>
        </Group>
      </Container>
    );
  }

  if (error || !ticket) {
    return (
      <Container size='xl' py='md'>
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color={theme.colors[theme.primaryColor][9]}>
          Failed to load ticket: {error?.message || 'Ticket not found'}
        </Alert>
        <Group mt='md'>
          <Button
            variant='outline'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Group>
      </Container>
    );
  }

  if (!canEdit) {
    return (
      <Container size='xl' py='md'>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title='Access Denied'
          color={theme.colors[theme.primaryColor][9]}
        >
          You don't have permission to edit this ticket.
        </Alert>
        <Group mt='md'>
          <Button
            variant='outline'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Group>
      </Container>
    );
  }

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <Group>
          <Button
            variant='subtle'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={handleCancel}
          >
            Back to Ticket
          </Button>
          <div>
            <Title order={1}>Edit Ticket {ticket.ticketNumber}</Title>
            <Text c='dimmed'>Update ticket information and status</Text>
          </div>
        </Group>
        <Group>
          {updateTicketMutation.isPending && <Loader size='sm' />}
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            loading={isSubmitting}
            onClick={() => form.onSubmit(handleSubmit)()}
          >
            Save Changes
          </Button>
        </Group>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid>
          <Grid.Col span={8}>
            <Stack gap='md'>
              <Card withBorder p='md'>
                <Title order={3} mb='md'>
                  Basic Information
                </Title>
                <Stack gap='md'>
                  <TextInput
                    label='Title'
                    placeholder='Brief description of the issue'
                    required
                    {...form.getInputProps('title')}
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
                  />
                </Stack>
              </Card>

              <Card withBorder p='md'>
                <Title order={3} mb='md'>
                  Classification
                </Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label='Category'
                      placeholder='Select category'
                      required
                      data={Object.values(TicketCategory).map(cat => ({
                        value: cat as string,
                        label: (cat as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('category')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label='Priority'
                      placeholder='Select priority'
                      required
                      data={Object.values(TicketPriority).map(pri => ({
                        value: pri as string,
                        label: (pri as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('priority')}
                    />
                  </Grid.Col>
                </Grid>
                <Grid mt='md'>
                  <Grid.Col span={4}>
                    <Select
                      label='Impact'
                      placeholder='Select impact'
                      required
                      data={Object.values(TicketImpact).map(imp => ({
                        value: imp as string,
                        label: (imp as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('impact')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      label='Urgency'
                      placeholder='Select urgency'
                      required
                      data={Object.values(TicketUrgency).map(urg => ({
                        value: urg as string,
                        label: (urg as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('urgency')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      label='SLA Level'
                      placeholder='Select SLA level'
                      required
                      data={Object.values(SlaLevel).map(sla => ({
                        value: sla as string,
                        label: (sla as string).replace('_', ' '),
                      }))}
                      {...form.getInputProps('slaLevel')}
                    />
                  </Grid.Col>
                </Grid>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap='md'>
              <Card withBorder p='md'>
                <Title order={4} mb='md'>
                  Status & Resolution
                </Title>
                <Stack gap='md'>
                  <Select
                    label='Status'
                    placeholder='Select status'
                    required
                    data={Object.values(TicketStatus).map(status => ({
                      value: status as string,
                      label: (status as string).replace('_', ' '),
                    }))}
                    {...form.getInputProps('status')}
                  />
                  {(form.values.status === 'RESOLVED' ||
                    form.values.status === 'CLOSED') && (
                    <RichTextEditorComponent
                      label='Resolution Notes'
                      placeholder='Describe how the issue was resolved...'
                      minHeight={150}
                      maxHeight={300}
                      value={form.values.resolution}
                      onChange={(value: string) =>
                        form.setFieldValue('resolution', value)
                      }
                      allowImageUpload={false}
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
                    />
                  )}
                </Stack>
              </Card>

              <Card withBorder p='md'>
                <Title order={4} mb='md'>
                  Ticket Information
                </Title>
                <Stack gap='sm'>
                  <Group justify='space-between'>
                    <Text size='sm' fw={500}>
                      Ticket Number
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.ticketNumber}
                    </Text>
                  </Group>
                  <Group justify='space-between'>
                    <Text size='sm' fw={500}>
                      Created By
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.requester.name}
                    </Text>
                  </Group>
                  <Group justify='space-between'>
                    <Text size='sm' fw={500}>
                      Assigned To
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.assignedTo?.name || 'Unassigned'}
                    </Text>
                  </Group>
                  <Group justify='space-between'>
                    <Text size='sm' fw={500}>
                      Created
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Group justify='space-between'>
                    <Text size='sm' fw={500}>
                      Last Updated
                    </Text>
                    <Text size='sm' c='dimmed'>
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
        >
          Failed to update ticket. Please check the form and try again.
        </Alert>
      )}
    </Container>
  );
}
