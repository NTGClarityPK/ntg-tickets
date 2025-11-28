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
    return <Container><Text>Loading...</Text></Container>;
  }

  if (error) {
    return <Container><Alert color={theme.colors[theme.primaryColor][9]}>{error}</Alert></Container>;
  }

  const createEdge = workflow?.definition?.edges?.find((edge: { data?: { isCreateTransition?: boolean }; source: string }) => 
    edge.data?.isCreateTransition === true || edge.source === 'create'
  );

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Title>Workflow Debug Page</Title>
        
        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Current User Info:</Text>
            <Code block>{JSON.stringify({
              id: user?.id,
              name: user?.name,
              email: user?.email,
              roles: user?.roles,
              activeRole: user?.activeRole,
            }, null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Can Create Ticket:</Text>
            <Text size="xl" c={canCreate ? theme.primaryColor : theme.colors[theme.primaryColor][9]}>
              {canCreateLoading ? 'Checking...' : canCreate ? 'YES ✓' : 'NO ✗'}
            </Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Workflow Info:</Text>
            <Code block>{JSON.stringify({
              id: workflow?.id,
              name: workflow?.name,
              status: workflow?.status,
              isDefault: workflow?.isDefault,
              isActive: workflow?.isActive,
            }, null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Create Ticket Edge (from workflow definition):</Text>
            {createEdge ? (
              <Code block>{JSON.stringify(createEdge, null, 2)}</Code>
            ) : (
              <Alert color={theme.colors[theme.primaryColor][4]}>No create edge found!</Alert>
            )}
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>All Edges:</Text>
            <Code block>{JSON.stringify(workflow?.definition?.edges || [], null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>All Transitions (from database):</Text>
            <Code block>{JSON.stringify(workflow?.transitions || [], null, 2)}</Code>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Full Workflow Definition:</Text>
            <Code block>{JSON.stringify(workflow?.definition || {}, null, 2)}</Code>
          </Stack>
        </Card>

        <ActionIcon
          variant='light'
          size='lg'
          onClick={fetchWorkflow}
          title='Refresh Data'
        >
          <IconRefresh size={20} />
        </ActionIcon>
      </Stack>
    </Container>
  );
}


