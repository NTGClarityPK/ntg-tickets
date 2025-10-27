import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { customFieldsApi } from '../lib/apiClient';
import {
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  CustomField,
} from '../types/unified';

export function useCustomFields(params?: {
  category?: string;
  isActive?: boolean;
}): UseQueryResult<CustomField[], Error> {
  return useQuery({
    queryKey: ['customFields', params],
    queryFn: async () => {
      const response = await customFieldsApi.getCustomFields();
      return response.data.data;
    },
  });
}

export function useCustomField(id: string): UseQueryResult<CustomField, Error> {
  return useQuery({
    queryKey: ['customField', id],
    queryFn: async () => {
      const response = await customFieldsApi.getCustomField(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomField(): UseMutationResult<CustomField, Error, CreateCustomFieldInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomFieldInput) => {
      const response = await customFieldsApi.createCustomField(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });
}

export function useUpdateCustomField(): UseMutationResult<CustomField, Error, { id: string; data: UpdateCustomFieldInput }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCustomFieldInput;
    }) => {
      const response = await customFieldsApi.updateCustomField(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });
}

export function useDeleteCustomField(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await customFieldsApi.deleteCustomField(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });
}
