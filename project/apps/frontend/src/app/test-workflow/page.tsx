'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Text, Card, Stack, Code, Alert, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { workflowsApi } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCanCreateTicket } from '../../hooks/useCanCreateTicket';

interface WorkflowDefinition {
  edges?: { data?: { isCreateTransition?: boolean }; source: string }[];
}

interface WorkflowData {
  id?: string;
  name?: string;
  status?: string;
  isDefault?: boolean;
  isActive?: boolean;
  definition?: WorkflowDefinition;
  transitions?: unknown[];
}

export default function TestWorkflowPage() {
  const theme = useMantineTheme();
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { canCreate, loading: canCreateLoading } = useCanCreateTicket();

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workflowsApi.getDefaultWorkflow();
      setWorkflow(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, []);

  if (loading) {
    return <Container data-testid="test-workflow-page-loading"><Text data-testid="test-workflow-page-loading-text">Loading...</Text></Container>;
  }

  if (error) {
    return <Container data-testid="test-workflow-page-error"><Alert color={theme.colors[theme.primaryColor][9]} data-testid="test-workflow-page-error-alert">{error}</Alert></Container>;
  }

  const createEdge = workflow?.definition?.edges?.find((edge: { data?: { isCreateTransition?: boolean }; source: string }) => 
    edge.data?.isCreateTransition === true || edge.source === 'create'
  );

  return (
    <Container size="xl" py="md" data-testid="test-workflow-page">
      <Stack gap="md" data-testid="test-workflow-page-stack">
        <Title data-testid="test-workflow-page-title">Workflow Debug Page</Title>
        
        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-user-info-card">
          <Stack gap="sm" data-testid="test-workflow-page-user-info-stack">
            <Text fw={700} data-testid="test-workflow-page-user-info-title">Current User Info:</Text>
            <Code block data-testid="test-workflow-page-user-info-code">{JSON.stringify({
              id: user?.id,
              name: user?.name,
              email: user?.email,
              roles: user?.roles,
              activeRole: user?.activeRole,
            }, null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-can-create-card">
          <Stack gap="sm" data-testid="test-workflow-page-can-create-stack">
            <Text fw={700} data-testid="test-workflow-page-can-create-title">Can Create Ticket:</Text>
            <Text size="xl" c={canCreate ? theme.primaryColor : theme.colors[theme.primaryColor][9]} data-testid="test-workflow-page-can-create-value">
              {canCreateLoading ? 'Checking...' : canCreate ? 'YES ✓' : 'NO ✗'}
            </Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-workflow-info-card">
          <Stack gap="sm" data-testid="test-workflow-page-workflow-info-stack">
            <Text fw={700} data-testid="test-workflow-page-workflow-info-title">Workflow Info:</Text>
            <Code block data-testid="test-workflow-page-workflow-info-code">{JSON.stringify({
              id: workflow?.id,
              name: workflow?.name,
              status: workflow?.status,
              isDefault: workflow?.isDefault,
              isActive: workflow?.isActive,
            }, null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-create-edge-card">
          <Stack gap="sm" data-testid="test-workflow-page-create-edge-stack">
            <Text fw={700} data-testid="test-workflow-page-create-edge-title">Create Ticket Edge (from workflow definition):</Text>
            {createEdge ? (
              <Code block data-testid="test-workflow-page-create-edge-code">{JSON.stringify(createEdge, null, 2)}</Code>
            ) : (
              <Alert color={theme.colors[theme.primaryColor][4]} data-testid="test-workflow-page-create-edge-alert">No create edge found!</Alert>
            )}
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-all-edges-card">
          <Stack gap="sm" data-testid="test-workflow-page-all-edges-stack">
            <Text fw={700} data-testid="test-workflow-page-all-edges-title">All Edges:</Text>
            <Code block data-testid="test-workflow-page-all-edges-code">{JSON.stringify(workflow?.definition?.edges || [], null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-transitions-card">
          <Stack gap="sm" data-testid="test-workflow-page-transitions-stack">
            <Text fw={700} data-testid="test-workflow-page-transitions-title">All Transitions (from database):</Text>
            <Code block data-testid="test-workflow-page-transitions-code">{JSON.stringify(workflow?.transitions || [], null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder data-testid="test-workflow-page-full-definition-card">
          <Stack gap="sm" data-testid="test-workflow-page-full-definition-stack">
            <Text fw={700} data-testid="test-workflow-page-full-definition-title">Full Workflow Definition:</Text>
            <Code block data-testid="test-workflow-page-full-definition-code">{JSON.stringify(workflow?.definition || {}, null, 2)}</Code>
          </Stack>
        </Card>

        <ActionIcon
          variant='light'
          size='lg'
          onClick={fetchWorkflow}
          title='Refresh Data'
          data-testid="test-workflow-page-refresh-button"
        >
          <IconRefresh size={20} />
        </ActionIcon>
      </Stack>
    </Container>
  );
}


