import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  savedSearchesApi,
  SavedSearch,
  CreateSavedSearchInput,
  UpdateSavedSearchInput,
  PopularSavedSearch,
} from '../lib/apiClient';

export function useSavedSearches(includePublic?: boolean) {
  return useQuery({
    queryKey: ['saved-searches', includePublic],
    queryFn: async () => {
      const response = await savedSearchesApi.getSavedSearches(includePublic);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSavedSearch(id: string) {
  return useQuery({
    queryKey: ['saved-search', id],
    queryFn: async () => {
      const response = await savedSearchesApi.getSavedSearch(id);
      return response.data.data as SavedSearch;
    },
    enabled: !!id,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSavedSearchInput) => {
      const response = await savedSearchesApi.createSavedSearch(data);
      return response.data.data as SavedSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSavedSearchInput;
    }) => {
      const response = await savedSearchesApi.updateSavedSearch(id, data);
      return response.data.data as SavedSearch;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['saved-search', id] });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await savedSearchesApi.deleteSavedSearch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

export function useExecuteSavedSearch() {
  return useMutation({
    mutationFn: async ({
      id,
      page,
      limit,
    }: {
      id: string;
      page?: number;
      limit?: number;
    }) => {
      const response = await savedSearchesApi.executeSavedSearch(
        id,
        page,
        limit
      );
      return response.data.data;
    },
  });
}

export function useDuplicateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const response = await savedSearchesApi.duplicateSavedSearch(id, name);
      return response.data.data as SavedSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

export function usePopularSearches(limit?: number) {
  return useQuery({
    queryKey: ['popular-searches', limit],
    queryFn: async () => {
      const response = await savedSearchesApi.getPopularSearches(limit);
      return response.data.data as PopularSavedSearch[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
