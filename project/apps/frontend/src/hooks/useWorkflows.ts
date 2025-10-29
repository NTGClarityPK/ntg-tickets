import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { workflowsApi, Workflow, WorkflowData } from '../lib/apiClient';


export function useWorkflows() {
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
        color: 'red',
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
        color: 'green',
      });

      return newWorkflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to create workflow',
        color: 'red',
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
        color: 'green',
      });

      return updatedWorkflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to update workflow',
        color: 'red',
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
        color: 'green',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to delete workflow',
        color: 'red',
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
        color: 'green',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to set default workflow',
        color: 'red',
      });
      throw new Error(errorMessage);
    }
  };

  const activateWorkflow = async (id: string): Promise<void> => {
    try {
      await workflowsApi.activateWorkflow(id);

      // Deactivate all other workflows and activate the selected one
      setWorkflows(prev =>
        prev.map(workflow =>
          workflow.id === id 
            ? { ...workflow, status: 'ACTIVE' as const } 
            : { ...workflow, status: 'INACTIVE' as const }
        )
      );

      notifications.show({
        title: 'Success',
        message: 'Workflow activated successfully',
        color: 'green',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to activate workflow',
        color: 'red',
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
        color: 'green',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      notifications.show({
        title: 'Error',
        message: 'Failed to deactivate workflow',
        color: 'red',
      });
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchWorkflows();
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
  };
}
