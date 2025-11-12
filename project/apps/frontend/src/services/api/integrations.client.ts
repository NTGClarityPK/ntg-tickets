import { httpClient } from './http-client';
import {
  ApiResponse,
  Integration,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationTestResult,
  WebhookPayload,
} from '../../types/unified';

export const integrationsClient = {
  getIntegrations: () =>
    httpClient.get<ApiResponse<Integration[]>>('/integrations'),

  getIntegration: (id: string) =>
    httpClient.get<ApiResponse<Integration>>(`/integrations/${id}`),

  createIntegration: (data: CreateIntegrationInput) =>
    httpClient.post<ApiResponse<Integration>>('/integrations', data),

  updateIntegration: (id: string, data: UpdateIntegrationInput) =>
    httpClient.put<ApiResponse<Integration>>(`/integrations/${id}`, data),

  deleteIntegration: (id: string) =>
    httpClient.delete<ApiResponse<void>>(`/integrations/${id}`),

  testIntegration: (id: string) =>
    httpClient.post<ApiResponse<IntegrationTestResult>>(
      `/integrations/${id}/test`
    ),

  sendWebhook: (id: string, payload: WebhookPayload) =>
    httpClient.post<ApiResponse<{ success: boolean }>>(
      `/integrations/${id}/webhook`,
      payload
    ),
};


