'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Chip,
  ScrollArea,
  Alert,
  Badge,
  Card,
  Divider,
  Tabs,
  Paper,
} from '@mantine/core';
import { IconInfoCircle, IconClock, IconCheck, IconPlayerPause } from '@tabler/icons-react';
import { Workflow } from '../../lib/apiClient';

interface WorkflowStatus {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  displayName: string;
}

interface StatusCategorizationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (workingStatuses: string[], doneStatuses: string[]) => void;
  workflow: Workflow | null;
  availableStatuses: WorkflowStatus[];
}

export function StatusCategorizationModal({
  opened,
  onClose,
  onConfirm,
  workflow,
  availableStatuses,
}: StatusCategorizationModalProps) {
  const [selectedWorking, setSelectedWorking] = useState<string[]>([]);
  const [selectedDone, setSelectedDone] = useState<string[]>([]);

  // Initialize with existing categorization or defaults
  useEffect(() => {
    if (workflow && opened) {
      // Convert existing status strings to workflow-specific format if needed
      const existingWorking = (workflow.workingStatuses || []).map(status => {
        // If already in workflow format, keep it; otherwise find matching workflow status
        if (status.startsWith('workflow-')) {
          return status;
        }
        // Find matching workflow status for current workflow
        const matching = availableStatuses.find(
          ws => ws.workflowId === workflow.id && ws.status === status
        );
        return matching ? matching.id : status;
      });
      
      const existingDone = (workflow.doneStatuses || []).map(status => {
        if (status.startsWith('workflow-')) {
          return status;
        }
        const matching = availableStatuses.find(
          ws => ws.workflowId === workflow.id && ws.status === status
        );
        return matching ? matching.id : status;
      });
      
      setSelectedWorking(existingWorking);
      setSelectedDone(existingDone);
    } else if (opened && !workflow) {
      // Default workflow defaults - convert to workflow format
      const defaultWorking = availableStatuses
        .filter(ws => ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'].includes(ws.status))
        .map(ws => ws.id);
      const defaultDone = availableStatuses
        .filter(ws => ['CLOSED', 'RESOLVED'].includes(ws.status))
        .map(ws => ws.id);
      
      setSelectedWorking(defaultWorking);
      setSelectedDone(defaultDone);
    }
  }, [workflow, opened, availableStatuses]);

  const handleToggleWorking = (status: string) => {
    setSelectedWorking(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    // Remove from done if it was there
    setSelectedDone(prev => prev.filter(s => s !== status));
  };

  const handleToggleDone = (status: string) => {
    setSelectedDone(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    // Remove from working if it was there
    setSelectedWorking(prev => prev.filter(s => s !== status));
  };

  const handleConfirm = () => {
    onConfirm(selectedWorking, selectedDone);
    onClose();
  };

  const holdStatuses = availableStatuses.filter(
    statusItem => !selectedWorking.includes(statusItem.id) && !selectedDone.includes(statusItem.id)
  );

  // Group statuses by workflow for better organization
  const statusesByWorkflow = useMemo(() => {
    const grouped = new Map<string, typeof availableStatuses>();
    availableStatuses.forEach(statusItem => {
      if (!grouped.has(statusItem.workflowName)) {
        grouped.set(statusItem.workflowName, []);
      }
      const group = grouped.get(statusItem.workflowName);
      if (group) {
        group.push(statusItem);
      }
    });
    return Array.from(grouped.entries());
  }, [availableStatuses]);

  const workingCount = selectedWorking.length;
  const doneCount = selectedDone.length;
  const holdCount = holdStatuses.length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconInfoCircle size={20} />
          <Text fw={600} size="lg">Configure Status Categorization</Text>
        </Group>
      }
      size="xl"
      centered
      padding="xl"
    >
      <Stack gap="lg">
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
          <Text size="sm">
            Categorize statuses for dashboard statistics. Statuses not selected as Working or Done will be considered as Hold.
          </Text>
        </Alert>

        {availableStatuses.length === 0 ? (
          <Alert color="yellow" variant="light" radius="md">
            <Text size="sm">
              No statuses available. Please ensure workflows have transitions defined.
            </Text>
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            <Group gap="md">
              <Paper p="md" withBorder radius="md" style={{ flex: 1 }}>
                <Group gap="xs" mb={4}>
                  <IconClock size={18} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500} c="dimmed">Working</Text>
                </Group>
                <Text size="xl" fw={700} c="blue">{workingCount}</Text>
                <Text size="xs" c="dimmed">statuses selected</Text>
              </Paper>
              <Paper p="md" withBorder radius="md" style={{ flex: 1 }}>
                <Group gap="xs" mb={4}>
                  <IconCheck size={18} color="var(--mantine-color-green-6)" />
                  <Text size="sm" fw={500} c="dimmed">Done</Text>
                </Group>
                <Text size="xl" fw={700} c="green">{doneCount}</Text>
                <Text size="xs" c="dimmed">statuses selected</Text>
              </Paper>
              <Paper p="md" withBorder radius="md" style={{ flex: 1 }}>
                <Group gap="xs" mb={4}>
                  <IconPlayerPause size={18} color="var(--mantine-color-gray-6)" />
                  <Text size="sm" fw={500} c="dimmed">Hold</Text>
                </Group>
                <Text size="xl" fw={700} c="gray">{holdCount}</Text>
                <Text size="xs" c="dimmed">statuses (auto)</Text>
              </Paper>
            </Group>

            <Divider label="Select Statuses" labelPosition="center" />

            {/* Status Selection by Workflow */}
            <Tabs defaultValue="working" variant="pills">
              <Tabs.List grow>
                <Tabs.Tab value="working" leftSection={<IconClock size={16} />}>
                  Working ({workingCount})
                </Tabs.Tab>
                <Tabs.Tab value="done" leftSection={<IconCheck size={16} />}>
                  Done ({doneCount})
                </Tabs.Tab>
                <Tabs.Tab value="hold" leftSection={<IconPlayerPause size={16} />}>
                  Hold ({holdCount})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="working" pt="md">
                <ScrollArea mah={350}>
                  <Stack gap="md">
                    {statusesByWorkflow.map(([workflowName, statuses]) => (
                      <Card key={workflowName} withBorder radius="md" p="md">
                        <Group mb="sm" justify="space-between">
                          <Badge size="lg" variant="light" color="blue">
                            {workflowName}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {statuses.filter(s => selectedWorking.includes(s.id)).length} / {statuses.length} selected
                          </Text>
                        </Group>
                        <Group gap="xs">
                          {statuses.map(statusItem => (
                            <Chip
                              key={statusItem.id}
                              checked={selectedWorking.includes(statusItem.id)}
                              onChange={() => handleToggleWorking(statusItem.id)}
                              disabled={selectedDone.includes(statusItem.id)}
                              size="md"
                              variant="light"
                              color="blue"
                            >
                              {statusItem.status}
                            </Chip>
                          ))}
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="done" pt="md">
                <ScrollArea mah={350}>
                  <Stack gap="md">
                    {statusesByWorkflow.map(([workflowName, statuses]) => (
                      <Card key={workflowName} withBorder radius="md" p="md">
                        <Group mb="sm" justify="space-between">
                          <Badge size="lg" variant="light" color="green">
                            {workflowName}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {statuses.filter(s => selectedDone.includes(s.id)).length} / {statuses.length} selected
                          </Text>
                        </Group>
                        <Group gap="xs">
                          {statuses.map(statusItem => (
                            <Chip
                              key={statusItem.id}
                              checked={selectedDone.includes(statusItem.id)}
                              onChange={() => handleToggleDone(statusItem.id)}
                              disabled={selectedWorking.includes(statusItem.id)}
                              size="md"
                              variant="light"
                              color="green"
                            >
                              {statusItem.status}
                            </Chip>
                          ))}
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="hold" pt="md">
                <ScrollArea mah={350}>
                  <Stack gap="md">
                    {statusesByWorkflow.map(([workflowName, statuses]) => {
                      const workflowHoldStatuses = statuses.filter(
                        s => !selectedWorking.includes(s.id) && !selectedDone.includes(s.id)
                      );
                      if (workflowHoldStatuses.length === 0) return null;
                      
                      return (
                        <Card key={workflowName} withBorder radius="md" p="md">
                          <Group mb="sm" justify="space-between">
                            <Badge size="lg" variant="light" color="gray">
                              {workflowName}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {workflowHoldStatuses.length} statuses
                            </Text>
                          </Group>
                          <Group gap="xs">
                            {workflowHoldStatuses.map(statusItem => (
                              <Chip
                                key={statusItem.id}
                                checked={false}
                                disabled
                                size="md"
                                variant="light"
                                color="gray"
                              >
                                {statusItem.status}
                              </Chip>
                            ))}
                          </Group>
                        </Card>
                      );
                    })}
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>
            </Tabs>
          </>
        )}

        <Divider />

        <Group justify="flex-end" mt="sm">
          <Button variant="outline" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button onClick={handleConfirm} size="md" disabled={availableStatuses.length === 0}>
            Confirm & Activate
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}


