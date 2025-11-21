import { httpClient } from './http-client';
import { ApiResponse } from '../../types/unified';

interface WorkflowStatusItem {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  displayName: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  isDefault?: boolean;
  isActive?: boolean;
  isSystemDefault?: boolean;
  definition?: Record<string, unknown>;
  workingStatuses?: string[];
  doneStatuses?: string[];
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

  activateWorkflow: (id: string, workingStatuses?: string[], doneStatuses?: string[]) =>
    httpClient.patch<ApiResponse<void>>(`/workflows/${id}/activate`, {
      workingStatuses,
      doneStatuses,
    }),

  deactivateWorkflow: (id: string) =>
    httpClient.patch<ApiResponse<void>>(`/workflows/${id}/deactivate`),

  getDefaultWorkflow: () =>
    httpClient.get<ApiResponse<Workflow>>('/workflows/default'),

  getWorkflowStatuses: (id: string) =>
    httpClient.get<ApiResponse<string[]>>(`/workflows/${id}/statuses`),

  getStatusCategorization: (id: string) =>
    httpClient.get<ApiResponse<{ workingStatuses: string[]; doneStatuses: string[] }>>(
      `/workflows/${id}/status-categorization`
    ),

  getAllWorkflowStatuses: () =>
    httpClient.get<ApiResponse<WorkflowStatusItem[]>>('/workflows/all-statuses'),

  getDashboardStats: () =>
    httpClient.get<ApiResponse<{ all: number; working: number; done: number; hold: number }>>(
      '/workflows/dashboard-stats'
    ),

  getStaffPerformance: () =>
    httpClient.get<ApiResponse<Array<{
      name: string;
      all: number;
      working: number;
      done: number;
      hold: number;
      overdue: number;
      performance: number;
    }>>>('/workflows/staff-performance'),
};


