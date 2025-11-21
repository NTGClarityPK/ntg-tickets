import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { workflowsApi, Workflow, WorkflowData } from '../lib/apiClient';
import { useDynamicTheme } from './useDynamicTheme';


export function useWorkflows() {
  const { primaryLight, primaryDark } = useDynamicTheme();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await workflowsApi.getWorkflows();
      setWorkflows(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch workflows',
        color: primaryDark,
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (input: WorkflowData): Promise<Workflow> => {
    try {
      const response = await workflowsApi.createWorkflow(input);
      const newWorkflow = response.data.data;
      
      // Refetch all workflows to ensure status consistency
      await fetchWorkflows();
      
      notifications.show({
        title: 'Success',
        message: 'Workflow created successfully',
        color: primaryLight,
      });

      return newWorkflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to create workflow',
        color: primaryDark,
      });
      throw new Error(errorMessage);
    }
  };

  const updateWorkflow = async (id: string, input: WorkflowData): Promise<Workflow> => {
    try {
      const response = await workflowsApi.updateWorkflow(id, input);
      const updatedWorkflow = response.data.data;
      
      // Refetch all workflows to ensure status consistency
      await fetchWorkflows();

      notifications.show({
        title: 'Success',
        message: 'Workflow updated successfully',
        color: primaryLight,
      });

      return updatedWorkflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to update workflow',
        color: primaryDark,
      });
      throw new Error(errorMessage);
    }
  };

  const deleteWorkflow = async (id: string): Promise<void> => {
    try {
      await workflowsApi.deleteWorkflow(id);
      
      // Refetch all workflows to ensure status consistency
      // (deleting an active workflow activates the system default)
      await fetchWorkflows();
      
      notifications.show({
        title: 'Success',
        message: 'Workflow deleted successfully',
        color: primaryLight,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to delete workflow',
        color: primaryDark,
      });
      throw new Error(errorMessage);
    }
  };

  const setDefaultWorkflow = async (id: string): Promise<void> => {
    try {
      await workflowsApi.setDefaultWorkflow(id);

      setWorkflows(prev =>
        prev.map(workflow => ({
          ...workflow,
          isDefault: workflow.id === id,
        }))
      );

      notifications.show({
        title: 'Success',
        message: 'Default workflow updated successfully',
        color: primaryLight,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to set default workflow',
        color: primaryDark,
      });
      throw new Error(errorMessage);
    }
  };

  const activateWorkflow = async (
    id: string,
    workingStatuses?: string[],
    doneStatuses?: string[]
  ): Promise<void> => {
    try {
      await workflowsApi.activateWorkflow(id, workingStatuses, doneStatuses);

      // Deactivate all other workflows and activate the selected one
      setWorkflows(prev =>
        prev.map(workflow =>
          workflow.id === id 
            ? { 
                ...workflow, 
                status: 'ACTIVE' as const,
                workingStatuses: workingStatuses || workflow.workingStatuses,
                doneStatuses: doneStatuses || workflow.doneStatuses,
              } 
            : { ...workflow, status: 'INACTIVE' as const }
        )
      );

      notifications.show({
        title: 'Success',
        message: 'Workflow activated successfully',
        color: primaryLight,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to activate workflow',
        color: primaryDark,
      });
      throw new Error(errorMessage);
    }
  };

  const deactivateWorkflow = async (id: string): Promise<void> => {
    try {
      await workflowsApi.deactivateWorkflow(id);

      // Refetch all workflows to ensure status consistency
      // (deactivating an active workflow activates the system default)
      await fetchWorkflows();

      notifications.show({
        title: 'Success',
        message: 'Workflow deactivated successfully',
        color: primaryLight,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to deactivate workflow',
        color: primaryDark,
      });
      throw new Error(errorMessage);
    }
  };

  const getActiveWorkflow = useCallback(async (): Promise<Workflow | null> => {
    try {
      const response = await workflowsApi.getDefaultWorkflow();
      return response.data.data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch active workflow:', err);
      return null;
    }
  }, []);

  const getDashboardStats = useCallback(async (): Promise<{ all: number; working: number; done: number; hold: number }> => {
    try {
      // eslint-disable-next-line no-console
      console.log('🚀 [useWorkflows] Calling getDashboardStats API...');
      const response = await workflowsApi.getDashboardStats();
      // eslint-disable-next-line no-console
      console.log('📊 [useWorkflows] Dashboard stats API response:', response);
      // eslint-disable-next-line no-console
      console.log('📊 [useWorkflows] Dashboard stats response.data:', response.data);
      // eslint-disable-next-line no-console
      console.log('📊 [useWorkflows] Dashboard stats response.data.data:', response.data?.data);
      
      const stats = response.data?.data || { all: 0, working: 0, done: 0, hold: 0 };
      // eslint-disable-next-line no-console
      console.log('✅ [useWorkflows] Dashboard stats extracted:', stats);
      return stats;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('❌ [useWorkflows] Failed to fetch dashboard stats:', err);
      // eslint-disable-next-line no-console
      console.error('❌ [useWorkflows] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        response: err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: unknown; status?: number } }).response : undefined,
        stack: err instanceof Error ? err.stack : undefined,
      });
      // Return zeros on error
      return { all: 0, working: 0, done: 0, hold: 0 };
    }
  }, []);

  const getStaffPerformance = useCallback(async (): Promise<Array<{
    name: string;
    all: number;
    working: number;
    done: number;
    hold: number;
    overdue: number;
    performance: number;
  }>> => {
    try {
      const response = await workflowsApi.getStaffPerformance();
      return response.data?.data || [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ [useWorkflows] Failed to fetch staff performance:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setDefaultWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    getActiveWorkflow,
    getDashboardStats,
    getStaffPerformance,
  };
}
