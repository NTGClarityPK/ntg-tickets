import { httpClient } from './http-client';
import {
  ApiResponse,
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
} from '../../types/unified';

export const emailTemplatesClient = {
  getEmailTemplates: () =>
    httpClient.get<ApiResponse<EmailTemplate[]>>('/email-templates'),

  getEmailTemplate: (id: string) =>
    httpClient.get<ApiResponse<EmailTemplate>>(`/email-templates/${id}`),

  createEmailTemplate: (data: CreateEmailTemplateInput) =>
    httpClient.post<ApiResponse<EmailTemplate>>('/email-templates', data),

  updateEmailTemplate: (id: string, data: UpdateEmailTemplateInput) =>
    httpClient.patch<ApiResponse<EmailTemplate>>(`/email-templates/${id}`, data),

  deleteEmailTemplate: (id: string) =>
    httpClient.delete(`/email-templates/${id}`),

  createDefaultTemplates: () =>
    httpClient.get<ApiResponse<void>>('/email-templates/defaults'),

  previewEmailTemplate: (id: string, variables: Record<string, unknown>) =>
    httpClient.get<ApiResponse<{ subject: string; html: string }>>(
      `/email-templates/${id}/preview`,
      { params: variables }
    ),
};


