import { httpClient } from './http-client';
import { ApiResponse } from '../../types/unified';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  isDefault?: boolean;
  isActive?: boolean;
  isSystemDefault?: boolean;
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

export interface WorkflowData {
  name: string;
  description?: string;
  status?: string;
  definition?: Record<string, unknown>;
}

export const workflowsClient = {
  getWorkflows: () =>
    httpClient.get<ApiResponse<Workflow[]>>('/workflows'),

  getWorkflow: (id: string) =>
    httpClient.get<ApiResponse<Workflow>>(`/workflows/${id}`),

  createWorkflow: (data: WorkflowData) =>
    httpClient.post<ApiResponse<Workflow>>('/workflows', data),

  updateWorkflow: (id: string, data: WorkflowData) =>
    httpClient.patch<ApiResponse<Workflow>>(`/workflows/${id}`, data),

  deleteWorkflow: (id: string) =>
    httpClient.delete<ApiResponse<void>>(`/workflows/${id}`),

  setDefaultWorkflow: (id: string) =>
    httpClient.patch<ApiResponse<void>>(`/workflows/${id}/set-default`),

  activateWorkflow: (id: string) =>
    httpClient.patch<ApiResponse<void>>(`/workflows/${id}/activate`),

  deactivateWorkflow: (id: string) =>
    httpClient.patch<ApiResponse<void>>(`/workflows/${id}/deactivate`),

  getDefaultWorkflow: () =>
    httpClient.get<ApiResponse<Workflow>>('/workflows/default'),
};


