import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { workflowsApi } from '../lib/apiClient';

interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  canExecute: boolean;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    roles?: string[];
    conditions?: string[];
    actions?: string[];
    isCreateTransition?: boolean;
  };
}

interface WorkflowNode {
  id: string;
  data?: {
    label?: string;
  };
}

interface WorkflowDefinition {
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

/**
 * Hook to get available workflow transitions for a ticket
 * If workflowSnapshot is provided, it uses that (for tickets with captured workflow)
 * Otherwise it fetches the current default workflow
 */
export function useWorkflowTransitions(currentStatus?: string, workflowSnapshot?: { definition?: WorkflowDefinition; status?: string }) {
  const [availableTransitions, setAvailableTransitions] = useState<WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [canTransitionToAny, setCanTransitionToAny] = useState(false);
  const { user } = useAuthStore();

  const fetchTransitions = useCallback(async () => {
    try {
      setLoading(true);
      
      // If no user or no current status, cannot transition
      if (!user || !currentStatus) {
        setAvailableTransitions([]);
        setCanTransitionToAny(false);
        return;
      }

      let workflow;

      // Use workflow snapshot if provided (for old tickets)
      if (workflowSnapshot) {
        workflow = workflowSnapshot;
      } else {
        // Fetch the default/active workflow for new tickets
        const response = await workflowsApi.getDefaultWorkflow();
        workflow = response.data.data;

        // If no workflow or not active, default to empty
        if (!workflow || workflow.status !== 'ACTIVE') {
          setAvailableTransitions([]);
          setCanTransitionToAny(false);
          return;
        }
      }

      // Get the workflow definition which contains edges with roles
      const definition = workflow.definition as WorkflowDefinition | undefined;
      
      if (!definition || !definition.edges || definition.edges.length === 0) {
        setAvailableTransitions([]);
        setCanTransitionToAny(false);
        return;
      }

      // Get user's role
      const userRole = user.activeRole || user.roles?.[0];
      
      if (!userRole) {
        setAvailableTransitions([]);
        setCanTransitionToAny(false);
        return;
      }

      // Normalize the current status to match node IDs (lowercase, underscores to lowercase)
      const normalizedCurrentStatus = currentStatus.toLowerCase().replace('_', '_');
      
      // Find all edges/transitions from the current status
      const transitions: WorkflowTransition[] = [];
      
      for (const edge of definition.edges) {
        // Skip the initial "create" transition
        if (edge.source === 'create' || edge.data?.isCreateTransition) {
          continue;
        }

        // Check if this edge's source matches the current status
        // The source is the node ID (e.g., "new", "open", "in_progress")
        const edgeSource = edge.source.toLowerCase();
        
        // Match the source with current status
        const sourceMatches = 
          edgeSource === normalizedCurrentStatus ||
          edgeSource.replace('_', '') === normalizedCurrentStatus.replace('_', '') ||
          // Also try matching nodes by label
          definition.nodes?.find((n) => 
            n.id === edge.source && 
            n.data?.label?.toLowerCase().replace(/\s+/g, '_') === normalizedCurrentStatus
          );

        if (sourceMatches) {
          // Check if user's role is allowed to execute this transition
          const allowedRoles = edge.data?.roles || [];
          const canExecute = allowedRoles.includes(userRole);

          // Find the target node to get its label
          const targetNode = definition.nodes?.find((n) => n.id === edge.target);
          const targetLabel = targetNode?.data?.label || edge.target;
          
          // Convert target label to TicketStatus format (e.g., "In Progress" -> "IN_PROGRESS")
          const targetStatus = targetLabel.toUpperCase().replace(/\s+/g, '_');

          transitions.push({
            from: currentStatus,
            to: targetStatus,
            label: edge.label || targetLabel,
            canExecute,
          });
        }
      }

      // Filter to only executable transitions
      const executableTransitions = transitions.filter(t => t.canExecute);
      
      setAvailableTransitions(transitions);
      setCanTransitionToAny(executableTransitions.length > 0);
    } catch {
      setAvailableTransitions([]);
      setCanTransitionToAny(false);
    } finally {
      setLoading(false);
    }
  }, [user, currentStatus, workflowSnapshot]);

  useEffect(() => {
    fetchTransitions();
  }, [fetchTransitions]);

  // Get only the statuses the user can transition to
  const availableStatuses = availableTransitions
    .filter(t => t.canExecute)
    .map(t => t.to);

  return { 
    availableTransitions,
    availableStatuses,
    canTransitionToAny,
    loading,
    refetch: fetchTransitions 
  };
}

