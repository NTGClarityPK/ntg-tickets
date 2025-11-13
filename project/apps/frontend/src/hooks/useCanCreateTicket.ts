import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '../stores/useAuthStore';
import { workflowsApi } from '../lib/apiClient';

interface WorkflowEdge {
  data?: { 
    isCreateTransition?: boolean; 
    roles?: string[] 
  };
  source: string;
}

interface WorkflowDefinition {
  edges?: WorkflowEdge[];
}

export function useCanCreateTicket() {
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAuthUser();

  const checkPermission = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        setCanCreate(false);
        return;
      }

      const response = await workflowsApi.getDefaultWorkflow();
      const workflow = response.data.data;

      if (!workflow) {
        setCanCreate(false);
        return;
      }

      if (workflow.status !== 'ACTIVE') {
        setCanCreate(false);
        return;
      }

      const definition = workflow.definition as WorkflowDefinition | undefined;
      if (!definition || !definition.edges || definition.edges.length === 0) {
        setCanCreate(false);
        return;
      }

      const createEdge = definition.edges.find((edge) =>
        edge.data?.isCreateTransition === true ||
        edge.source === 'create'
      );

      if (!createEdge) {
        setCanCreate(false);
        return;
      }

      const userRole = user.activeRole || user.roles?.[0];
      if (!userRole) {
        setCanCreate(false);
        return;
      }

      const allowedRoles = createEdge.data?.roles || [];
      const hasPermission = allowedRoles.includes(userRole);

      setCanCreate(hasPermission);
    } catch (error) {
      setCanCreate(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return { canCreate, loading, refetch: checkPermission };
}
