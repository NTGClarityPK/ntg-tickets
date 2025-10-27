import { useQuery, useMutation } from '@tanstack/react-query';
import {
  elasticsearchApi,
  ElasticsearchFilters,
  ElasticsearchResult,
  SearchSuggestion,
  ElasticsearchHealth,
} from '../lib/apiClient';

export function useElasticsearchSearch() {
  return useMutation({
    mutationFn: async ({
      query,
      filters,
    }: {
      query: string;
      filters?: ElasticsearchFilters;
    }) => {
      const response = await elasticsearchApi.searchTickets(query, filters);
      return response.data.data as ElasticsearchResult;
    },
  });
}

export function useElasticsearchSuggestions() {
  return useMutation({
    mutationFn: async ({ query, field }: { query: string; field?: string }) => {
      const response = await elasticsearchApi.getSuggestions(query, field);
      return response.data.data as SearchSuggestion[];
    },
  });
}

export function useElasticsearchAggregations(filters?: {
  status?: string[];
  priority?: string[];
  category?: string[];
}) {
  return useQuery({
    queryKey: ['elasticsearch', 'aggregations', filters],
    queryFn: async () => {
      const response = await elasticsearchApi.getAggregations(filters);
      return response.data.data as Record<string, unknown>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useElasticsearchHealth() {
  return useQuery({
    queryKey: ['elasticsearch', 'health'],
    queryFn: async () => {
      const response = await elasticsearchApi.getHealth();
      return response.data.data as ElasticsearchHealth;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useElasticsearchReindex() {
  return useMutation({
    mutationFn: async () => {
      const response = await elasticsearchApi.reindex();
      return response.data.data;
    },
  });
}
