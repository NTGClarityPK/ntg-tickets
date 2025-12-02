'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Chip,
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

  const scrollableStyle: React.CSSProperties = {
    maxHeight: '400px',
    overflow: 'auto',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
  } as React.CSSProperties;

  return (
    <>
      <style>{`
        .invisible-scroll::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="xs" data-testid="status-categorization-modal-title-group">
            <IconInfoCircle size={20} data-testid="status-categorization-modal-title-icon" />
            <Text fw={600} size="lg" data-testid="status-categorization-modal-title-text">Configure Status Categorization</Text>
          </Group>
        }
        size="xl"
        centered
        padding="xl"
        data-testid="status-categorization-modal"
      >
      <Stack gap="lg" data-testid="status-categorization-modal-stack">
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md" data-testid="status-categorization-info-alert">
          <Text size="sm" data-testid="status-categorization-info-text">
            Categorize statuses for dashboard statistics. Statuses not selected as Working or Done will be considered as Hold.
          </Text>
        </Alert>

        {availableStatuses.length === 0 ? (
          <Alert color="yellow" variant="light" radius="md" data-testid="status-categorization-no-statuses-alert">
            <Text size="sm" data-testid="status-categorization-no-statuses-text">
              No statuses available. Please ensure workflows have transitions defined.
            </Text>
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            <Group gap="md" data-testid="status-categorization-summary-cards">
              <Paper p="md" withBorder radius="md" style={{ flex: 1 }} data-testid="status-categorization-working-card">
                <Group gap="xs" mb={4} data-testid="status-categorization-working-header">
                  <IconClock size={18} color="var(--mantine-color-blue-6)" data-testid="status-categorization-working-icon" />
                  <Text size="sm" fw={500} c="dimmed" data-testid="status-categorization-working-label">Working</Text>
                </Group>
                <Text size="xl" fw={700} c="blue" data-testid="status-categorization-working-count">{workingCount}</Text>
                <Text size="xs" c="dimmed" data-testid="status-categorization-working-hint">statuses selected</Text>
              </Paper>
              <Paper p="md" withBorder radius="md" style={{ flex: 1 }} data-testid="status-categorization-done-card">
                <Group gap="xs" mb={4} data-testid="status-categorization-done-header">
                  <IconCheck size={18} color="var(--mantine-color-green-6)" data-testid="status-categorization-done-icon" />
                  <Text size="sm" fw={500} c="dimmed" data-testid="status-categorization-done-label">Done</Text>
                </Group>
                <Text size="xl" fw={700} c="green" data-testid="status-categorization-done-count">{doneCount}</Text>
                <Text size="xs" c="dimmed" data-testid="status-categorization-done-hint">statuses selected</Text>
              </Paper>
              <Paper p="md" withBorder radius="md" style={{ flex: 1 }} data-testid="status-categorization-hold-card">
                <Group gap="xs" mb={4} data-testid="status-categorization-hold-header">
                  <IconPlayerPause size={18} color="var(--mantine-color-gray-6)" data-testid="status-categorization-hold-icon" />
                  <Text size="sm" fw={500} c="dimmed" data-testid="status-categorization-hold-label">Hold</Text>
                </Group>
                <Text size="xl" fw={700} c="gray" data-testid="status-categorization-hold-count">{holdCount}</Text>
                <Text size="xs" c="dimmed" data-testid="status-categorization-hold-hint">statuses (auto)</Text>
              </Paper>
            </Group>

            <Divider label="Select Statuses" labelPosition="center" data-testid="status-categorization-divider" />

            {/* Status Selection by Workflow */}
            <Tabs defaultValue="working" variant="pills" data-testid="status-categorization-tabs">
              <Tabs.List grow data-testid="status-categorization-tabs-list">
                <Tabs.Tab value="working" leftSection={<IconClock size={16} />} data-testid="status-categorization-tab-working">
                  Working ({workingCount})
                </Tabs.Tab>
                <Tabs.Tab value="done" leftSection={<IconCheck size={16} />} data-testid="status-categorization-tab-done">
                  Done ({doneCount})
                </Tabs.Tab>
                <Tabs.Tab value="hold" leftSection={<IconPlayerPause size={16} />} data-testid="status-categorization-tab-hold">
                  Hold ({holdCount})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="working" pt="md" data-testid="status-categorization-panel-working">
                <div className="invisible-scroll" style={scrollableStyle} data-testid="status-categorization-working-scroll">
                  <Stack gap="md" data-testid="status-categorization-working-stack">
                    {statusesByWorkflow.map(([workflowName, statuses]) => (
                      <Card key={workflowName} withBorder radius="md" p="md" data-testid={`status-categorization-working-card-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Group mb="sm" justify="space-between" data-testid={`status-categorization-working-header-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Badge size="lg" variant="light" color="blue" data-testid={`status-categorization-working-badge-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                            {workflowName}
                          </Badge>
                          <Text size="xs" c="dimmed" data-testid={`status-categorization-working-count-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                            {statuses.filter(s => selectedWorking.includes(s.id)).length} / {statuses.length} selected
                          </Text>
                        </Group>
                        <Group gap="xs" data-testid={`status-categorization-working-chips-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                          {statuses.map(statusItem => (
                            <Chip
                              key={statusItem.id}
                              checked={selectedWorking.includes(statusItem.id)}
                              onChange={() => handleToggleWorking(statusItem.id)}
                              disabled={selectedDone.includes(statusItem.id)}
                              size="md"
                              variant="light"
                              color="blue"
                              data-testid={`status-categorization-working-chip-${statusItem.id}`}
                            >
                              {statusItem.status}
                            </Chip>
                          ))}
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="done" pt="md" data-testid="status-categorization-panel-done">
                <div className="invisible-scroll" style={scrollableStyle} data-testid="status-categorization-done-scroll">
                  <Stack gap="md" data-testid="status-categorization-done-stack">
                    {statusesByWorkflow.map(([workflowName, statuses]) => (
                      <Card key={workflowName} withBorder radius="md" p="md" data-testid={`status-categorization-done-card-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Group mb="sm" justify="space-between" data-testid={`status-categorization-done-header-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Badge size="lg" variant="light" color="green" data-testid={`status-categorization-done-badge-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                            {workflowName}
                          </Badge>
                          <Text size="xs" c="dimmed" data-testid={`status-categorization-done-count-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                            {statuses.filter(s => selectedDone.includes(s.id)).length} / {statuses.length} selected
                          </Text>
                        </Group>
                        <Group gap="xs" data-testid={`status-categorization-done-chips-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                          {statuses.map(statusItem => (
                            <Chip
                              key={statusItem.id}
                              checked={selectedDone.includes(statusItem.id)}
                              onChange={() => handleToggleDone(statusItem.id)}
                              disabled={selectedWorking.includes(statusItem.id)}
                              size="md"
                              variant="light"
                              color="green"
                              data-testid={`status-categorization-done-chip-${statusItem.id}`}
                            >
                              {statusItem.status}
                            </Chip>
                          ))}
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="hold" pt="md" data-testid="status-categorization-panel-hold">
                <div className="invisible-scroll" style={scrollableStyle} data-testid="status-categorization-hold-scroll">
                  <Stack gap="md" data-testid="status-categorization-hold-stack">
                    {statusesByWorkflow.map(([workflowName, statuses]) => {
                      const workflowHoldStatuses = statuses.filter(
                        s => !selectedWorking.includes(s.id) && !selectedDone.includes(s.id)
                      );
                      if (workflowHoldStatuses.length === 0) return null;
                      
                      return (
                        <Card key={workflowName} withBorder radius="md" p="md" data-testid={`status-categorization-hold-card-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Group mb="sm" justify="space-between" data-testid={`status-categorization-hold-header-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                            <Badge size="lg" variant="light" color="gray" data-testid={`status-categorization-hold-badge-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                              {workflowName}
                            </Badge>
                            <Text size="xs" c="dimmed" data-testid={`status-categorization-hold-count-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                              {workflowHoldStatuses.length} statuses
                            </Text>
                          </Group>
                          <Group gap="xs" data-testid={`status-categorization-hold-chips-${workflowName.toLowerCase().replace(/\s+/g, '-')}`}>
                            {workflowHoldStatuses.map(statusItem => (
                              <Chip
                                key={statusItem.id}
                                checked={false}
                                disabled
                                size="md"
                                variant="light"
                                color="gray"
                                data-testid={`status-categorization-hold-chip-${statusItem.id}`}
                              >
                                {statusItem.status}
                              </Chip>
                            ))}
                          </Group>
                        </Card>
                      );
                    })}
                  </Stack>
                </div>
              </Tabs.Panel>
            </Tabs>
          </>
        )}

        <Divider data-testid="status-categorization-actions-divider" />

        <Group justify="flex-end" mt="sm" data-testid="status-categorization-actions">
          <Button variant="outline" onClick={onClose} size="md" data-testid="status-categorization-cancel-button">
            Cancel
          </Button>
          <Button onClick={handleConfirm} size="md" disabled={availableStatuses.length === 0} data-testid="status-categorization-confirm-button">
            Confirm & Activate
          </Button>
        </Group>
      </Stack>
    </Modal>
    </>
  );
}


