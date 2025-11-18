'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketImpact,
  TicketUrgency,
  Comment,
  Attachment,
} from '../../../types/unified';

// Define types for ticket history
interface TicketHistoryItem {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface TicketWithHistory extends Ticket {
  history?: TicketHistoryItem[];
}
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Card,
  Textarea,
  ActionIcon,
  Menu,
  Modal,
  Alert,
  Loader,
  Tabs,
  Paper,
  Avatar,
  Timeline,
  Progress,
  Grid,
  Select,
  ScrollArea,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconMessage,
  IconPaperclip,
  IconUser,
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDownload,
  IconEye,
  IconDots,
  IconSend,
  IconHistory,
  IconBell,
  IconShare,
} from '@tabler/icons-react';
import { RTLArrowLeft } from '../../../components/ui/RTLIcon';
import {
  useTicket,
  useUpdateTicketStatus,
  useAssignTicket,
} from '../../../hooks/useTickets';
import { useCreateComment, useUpdateComment, useDeleteComment } from '../../../hooks/useComments';
import { useUsers, useSupportStaff } from '../../../hooks/useUsers';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useWorkflowTransitions } from '../../../hooks/useWorkflowTransitions';

import { notifications } from '@mantine/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { ROLE_GROUPS } from '../../../lib/constants';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function TicketDetailPage() {
  const { primaryLight, primaryLighter, primaryDark, primaryDarker, primaryLightest, primaryDarkest } = useDynamicTheme();

  const statusColors: Record<TicketStatus, string> = {
    NEW: primaryLight,
    OPEN: primaryLighter,
    IN_PROGRESS: primaryLighter,
    ON_HOLD: primaryLight,
    RESOLVED: primaryLighter,
    CLOSED: primaryDark,
    REOPENED: primaryDarker,
  };

  const priorityColors: Record<TicketPriority, string> = {
    LOW: primaryLightest,
    MEDIUM: primaryLight,
    HIGH: primaryDark,
    CRITICAL: primaryDarkest,
  };

  const impactColors: Record<TicketImpact, string> = {
    MINOR: primaryLightest,
    MODERATE: primaryLight,
    MAJOR: primaryDark,
    CRITICAL: primaryDarkest,
  };

  const urgencyColors: Record<TicketUrgency, string> = {
    LOW: primaryLightest,
    NORMAL: primaryLight,
    HIGH: primaryDark,
    IMMEDIATE: primaryDarkest,
  };
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const ticketId = params.id as string;
  const queryClient = useQueryClient();

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>(TicketStatus.NEW);
  const [statusComment, setStatusComment] = useState(''); // Comment for status changes
  const [newComment, setNewComment] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('details');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const { data: ticket, isLoading, error } = useTicket(ticketId);
  // Get support staff with ticket counts for assignment
  const { data: supportStaff, isLoading: supportStaffLoading } = useSupportStaff();
  
  // Get all users for resolving user IDs in history
  const { data: allUsers } = useUsers();
  const updateStatusMutation = useUpdateTicketStatus();
  const assignTicketMutation = useAssignTicket();
  const addCommentMutation = useCreateComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  
  // Get workflow-based transitions for the current ticket status
  // Pass workflowSnapshot if ticket has one (for tickets created with older workflow versions)
  const { 
    availableStatuses, 
    canTransitionToAny, 
    loading: transitionsLoading 
  } = useWorkflowTransitions(ticket?.status, ticket?.workflowSnapshot);

  // Helper function to resolve user ID to name
  const getUserName = (userId: string | null): string => {
    if (!userId) return 'Unassigned';
    const user = allUsers?.find(u => u.id === userId);
    return user?.name || userId;
  };

  // Helper function to format field name for display
  const formatFieldName = (fieldName: string): string => {
    if (fieldName === 'assignedToId') {
      return 'Assignment';
    }
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
  };

  const canEdit =
    ROLE_GROUPS.ADMIN_ONLY.includes(user?.activeRole as 'ADMIN') ||
    ROLE_GROUPS.MANAGEMENT.includes(
      user?.activeRole as 'SUPPORT_MANAGER' | 'ADMIN'
    ) ||
    (user?.activeRole === 'SUPPORT_STAFF' &&
      ticket?.assignedTo?.id === user?.id) ||
    (user?.activeRole === 'END_USER' &&
      ticket?.status === 'CLOSED' &&
      ticket?.requester?.id === user?.id);
  const canAssign = ROLE_GROUPS.MANAGEMENT.includes(
    user?.activeRole as 'SUPPORT_MANAGER' | 'ADMIN'
  );
  const canDelete = ROLE_GROUPS.ADMIN_ONLY.includes(
    user?.activeRole as 'ADMIN'
  );

  const handleStatusUpdate = async () => {
    // Check if the user can transition to the selected status based on workflow
    if (!availableStatuses.includes(newStatus)) {
      notifications.show({
        title: 'Access Denied',
        message:
          'You do not have permission to transition to this status according to the workflow configuration.',
        color: primaryDark,
      });
      return;
    }

    try {
      // Debug logging removed for production

      await updateStatusMutation.mutateAsync({
        id: ticketId,
        status: newStatus,
        comment: statusComment || undefined,
        currentStatus: ticket?.status || '',
        userRole: user?.activeRole,
      });

      // If a comment was provided, add it to the ticket comments
      if (statusComment?.trim()) {
        try {
          await addCommentMutation.mutateAsync({
            ticketId,
            content: statusComment,
            isInternal: false,
          });
        } catch {
          // Don't block the status update if comment fails
        }
      }

      notifications.show({
        title: 'Success',
        message: 'Ticket status updated successfully',
        color: primaryLight,
      });
      setStatusModalOpen(false);
      setStatusComment('');
    } catch (error) {
      // Extract error message from API response
      const errorMessage = 
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
        (error as Error)?.message || 
        'Failed to update ticket status';
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: primaryDark,
      });
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedAssignee) {
      notifications.show({
        title: 'Error',
        message: 'Please select a user to assign the ticket to',
        color: primaryDark,
      });
      return;
    }

    try {
      await assignTicketMutation.mutateAsync({
        id: ticketId,
        assignedToId: selectedAssignee,
      });
      notifications.show({
        title: 'Success',
        message: 'Ticket assigned successfully',
        color: primaryLight,
      });
      setAssignModalOpen(false);
      setSelectedAssignee(''); // Reset selection
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to assign ticket',
        color: primaryDark,
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a comment',
        color: primaryDark,
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      await addCommentMutation.mutateAsync({
        ticketId,
        content: newComment,
        isInternal: false,
      });
      notifications.show({
        title: 'Success',
        message: 'Comment added successfully',
        color: primaryLight,
      });
      setNewComment('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add comment',
        color: primaryDark,
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editCommentContent.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Comment cannot be empty',
        color: primaryDark,
      });
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        id: commentId,
        data: {
          content: editCommentContent,
        },
      });
      // Also invalidate the ticket query to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      notifications.show({
        title: 'Success',
        message: 'Comment updated successfully',
        color: primaryLight,
      });
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update comment',
        color: primaryDark,
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      await deleteCommentMutation.mutateAsync(deleteCommentId);
      // Also invalidate the ticket query to update comment count
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      notifications.show({
        title: 'Success',
        message: 'Comment deleted successfully',
        color: primaryLight,
      });
      setDeleteCommentId(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete comment',
        color: primaryDark,
      });
    }
  };

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
        <Alert icon={<IconAlertCircle size={16} />} title='Error' color='red'>
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

  return (
    <Container size='xl' py='md'>
      {/* Header */}
      <Group justify='space-between' mb='xl'>
        <Group>
          <Button
            variant='subtle'
            leftSection={<RTLArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <div>
            <Title order={1}>Ticket #{ticket.ticketNumber}</Title>
            <Text c='dimmed'>{ticket.title}</Text>
          </div>
        </Group>
        <Group>
          {canEdit && (
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => router.push(`/tickets/${ticketId}/edit`)}
            >
              Edit
            </Button>
          )}
          <Menu shadow='md' width={200}>
            <Menu.Target>
              <ActionIcon variant='subtle'>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconShare size={14} />}>Share</Menu.Item>
              <Menu.Item leftSection={<IconBell size={14} />}>
                Subscribe
              </Menu.Item>
              {canDelete && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color='red'
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Delete
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid>
        {/* Main Content */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value='details' leftSection={<IconEye size={16} />}>
                Details
              </Tabs.Tab>
              <Tabs.Tab
                value='comments'
                leftSection={<IconMessage size={16} />}
              >
                Comments ({ticket.comments?.length || 0})
              </Tabs.Tab>
              <Tabs.Tab
                value='attachments'
                leftSection={<IconPaperclip size={16} />}
              >
                Attachments ({ticket.attachments?.length || 0})
              </Tabs.Tab>
              <Tabs.Tab value='history' leftSection={<IconHistory size={16} />}>
                History
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value='details' pt='md'>
              <Stack gap='md'>
                <Paper withBorder p='md'>
                  <Title order={3} mb='md'>
                    Description
                  </Title>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: ticket.description || '',
                    }}
                    style={{
                      lineHeight: '1.6',
                      fontSize: '14px',
                      color: 'var(--mantine-color-text)',
                    }}
                  />
                </Paper>

                <Paper withBorder p='md'>
                  <Title order={3} mb='md'>
                    Comments
                  </Title>
                  <Stack gap='md'>
                    {ticket.comments?.map((comment: Comment) => (
                      <Card key={comment.id} withBorder p='md'>
                        <Group justify='space-between' mb='sm'>
                          <Group gap='sm'>
                            <Avatar size='sm' />
                            <div>
                              <Text fw={500} size='sm'>
                                {comment.user.name}
                              </Text>
                              <Text size='xs' c='dimmed'>
                                {comment.createdAt
                                  ? `${format(new Date(comment.createdAt), 'MMM dd, yyyy hh:mm a')} (${formatDistanceToNow(
                                      new Date(comment.createdAt),
                                      { addSuffix: true }
                                    )})`
                                  : 'Unknown time'}
                                {comment.updatedAt !== comment.createdAt && (
                                  <span> • Edited</span>
                                )}
                              </Text>
                            </div>
                          </Group>
                          <Group gap='xs'>
                            {comment.isInternal && (
                              <Badge size='xs' style={{ backgroundColor: primaryLight, color: 'white' }}>
                                Internal
                              </Badge>
                            )}
                            {user?.id === comment.userId && (
                              <Menu shadow='md' width={120}>
                                <Menu.Target>
                                  <ActionIcon variant='subtle' size='sm'>
                                    <IconDots size={16} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item
                                    leftSection={<IconEdit size={14} />}
                                    onClick={() => handleStartEdit(comment)}
                                  >
                                    Edit
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconTrash size={14} />}
                                    color='red'
                                    onClick={() => setDeleteCommentId(comment.id)}
                                  >
                                    Delete
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            )}
                          </Group>
                        </Group>
                        {editingCommentId === comment.id ? (
                          <Stack gap='sm'>
                            <Textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              minRows={3}
                              autosize
                            />
                            <Group justify='flex-end'>
                              <Button
                                variant='outline'
                                size='xs'
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                size='xs'
                                onClick={() => handleSaveEdit(comment.id)}
                                loading={updateCommentMutation.isPending}
                              >
                                Save
                              </Button>
                            </Group>
                          </Stack>
                        ) : (
                          <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                            {comment.content}
                          </Text>
                        )}
                      </Card>
                    ))}
                    {(!ticket.comments || ticket.comments.length === 0) && (
                      <Text c='dimmed' ta='center' py='xl'>
                        No comments yet. Be the first to add a comment!
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value='comments' pt='md'>
              <Stack gap='md'>
                <Paper withBorder p='md'>
                  <Group justify='space-between' mb='md'>
                    <Title order={3}>Comments</Title>
                    
                  </Group>
                  <Stack gap='md'>
                    {ticket.comments?.map((comment: Comment) => (
                      <Card key={comment.id} withBorder p='md'>
                        <Group justify='space-between' mb='sm'>
                          <Group gap='sm'>
                            <Avatar size='sm' />
                            <div>
                              <Text fw={500} size='sm'>
                                {comment.user.name}
                              </Text>
                              <Text size='xs' c='dimmed'>
                                {comment.createdAt
                                  ? `${format(new Date(comment.createdAt), 'MMM dd, yyyy hh:mm a')} (${formatDistanceToNow(
                                      new Date(comment.createdAt),
                                      { addSuffix: true }
                                    )})`
                                  : 'Unknown time'}
                                {comment.updatedAt !== comment.createdAt && (
                                  <span> • Edited</span>
                                )}
                              </Text>
                            </div>
                          </Group>
                          <Group gap='xs'>
                            {comment.isInternal && (
                              <Badge size='xs' style={{ backgroundColor: primaryLight, color: 'white' }}>
                                Internal
                              </Badge>
                            )}
                            {user?.id === comment.userId && (
                              <Menu shadow='md' width={120}>
                                <Menu.Target>
                                  <ActionIcon variant='subtle' size='sm'>
                                    <IconDots size={16} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item
                                    leftSection={<IconEdit size={14} />}
                                    onClick={() => handleStartEdit(comment)}
                                  >
                                    Edit
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconTrash size={14} />}
                                    color='red'
                                    onClick={() => setDeleteCommentId(comment.id)}
                                  >
                                    Delete
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            )}
                          </Group>
                        </Group>
                        {editingCommentId === comment.id ? (
                          <Stack gap='sm'>
                            <Textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              minRows={3}
                              autosize
                            />
                            <Group justify='flex-end'>
                              <Button
                                variant='outline'
                                size='xs'
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                size='xs'
                                onClick={() => handleSaveEdit(comment.id)}
                                loading={updateCommentMutation.isPending}
                              >
                                Save
                              </Button>
                            </Group>
                          </Stack>
                        ) : (
                          <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                            {comment.content}
                          </Text>
                        )}
                      </Card>
                    ))}
                    {(!ticket.comments || ticket.comments.length === 0) && (
                      <Text c='dimmed' ta='center' py='xl'>
                        No comments yet. Be the first to add a comment!
                      </Text>
                    )}
                  </Stack>
                  
                  {/* Add Comment Form */}
                  <Card withBorder p='md' mt='md'>
                    <Title order={4} mb='md'>
                      Add Comment
                    </Title>
                    <Stack gap='md'>
                      <Textarea
                        placeholder='Write your comment here...'
                        minRows={3}
                        maxRows={6}
                        autosize
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Group justify='flex-end'>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setNewComment('');
                          }}
                          disabled={!newComment.trim()}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isSubmittingComment}
                          loading={isSubmittingComment}
                        >
                          Add Comment
                        </Button>
                      </Group>
                    </Stack>
                  </Card>
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value='attachments' pt='md'>
              <Paper withBorder p='md'>
                <Group justify='space-between' mb='md'>
                  <Title order={3}>Attachments</Title>
                  <Button leftSection={<IconPaperclip size={16} />}>
                    Upload File
                  </Button>
                </Group>
                <Stack gap='md'>
                  {ticket.attachments?.map((attachment: Attachment) => (
                    <Card key={attachment.id} withBorder p='md'>
                      <Group justify='space-between'>
                        <Group gap='sm'>
                          <IconPaperclip size={16} />
                          <div>
                            <Text fw={500} size='sm'>
                              {attachment.filename}
                            </Text>
                            <Text size='xs' c='dimmed'>
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </Text>
                          </div>
                        </Group>
                        <ActionIcon variant='subtle'>
                          <IconDownload size={16} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))}
                  {(!ticket.attachments || ticket.attachments.length === 0) && (
                    <Text c='dimmed' ta='center' py='xl'>
                      No attachments yet.
                    </Text>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value='history' pt='md'>
              <Paper withBorder p='md'>
                <Title order={3} mb='md'>
                  Ticket History
                </Title>
                <ScrollArea h={400} type='scroll'>
                  <Timeline active={-1} bulletSize={24} lineWidth={2}>
                    {/* Ticket Creation */}
                    <Timeline.Item
                      bullet={<IconCheck size={12} />}
                      title='Ticket Created'
                    >
                      <Text c='dimmed' size='sm'>
                        Created by {ticket.requester?.name} on{' '}
                        {new Date(ticket.createdAt).toLocaleString()}
                      </Text>
                    </Timeline.Item>

                    {/* All History Changes - Reverse Chronological Order */}
                    {(() => {
                      const ticketHistory = (ticket as TicketWithHistory)
                        .history;
                      return (
                        ticketHistory &&
                        ticketHistory.length > 0 &&
                        [...ticketHistory]
                          .sort(
                            (a: TicketHistoryItem, b: TicketHistoryItem) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          )
                          .map((historyItem: TicketHistoryItem) => (
                            <Timeline.Item
                              key={historyItem.id}
                              bullet={<IconEdit size={12} />}
                              title={`${formatFieldName(historyItem.fieldName)} Changed`}
                            >
                              <Text c='dimmed' size='sm' mb={4}>
                                Changed by{' '}
                                {historyItem.user?.name || 'Unknown User'} on{' '}
                                {new Date(
                                  historyItem.createdAt
                                ).toLocaleString()}
                              </Text>
                              <Group gap='xs' mb={4}>
                                <Badge size='sm' variant='outline' style={{ borderColor: primaryDarker, color: primaryDarker }}>
                                  {historyItem.fieldName === 'assignedToId' 
                                    ? getUserName(historyItem.oldValue) 
                                    : (historyItem.oldValue || 'Empty')}
                                </Badge>
                                <Text size='sm' c='dimmed'>
                                  →
                                </Text>
                                <Badge size='sm' variant='filled' style={{ backgroundColor: primaryLighter, color: 'white' }}>
                                  {historyItem.fieldName === 'assignedToId' 
                                    ? getUserName(historyItem.newValue) 
                                    : (historyItem.newValue || 'Empty')}
                                </Badge>
                              </Group>
                            </Timeline.Item>
                          ))
                      );
                    })()}

                    {/* Last Updated (if no history or different from last history item) */}
                    {ticket.updatedAt !== ticket.createdAt &&
                      (!(ticket as TicketWithHistory).history ||
                        (ticket as TicketWithHistory).history?.length === 0 ||
                        new Date(ticket.updatedAt).getTime() !==
                          new Date(
                            ((ticket as TicketWithHistory).history || [])[
                              ((ticket as TicketWithHistory).history || [])
                                .length - 1
                            ]?.createdAt
                          ).getTime()) && (
                        <Timeline.Item
                          bullet={<IconEdit size={12} />}
                          title='Last Updated'
                        >
                          <Text c='dimmed' size='sm'>
                            Updated on{' '}
                            {new Date(ticket.updatedAt).toLocaleString()}
                          </Text>
                        </Timeline.Item>
                      )}

                    {/* Ticket Closed */}
                    {ticket.closedAt && (
                      <Timeline.Item
                        bullet={<IconX size={12} />}
                        title='Ticket Closed'
                      >
                        <Text c='dimmed' size='sm'>
                          Closed on {new Date(ticket.closedAt).toLocaleString()}
                        </Text>
                      </Timeline.Item>
                    )}
                  </Timeline>
                </ScrollArea>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>

        {/* Sidebar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap='md'>
            {/* Status Card */}
            <Card withBorder p='md'>
              <Title order={4} mb='md'>
                Status & Priority
              </Title>
              <Stack gap='sm'>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Status
                  </Text>
                  <Badge
                    color={statusColors[ticket.status as TicketStatus]}
                    variant='light'
                  >
                    {ticket.status?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Priority
                  </Text>
                  <Badge
                    color={priorityColors[ticket.priority as TicketPriority]}
                    variant='outline'
                  >
                    {ticket.priority}
                  </Badge>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Impact
                  </Text>
                  <Badge
                    color={impactColors[ticket.impact as TicketImpact]}
                    variant='outline'
                  >
                    {ticket.impact}
                  </Badge>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Urgency
                  </Text>
                  <Badge
                    color={urgencyColors[ticket.urgency as TicketUrgency]}
                    variant='outline'
                  >
                    {ticket.urgency}
                  </Badge>
                </Group>
                
                {/* Custom Fields */}
                {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
                  <>
                    <div style={{ borderTop: '1px solid var(--mantine-color-gray-3)', margin: '8px 0' }} />
                    {Object.entries(ticket.customFields).map(([fieldName, fieldValue]) => (
                      <Group key={fieldName} justify='space-between'>
                        <Text size='sm' fw={500}>
                          {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                        </Text>
                        <Badge
                          color='blue'
                          variant='light'
                          size='sm'
                        >
                          {fieldValue}
                        </Badge>
                      </Group>
                    ))}
                  </>
                )}
                {!transitionsLoading && canTransitionToAny && (
                      <Button
                        variant='light'
                        size='sm'
                    onClick={() => {
                      setNewStatus(ticket.status as TicketStatus);
                      setStatusComment('');
                      setStatusModalOpen(true);
                    }}
                  >
                    Update Status
                      </Button>
                )}
                {!transitionsLoading && !canTransitionToAny && (
                      <Button
                        variant='light'
                        size='sm'
                    disabled
                    title="No transitions available from current status"
                      >
                        Update Status
                      </Button>
                )}
              </Stack>
            </Card>

            {/* Assignment Card */}
            <Card withBorder p='md'>
              <Title order={4} mb='md'>
                Assignment
              </Title>
              <Stack gap='sm'>
                <Group gap='sm'>
                  <IconUser size={16} />
                  <div>
                    <Text size='sm' fw={500}>
                      Requester
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.requester?.name}
                    </Text>
                  </div>
                </Group>
                <Group gap='sm'>
                  <IconUser size={16} />
                  <div>
                    <Text size='sm' fw={500}>
                      Assigned To
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.assignedTo?.name || 'Unassigned'}
                    </Text>
                  </div>
                </Group>
                {canAssign && (
                  <Button
                    variant='light'
                    size='sm'
                    onClick={() => setAssignModalOpen(true)}
                  >
                    Assign Ticket
                  </Button>
                )}
              </Stack>
            </Card>

            {/* Details Card */}
            <Card withBorder p='md'>
              <Title order={4} mb='md'>
                Details
              </Title>
              <Stack gap='sm'>
                <Group gap='sm'>
                  <IconCalendar size={16} />
                  <div>
                    <Text size='sm' fw={500}>
                      Created
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                </Group>
                <Group gap='sm'>
                  <IconClock size={16} />
                  <div>
                    <Text size='sm' fw={500}>
                      Last Updated
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.updatedAt
                        ? formatDistanceToNow(new Date(ticket.updatedAt), {
                            addSuffix: true,
                          })
                        : 'Unknown time'}
                    </Text>
                  </div>
                </Group>
                <Group gap='sm'>
                  <IconUser size={16} />
                  <div>
                    <Text size='sm' fw={500}>
                      Category
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {ticket.category?.customName || ticket.category?.name || 'Unknown'} -{' '}
                      {ticket.subcategory?.name || 'Unknown'}
                    </Text>
                  </div>
                </Group>
                {ticket.dueDate && (
                  <Group gap='sm'>
                    <IconClock size={16} />
                    <div>
                      <Text size='sm' fw={500}>
                        Due Date
                      </Text>
                      <Text size='sm' c='dimmed'>
                        {new Date(ticket.dueDate).toLocaleDateString()}
                      </Text>
                    </div>
                  </Group>
                )}
              </Stack>
            </Card>

            {/* SLA Card */}
            {ticket.slaCompliance !== undefined && (
              <Card withBorder p='md'>
                <Title order={4} mb='md'>
                  SLA Compliance
                </Title>
                <Stack gap='sm'>
                  <div>
                    <Group justify='space-between' mb='xs'>
                      <Text size='sm'>Response Time</Text>
                      <Text size='sm' fw={500}>
                        {ticket.responseTime
                          ? `${ticket.responseTime}h`
                          : 'N/A'}
                      </Text>
                    </Group>
                    <Progress value={ticket.slaCompliance} size='sm' />
                  </div>
                  <Text size='xs' c='dimmed'>
                    SLA Level: {ticket.slaLevel}
                  </Text>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Status Update Modal */}
      <Modal
        opened={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setStatusComment('');
        }}
        title='Update Ticket Status'
        centered
      >
        <Stack gap='md'>
          <Select
            label='New Status'
            placeholder='Select a status to transition to'
            data={availableStatuses.map(status => ({
                    value: status,
              label: status.replace('_', ' '),
            }))}
            value={newStatus}
            onChange={value => setNewStatus(value as TicketStatus)}
          />
          <Textarea
            label='Comment'
            description='Provide a reason or note for this status change (may be required by workflow)'
            placeholder='Add a comment about this status change...'
            value={statusComment}
            onChange={e => setStatusComment(e.target.value)}
            minRows={2}
          />
          <Group justify='flex-end'>
            <Button variant='outline' onClick={() => {
              setStatusModalOpen(false);
              setStatusComment('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              loading={updateStatusMutation.isPending}
            >
              Update Status
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        opened={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title='Assign Ticket'
        centered
      >
        <Stack gap='md'>
          <Select
            label='Assign To'
            placeholder={supportStaffLoading ? 'Loading users...' : 'Select a user'}
            data={
              supportStaff?.map(user => ({
                value: user.id,
                label: `${user.name} (${user.openTicketCount || 0})`,
              })) || []
            }
            value={selectedAssignee}
            onChange={value => setSelectedAssignee(value || '')}
            searchable
            disabled={supportStaffLoading}
          />
          <Group justify='flex-end'>
            <Button variant='outline' onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignTicket}
              loading={assignTicketMutation.isPending}
              disabled={!selectedAssignee}
            >
              Assign
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Comment Modal */}
      <Modal
        opened={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        title='Add Comment'
        centered
        size='lg'
        fullScreen
      >
        <Stack gap='md'>
          <Textarea
            label='Comment'
            placeholder='Add your comment here...'
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            minRows={4}
            required
          />
          <Group justify='flex-end'>
            <Button
              variant='outline'
              onClick={() => setCommentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddComment}
              loading={addCommentMutation.isPending}
              leftSection={<IconSend size={16} />}
            >
              Add Comment
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Comment Modal */}
      <Modal
        opened={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        title='Delete Comment'
        centered
      >
        <Stack gap='md'>
          <Text>
            Are you sure you want to delete this comment? This action cannot be undone.
          </Text>
          <Group justify='flex-end'>
            <Button variant='outline' onClick={() => setDeleteCommentId(null)}>
              Cancel
            </Button>
            <Button
              color='red'
              onClick={handleDeleteComment}
              loading={deleteCommentMutation.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete Ticket'
        centered
      >
        <Stack gap='md'>
          <Text>
            Are you sure you want to delete ticket #{ticket.ticketNumber}? This
            action cannot be undone.
          </Text>
          <Group justify='flex-end'>
            <Button variant='outline' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color='red'>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
