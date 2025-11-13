import { httpClient } from './http-client';
import {
  ApiResponse,
  CustomField,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
} from '../../types/unified';

export const customFieldsClient = {
  getCustomFields: (params?: { category?: string; isActive?: boolean }) =>
    httpClient.get<ApiResponse<CustomField[]>>('/custom-fields', { params }),

  getCustomField: (id: string) =>
    httpClient.get<ApiResponse<CustomField>>(`/custom-fields/${id}`),

  createCustomField: (data: CreateCustomFieldInput) =>
    httpClient.post<ApiResponse<CustomField>>('/custom-fields', data),

  updateCustomField: (id: string, data: UpdateCustomFieldInput) =>
    httpClient.put<ApiResponse<CustomField>>(`/custom-fields/${id}`, data),

  deleteCustomField: (id: string) =>
    httpClient.delete<ApiResponse<void>>(`/custom-fields/${id}`),
};


