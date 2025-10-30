'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Card,
  Group,
  Text,
  Badge,
  Table,
  Stack,
  Grid,
  Alert,
  NumberInput,
  Select,
  Switch,
  TextInput,
  Textarea,
  Modal,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconSettings,
  IconRefresh,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useDynamicTheme } from '../../../hooks/useDynamicTheme';

export default function SLAManagementPage() {
  const { primaryDarkest, primaryLight, primaryLighter, textMuted, primaryDark } = useDynamicTheme();
  const router = useRouter();
  const [selectedSLA, setSelectedSLA] = useState<{
    id: string;
    name: string;
    priority: string;
    responseTime: number;
    resolutionTime: number;
    isActive: boolean;
    description: string;
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Mock SLA data - in real implementation, this would come from hooks
  const [slaPolicies, setSlaPolicies] = useState([
    {
      id: '1',
      name: 'Critical Issues',
      priority: 'HIGH',
      responseTime: 2, // hours
      resolutionTime: 8, // hours
      isActive: true,
      description: 'Critical system issues requiring immediate attention',
      escalationLevels: [
        { level: 1, time: 1, action: 'Notify team lead' },
        { level: 2, time: 4, action: 'Notify manager' },
        { level: 3, time: 8, action: 'Notify director' },
      ],
    },
    {
      id: '2',
      name: 'High Priority',
      priority: 'HIGH',
      responseTime: 4,
      resolutionTime: 24,
      isActive: true,
      description: 'High priority issues',
      escalationLevels: [
        { level: 1, time: 2, action: 'Notify team lead' },
        { level: 2, time: 8, action: 'Notify manager' },
      ],
    },
    {
      id: '3',
      name: 'Medium Priority',
      priority: 'MEDIUM',
      responseTime: 8,
      resolutionTime: 72,
      isActive: true,
      description: 'Medium priority issues',
      escalationLevels: [{ level: 1, time: 4, action: 'Notify team lead' }],
    },
    {
      id: '4',
      name: 'Low Priority',
      priority: 'LOW',
      responseTime: 24,
      resolutionTime: 168,
      isActive: true,
      description: 'Low priority issues',
      escalationLevels: [],
    },
  ]);

  const createForm = useForm({
    initialValues: {
      name: '',
      priority: 'MEDIUM',
      responseTime: 8,
      resolutionTime: 72,
      description: '',
      isActive: true,
    },
  });

  const editForm = useForm({
    initialValues: {
      name: '',
      priority: 'MEDIUM',
      responseTime: 8,
      resolutionTime: 72,
      description: '',
      isActive: true,
    },
  });

  const handleCreateSLA = (values: {
    name: string;
    priority: string;
    responseTime: number;
    resolutionTime: number;
    description: string;
    isActive: boolean;
  }) => {
    const newSLA = {
      id: Date.now().toString(),
      ...values,
      escalationLevels: [],
    };
    setSlaPolicies([...slaPolicies, newSLA]);
    notifications.show({
      title: 'SLA Policy Created',
      message: 'SLA policy has been created successfully',
      color: primaryLight,
    });
    setCreateModalOpen(false);
    createForm.reset();
  };

  const handleEditSLA = (values: {
    name: string;
    priority: string;
    responseTime: number;
    resolutionTime: number;
    description: string;
    isActive: boolean;
  }) => {
    if (!selectedSLA) return;

    setSlaPolicies(
      slaPolicies.map(policy =>
        policy.id === selectedSLA.id ? { ...policy, ...values } : policy
      )
    );
    notifications.show({
      title: 'SLA Policy Updated',
      message: 'SLA policy has been updated successfully',
      color: primaryLight,
    });
    setEditModalOpen(false);
    setSelectedSLA(null);
  };

  const handleDeleteSLA = () => {
    if (!selectedSLA) return;

    setSlaPolicies(slaPolicies.filter(policy => policy.id !== selectedSLA.id));
    notifications.show({
      title: 'SLA Policy Deleted',
      message: 'SLA policy has been deleted successfully',
      color: primaryLight,
    });
    setDeleteModalOpen(false);
    setSelectedSLA(null);
  };

  const openEditModal = (sla: {
    id: string;
    name: string;
    priority: string;
    responseTime: number;
    resolutionTime: number;
    isActive: boolean;
    description: string;
  }) => {
    setSelectedSLA(sla);
    editForm.setValues({
      name: sla.name,
      priority: sla.priority,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
      description: sla.description,
      isActive: sla.isActive,
    });
    setEditModalOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return primaryDarkest;
      case 'HIGH':
        return primaryDark;
      case 'MEDIUM':
        return primaryLight;
      case 'LOW':
        return primaryLighter;
      default:
        return textMuted;
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  return (
    <Container size='xl' py='md'>
      <Group justify='space-between' mb='xl'>
        <div>
          <Title order={2}>SLA Management</Title>
          <Text c='dimmed' size='sm'>
            Configure Service Level Agreements for ticket priorities
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create SLA Policy
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={8}>
          <Card>
            <Stack>
              <Group justify='space-between'>
                <Title order={4}>SLA Policies</Title>
                <Button variant='light' leftSection={<IconRefresh size={16} />}>
                  Refresh
                </Button>
              </Group>

              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Response Time</Table.Th>
                    <Table.Th>Resolution Time</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {slaPolicies.map(sla => (
                    <Table.Tr key={sla.id}>
                      <Table.Td>
                        <Text fw={500}>{sla.name}</Text>
                        <Text size='sm' c='dimmed'>
                          {sla.description}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getPriorityColor(sla.priority)}
                          variant='light'
                        >
                          {sla.priority}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm'>{formatTime(sla.responseTime)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm'>{formatTime(sla.resolutionTime)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={sla.isActive ? primaryLighter : primaryDark}
                          variant='light'
                        >
                          {sla.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Menu>
                          <Menu.Target>
                            <ActionIcon variant='subtle'>
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => openEditModal(sla)}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrendingUp size={14} />}
                              onClick={() =>
                                router.push(`/admin/sla/${sla.id}/metrics`)
                              }
                            >
                              View Metrics
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color='red'
                              onClick={() => {
                                setSelectedSLA(sla);
                                setDeleteModalOpen(true);
                              }}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack>
            <Card>
              <Stack>
                <Title order={4}>SLA Statistics</Title>
                <Group justify='space-between'>
                  <Text size='sm'>Total Policies</Text>
                  <Text fw={500}>{slaPolicies.length}</Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>Active Policies</Text>
                  <Text fw={500} c='green'>
                    {slaPolicies.filter(p => p.isActive).length}
                  </Text>
                </Group>
                <Group justify='space-between'>
                  <Text size='sm'>Inactive Policies</Text>
                  <Text fw={500} c='red'>
                    {slaPolicies.filter(p => !p.isActive).length}
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Card>
              <Stack>
                <Title order={4}>Quick Actions</Title>
                <Button
                  variant='light'
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateModalOpen(true)}
                  fullWidth
                >
                  Create New SLA
                </Button>
                <Button
                  variant='light'
                  leftSection={<IconTrendingUp size={16} />}
                  onClick={() => router.push('/admin/sla/metrics')}
                  fullWidth
                >
                  View SLA Metrics
                </Button>
                <Button
                  variant='light'
                  leftSection={<IconSettings size={16} />}
                  onClick={() => router.push('/admin/settings')}
                  fullWidth
                >
                  SLA Settings
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Create SLA Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title='Create SLA Policy'
        size='lg'
      >
        <form onSubmit={createForm.onSubmit(handleCreateSLA)}>
          <Stack>
            <TextInput
              label='Policy Name'
              placeholder='Enter policy name'
              required
              {...createForm.getInputProps('name')}
            />
            <Select
              label='Priority Level'
              placeholder='Select priority'
              required
              data={[
                { value: 'CRITICAL', label: 'Critical' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ]}
              {...createForm.getInputProps('priority')}
            />
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label='Response Time (hours)'
                  placeholder='Enter response time'
                  required
                  min={1}
                  {...createForm.getInputProps('responseTime')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label='Resolution Time (hours)'
                  placeholder='Enter resolution time'
                  required
                  min={1}
                  {...createForm.getInputProps('resolutionTime')}
                />
              </Grid.Col>
            </Grid>
            <Textarea
              label='Description'
              placeholder='Enter policy description'
              {...createForm.getInputProps('description')}
            />
            <Switch
              label='Active Policy'
              description='Enable this SLA policy'
              {...createForm.getInputProps('isActive', { type: 'checkbox' })}
            />
            <Group justify='flex-end' mt='md'>
              <Button variant='light' onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Create Policy</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit SLA Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title='Edit SLA Policy'
        size='lg'
      >
        <form onSubmit={editForm.onSubmit(handleEditSLA)}>
          <Stack>
            <TextInput
              label='Policy Name'
              placeholder='Enter policy name'
              required
              {...editForm.getInputProps('name')}
            />
            <Select
              label='Priority Level'
              placeholder='Select priority'
              required
              data={[
                { value: 'CRITICAL', label: 'Critical' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ]}
              {...editForm.getInputProps('priority')}
            />
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label='Response Time (hours)'
                  placeholder='Enter response time'
                  required
                  min={1}
                  {...editForm.getInputProps('responseTime')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label='Resolution Time (hours)'
                  placeholder='Enter resolution time'
                  required
                  min={1}
                  {...editForm.getInputProps('resolutionTime')}
                />
              </Grid.Col>
            </Grid>
            <Textarea
              label='Description'
              placeholder='Enter policy description'
              {...editForm.getInputProps('description')}
            />
            <Switch
              label='Active Policy'
              description='Enable this SLA policy'
              {...editForm.getInputProps('isActive', { type: 'checkbox' })}
            />
            <Group justify='flex-end' mt='md'>
              <Button variant='light' onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Update Policy</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete SLA Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title='Delete SLA Policy'
      >
        <Stack>
          <Alert color='red' title='Warning'>
            Are you sure you want to delete this SLA policy? This action cannot
            be undone.
          </Alert>
          <Text size='sm'>
            Policy: <strong>{selectedSLA?.name}</strong>
          </Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='light' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color='red' onClick={handleDeleteSLA}>
              Delete Policy
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
