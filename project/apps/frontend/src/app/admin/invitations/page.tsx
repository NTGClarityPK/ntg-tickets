'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  MultiSelect,
  Alert,
  Tabs,
  Tooltip,
  Menu,
  Loader,
  Center,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconRefresh,
  IconTrash,
  IconMail,
  IconDotsVertical,
  IconCheck,
  IconClock,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react';
import { TenantInvitation } from '@/types/unified';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

const roleOptions = [
  { value: 'END_USER', label: 'End User' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff' },
  { value: 'SUPPORT_MANAGER', label: 'Support Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

interface InviteFormValues {
  email: string;
  name: string;
  roles: string[];
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { primary, primaryLight, primaryDark } = useDynamicTheme();

  const form = useForm<InviteFormValues>({
    initialValues: {
      email: '',
      name: '',
      roles: ['END_USER'],
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      roles: (value) => (value.length === 0 ? 'Select at least one role' : null),
    },
  });

  const fetchInvitations = async (status?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = status
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/invitations?status=${status}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/invitations`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch invitations');

      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load invitations',
        color: primaryDark,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations(activeTab || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleInvite = async (values: InviteFormValues) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send invitation');
      }

      notifications.show({
        title: 'Success',
        message: `Invitation sent to ${values.email}`,
        color: primary,
        icon: <IconCheck size={16} />,
      });

      setIsModalOpen(false);
      form.reset();
      fetchInvitations(activeTab || undefined);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to send invitation',
        color: primaryDark,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/invitations/${id}/resend`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to resend invitation');

      notifications.show({
        title: 'Success',
        message: 'Invitation resent successfully',
        color: primary,
      });

      fetchInvitations(activeTab || undefined);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to resend invitation',
        color: primaryDark,
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/invitations/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to cancel invitation');

      notifications.show({
        title: 'Success',
        message: 'Invitation cancelled',
        color: primary,
      });

      fetchInvitations(activeTab || undefined);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to cancel invitation',
        color: primaryDark,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge style={{ backgroundColor: primaryLight, color: '#fff' }} leftSection={<IconClock size={12} />}>Pending</Badge>;
      case 'accepted':
        return <Badge style={{ backgroundColor: primary, color: '#fff' }} leftSection={<IconCheck size={12} />}>Accepted</Badge>;
      case 'expired':
        return <Badge style={{ backgroundColor: primaryDark, color: '#fff' }} leftSection={<IconX size={12} />}>Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container size="xl" py="xl" data-testid="invitations-page">
      <Stack gap="lg" data-testid="invitations-page-stack">
        <Group justify="space-between" data-testid="invitations-page-header">
          <Box data-testid="invitations-page-header-content">
            <Title order={2} data-testid="invitations-page-title">User Invitations</Title>
            <Text c="dimmed" data-testid="invitations-page-subtitle">Invite users to join your organization</Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
            data-testid="invitations-page-invite-button"
          >
            Invite User
          </Button>
        </Group>

        <Paper withBorder radius="md" data-testid="invitations-page-paper">
          <Tabs value={activeTab} onChange={setActiveTab} data-testid="invitations-page-tabs">
            <Tabs.List data-testid="invitations-page-tabs-list">
              <Tabs.Tab value="pending" leftSection={<IconClock size={14} />} data-testid="invitations-page-tab-pending">
                Pending
              </Tabs.Tab>
              <Tabs.Tab value="accepted" leftSection={<IconCheck size={14} />} data-testid="invitations-page-tab-accepted">
                Accepted
              </Tabs.Tab>
              <Tabs.Tab value="expired" leftSection={<IconX size={14} />} data-testid="invitations-page-tab-expired">
                Expired
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || 'pending'} p="md" data-testid={`invitations-page-panel-${activeTab || 'pending'}`}>
              {isLoading ? (
                <Center py="xl" data-testid="invitations-page-loading">
                  <Loader data-testid="invitations-page-loader" />
                </Center>
              ) : invitations.length === 0 ? (
                <Center py="xl" data-testid="invitations-page-empty-state">
                  <Stack align="center" gap="md" data-testid="invitations-page-empty-state-content">
                    <IconMail size={48} color="gray" data-testid="invitations-page-empty-state-icon" />
                    <Text c="dimmed" data-testid="invitations-page-empty-state-text">No {activeTab} invitations</Text>
                  </Stack>
                </Center>
              ) : (
                <Table data-testid="invitations-page-table">
                  <Table.Thead data-testid="invitations-page-table-head">
                    <Table.Tr data-testid="invitations-page-table-head-row">
                      <Table.Th data-testid="invitations-page-table-header-email">Email</Table.Th>
                      <Table.Th data-testid="invitations-page-table-header-name">Name</Table.Th>
                      <Table.Th data-testid="invitations-page-table-header-roles">Roles</Table.Th>
                      <Table.Th data-testid="invitations-page-table-header-invited-by">Invited By</Table.Th>
                      <Table.Th data-testid="invitations-page-table-header-date">Date</Table.Th>
                      <Table.Th data-testid="invitations-page-table-header-status">Status</Table.Th>
                      <Table.Th data-testid="invitations-page-table-header-actions">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody data-testid="invitations-page-table-body">
                    {invitations.map((invitation) => (
                      <Table.Tr key={invitation.id} data-testid={`invitations-page-table-row-${invitation.id}`}>
                        <Table.Td data-testid={`invitations-page-table-cell-email-${invitation.id}`}>{invitation.email}</Table.Td>
                        <Table.Td data-testid={`invitations-page-table-cell-name-${invitation.id}`}>{invitation.name || '-'}</Table.Td>
                        <Table.Td data-testid={`invitations-page-table-cell-roles-${invitation.id}`}>
                          <Group gap={4} data-testid={`invitations-page-table-cell-roles-group-${invitation.id}`}>
                            {invitation.roles.map((role) => (
                              <Badge key={role} size="sm" variant="light" data-testid={`invitations-page-table-cell-role-badge-${invitation.id}-${role}`}>
                                {role.replace('_', ' ')}
                              </Badge>
                            ))}
                          </Group>
                        </Table.Td>
                        <Table.Td data-testid={`invitations-page-table-cell-inviter-${invitation.id}`}>{invitation.inviter?.name || '-'}</Table.Td>
                        <Table.Td data-testid={`invitations-page-table-cell-date-${invitation.id}`}>{formatDate(invitation.createdAt)}</Table.Td>
                        <Table.Td data-testid={`invitations-page-table-cell-status-${invitation.id}`}>{getStatusBadge(invitation.status)}</Table.Td>
                        <Table.Td data-testid={`invitations-page-table-cell-actions-${invitation.id}`}>
                          {invitation.status === 'pending' && (
                            <Menu data-testid={`invitations-page-menu-${invitation.id}`}>
                              <Menu.Target>
                                <ActionIcon variant="subtle" data-testid={`invitations-page-menu-button-${invitation.id}`}>
                                  <IconDotsVertical size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown data-testid={`invitations-page-menu-dropdown-${invitation.id}`}>
                                <Menu.Item
                                  leftSection={<IconRefresh size={14} />}
                                  onClick={() => handleResend(invitation.id)}
                                  data-testid={`invitations-page-menu-resend-${invitation.id}`}
                                >
                                  Resend
                                </Menu.Item>
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleCancel(invitation.id)}
                                  data-testid={`invitations-page-menu-cancel-${invitation.id}`}
                                >
                                  Cancel
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          )}
                          {invitation.status === 'expired' && (
                            <Tooltip label="Resend invitation" data-testid={`invitations-page-tooltip-${invitation.id}`}>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => handleResend(invitation.id)}
                                data-testid={`invitations-page-resend-button-${invitation.id}`}
                              >
                                <IconRefresh size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      {/* Invite Modal */}
      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          form.reset();
        }}
        title="Invite User"
        size="md"
        data-testid="invitations-page-invite-modal"
      >
        <form onSubmit={form.onSubmit(handleInvite)} data-testid="invitations-page-invite-form">
          <Stack gap="md" data-testid="invitations-page-invite-form-stack">
            <TextInput
              label="Email Address"
              placeholder="user@example.com"
              required
              {...form.getInputProps('email')}
              data-testid="invitations-page-invite-email-input"
            />

            <TextInput
              label="Name (Optional)"
              placeholder="John Smith"
              {...form.getInputProps('name')}
              data-testid="invitations-page-invite-name-input"
            />

            <MultiSelect
              label="Roles"
              placeholder="Select roles"
              data={roleOptions}
              required
              {...form.getInputProps('roles')}
              data-testid="invitations-page-invite-roles-select"
            />

            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light" data-testid="invitations-page-invite-info-alert">
              The user will receive an email with a link to set up their account.
              The invitation expires in 30 days.
            </Alert>

            <Group justify="flex-end" mt="md" data-testid="invitations-page-invite-form-actions">
              <Button variant="subtle" onClick={() => setIsModalOpen(false)} data-testid="invitations-page-invite-cancel-button">
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} data-testid="invitations-page-invite-submit-button">
                Send Invitation
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

