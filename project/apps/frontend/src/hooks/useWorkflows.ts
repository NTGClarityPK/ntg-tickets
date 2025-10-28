import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { workflowsApi } from '../lib/apiClient';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  isDefault: boolean;
  isActive: boolean;
  definition?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  transitions?: Array<{
    id: string;
    fromState: string;
    toState: string;
    name: string;
    description?: string;
    order: number;
    isActive: boolean;
    conditions: Array<{
      id: string;
      type: string;
      value?: string;
      isActive: boolean;
    }>;
    actions: Array<{
      id: string;
      type: string;
      config: Record<string, unknown>;
      isActive: boolean;
    }>;
    permissions: Array<{
      id: string;
      role: string;
      canExecute: boolean;
      isActive: boolean;
    }>;
  }>;
}

interface WorkflowData {
  name: string;
  description?: string;
  isDefault?: boolean;
  definition?: Record<string, unknown>;
}


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
      
      setWorkflows(prev => [newWorkflow, ...prev]);
      
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
      
      setWorkflows(prev =>
        prev.map(workflow =>
          workflow.id === id ? updatedWorkflow : workflow
        )
      );

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
      
      setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
      
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

      setWorkflows(prev =>
        prev.map(workflow =>
          workflow.id === id ? { ...workflow, status: 'ACTIVE' as const } : workflow
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

      setWorkflows(prev =>
        prev.map(workflow =>
          workflow.id === id ? { ...workflow, status: 'INACTIVE' as const } : workflow
        )
      );

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
