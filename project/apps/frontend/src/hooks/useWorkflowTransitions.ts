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

      // Normalize status names for comparison - handle various formats
      const normalizeStatus = (status: string) => {
        if (!status) return '';
        // Convert to lowercase, replace spaces and hyphens with underscores
        return status.toLowerCase().replace(/[\s-]+/g, '_').trim();
      };
      
      const normalizedCurrentStatus = normalizeStatus(currentStatus);
      
      // Build a map of node IDs and labels for faster lookup
      const nodeMap = new Map<string, string[]>();
      if (definition.nodes) {
        definition.nodes.forEach((node: WorkflowNode) => {
          const normalizedId = normalizeStatus(node.id);
          const normalizedLabel = node.data?.label ? normalizeStatus(node.data.label) : normalizedId;
          const variations = [normalizedId, normalizedLabel];
          // Remove duplicates using Array.from for better compatibility
          nodeMap.set(node.id, Array.from(new Set(variations)));
        });
      }
      
      // Find all edges/transitions from the current status
      const transitions: WorkflowTransition[] = [];
      
      for (const edge of definition.edges) {
        // Skip the initial "create" transition
        if (edge.source === 'create' || edge.data?.isCreateTransition) {
          continue;
        }

        // Get all possible variations for source
        const sourceVariations = nodeMap.get(edge.source) || [normalizeStatus(edge.source)];
        
        // Also check node labels directly
        const sourceNode = definition.nodes?.find((n) => n.id === edge.source);
        if (sourceNode?.data?.label) {
          sourceVariations.push(normalizeStatus(sourceNode.data.label));
        }
        
        // Check if current status matches any source variation
        const sourceMatches = sourceVariations.some(variation => variation === normalizedCurrentStatus);

        if (sourceMatches) {
          // Check if user's role is allowed to execute this transition
          const allowedRoles = edge.data?.roles || [];
          const canExecute = allowedRoles.includes(userRole);

          // Find the target node to get its label
          const targetNode = definition.nodes?.find((n) => n.id === edge.target);
          const targetLabel = targetNode?.data?.label || edge.target;
          
          // Get the target status - use the node ID if it matches a standard status format
          // Otherwise convert label to uppercase with underscores
          let targetStatus: string;
          const normalizedTargetId = normalizeStatus(edge.target);
          const normalizedTargetLabel = targetLabel ? normalizeStatus(targetLabel) : normalizedTargetId;
          
          // If target node ID is already in the right format (e.g., "in_progress"), use it
          // Otherwise convert the label
          if (normalizedTargetId === normalizedTargetLabel && edge.target.includes('_')) {
            targetStatus = edge.target.toUpperCase();
          } else {
            targetStatus = targetLabel.toUpperCase().replace(/\s+/g, '_');
          }

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

