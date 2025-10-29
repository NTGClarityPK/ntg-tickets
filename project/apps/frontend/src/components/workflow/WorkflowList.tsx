'use client';

import React, { useState } from 'react';
import {
  Container,
  Stack,
  Title,
  Button,
  Group,
  Card,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Modal,
  Alert,
  TextInput,
  Select,
  Table,
  ScrollArea,
  Menu,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconStarFilled,
  IconSettings,
  IconEye,
  IconCopy,
  IconDots,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { WorkflowEditor } from './WorkflowEditor';
import { Workflow, WorkflowData } from '../../lib/apiClient';

interface WorkflowListProps {
  workflows: Workflow[];
  onRefresh: () => void;
  onCreateWorkflow: (workflow: WorkflowData) => void;
  onUpdateWorkflow: (id: string, workflow: WorkflowData) => void;
  onDeleteWorkflow: (id: string) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
}

export function WorkflowList({
  workflows,
  onRefresh,
  onCreateWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow,
  onActivate,
  onDeactivate,
}: WorkflowListProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredWorkflows = (workflows || []).filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setShowEditor(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowEditor(true);
  };

  const handleViewWorkflow = (workflow: Workflow) => {
    setViewingWorkflow(workflow);
    setShowViewModal(true);
  };

  const handleSaveWorkflow = (workflowData: WorkflowData) => {
    if (editingWorkflow) {
      onUpdateWorkflow(editingWorkflow.id, workflowData);
    } else {
      onCreateWorkflow(workflowData);
    }
    setShowEditor(false);
    setEditingWorkflow(null);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    onDeleteWorkflow(workflowId);
    setDeleteModalOpen(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'DRAFT':
        return 'yellow';
      case 'INACTIVE':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <IconCheck size={16} />;
      case 'INACTIVE':
        return <IconX size={16} />;
      default:
        return <IconSettings size={16} />;
    }
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Workflow Management</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateWorkflow}
          >
            Create Workflow
          </Button>
        </Group>

        <Card withBorder>
          <Stack gap="md">
            <Group>
              <TextInput
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Filter by status"
                data={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                clearable
              />
              <Button variant="outline" onClick={onRefresh}>
                Refresh
              </Button>
            </Group>

            <ScrollArea>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Creator</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredWorkflows.map((workflow) => (
                    <Table.Tr key={workflow.id}>
                      <Table.Td>
                        <Stack gap={4}>
                          <Group gap="xs">
                            <Text fw={500}>{workflow.name}</Text>
                            {workflow.isSystemDefault && (
                              <Tooltip label="System Default - Cannot be edited or deleted">
                                <Badge size="xs" color="gray" variant="outline">
                                  System
                                </Badge>
                              </Tooltip>
                            )}
                            {workflow.isDefault && !workflow.isSystemDefault && (
                              <Tooltip label="Default Workflow">
                                <IconStarFilled size={16} color="#ffd700" />
                              </Tooltip>
                            )}
                          </Group>
                          {workflow.description && (
                            <Text size="sm" c="dimmed">
                              {workflow.description}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(workflow.status)}
                          leftSection={getStatusIcon(workflow.status)}
                        >
                          {workflow.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{workflow.createdByUser.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(workflow.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label={workflow.isSystemDefault ? "System default cannot be edited" : "Edit Workflow"}>
                            <ActionIcon
                              variant="subtle"
                              onClick={() => !workflow.isSystemDefault && handleEditWorkflow(workflow)}
                              disabled={workflow.isSystemDefault}
                              style={{ cursor: workflow.isSystemDefault ? 'not-allowed' : 'pointer' }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          
                          <Tooltip label="View Details">
                            <ActionIcon variant="subtle" onClick={() => handleViewWorkflow(workflow)}>
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Menu>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {workflow.status === 'ACTIVE' && !workflow.isSystemDefault && (
                                <Menu.Item
                                  leftSection={<IconX size={16} />}
                                  onClick={() => onDeactivate(workflow.id)}
                                >
                                  Deactivate
                                </Menu.Item>
                              )}
                              
                              {workflow.status === 'INACTIVE' && (
                                <Menu.Item
                                  leftSection={<IconCheck size={16} />}
                                  onClick={() => onActivate(workflow.id)}
                                >
                                  Activate
                                </Menu.Item>
                              )}
                              
                              {workflow.status === 'ACTIVE' && workflow.isSystemDefault && (
                                <Menu.Item
                                  disabled
                                  leftSection={<IconX size={16} />}
                                >
                                  Deactivate (System Default)
                                </Menu.Item>
                              )}
                              
                              <Menu.Item
                                leftSection={<IconCopy size={16} />}
                                onClick={() => {
                                  // TODO: Implement duplicate workflow
                                  notifications.show({
                                    title: 'Feature Coming Soon',
                                    message: 'Duplicate workflow feature will be available soon',
                                    color: 'blue',
                                  });
                                }}
                              >
                                Duplicate
                              </Menu.Item>
                              
                              <Divider />
                              
                              {!workflow.isSystemDefault && (
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={16} />}
                                  onClick={() => setDeleteModalOpen(workflow.id)}
                                >
                                  Delete
                                </Menu.Item>
                              )}
                              
                              {workflow.isSystemDefault && (
                                <Menu.Item
                                  disabled
                                  leftSection={<IconTrash size={16} />}
                                >
                                  Delete (System Default)
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {filteredWorkflows.length === 0 && (
              <Alert color="blue" variant="light">
                <Text>No workflows found. Create your first workflow to get started.</Text>
              </Alert>
            )}
          </Stack>
        </Card>

        {/* Workflow Editor Modal */}
        <Modal
          opened={showEditor}
          onClose={() => setShowEditor(false)}
          title={editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
          size="95%"
          centered
        >
          <WorkflowEditor
            workflow={editingWorkflow || undefined}
            onSave={handleSaveWorkflow}
            onCancel={() => setShowEditor(false)}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={!!deleteModalOpen}
          onClose={() => setDeleteModalOpen(null)}
          title="Delete Workflow"
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </Text>
            <Alert color="red" variant="light">
              <Text size="sm">
                Note: If this workflow is being used by any tickets, it cannot be deleted.
              </Text>
            </Alert>
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setDeleteModalOpen(null)}>
                Cancel
              </Button>
              <Button
                color="red"
                onClick={() => {
                  if (deleteModalOpen) {
                    handleDeleteWorkflow(deleteModalOpen);
                  }
                }}
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* View Workflow Modal */}
        <Modal
          opened={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingWorkflow(null);
          }}
          title={viewingWorkflow ? `View Workflow: ${viewingWorkflow.name}` : 'View Workflow'}
          size="95%"
          centered
        >
          {viewingWorkflow && (
            <WorkflowEditor
              workflow={viewingWorkflow}
              onCancel={() => {
                setShowViewModal(false);
                setViewingWorkflow(null);
              }}
            />
          )}
        </Modal>
      </Stack>
    </Container>
  );
}

