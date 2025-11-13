import { httpClient } from './http-client';
import {
  ApiResponse,
  ElasticsearchFilters,
  ElasticsearchResult,
  SearchSuggestion,
  ElasticsearchHealth,
} from '../../types/unified';

export const elasticsearchClient = {
  searchTickets: (query: string, filters?: ElasticsearchFilters) =>
    httpClient.get<ApiResponse<ElasticsearchResult>>('/elasticsearch/search', {
      params: {
        q: query,
        ...filters,
        status: filters?.status?.join(','),
        priority: filters?.priority?.join(','),
        category: filters?.category?.join(','),
        assignedTo: filters?.assignedTo?.join(','),
      },
    }),

  getSuggestions: (query: string, field: string = 'title') =>
    httpClient.get<ApiResponse<SearchSuggestion[]>>(
      '/elasticsearch/suggestions',
      {
        params: { q: query, field },
      }
    ),

  getAggregations: (filters?: {
    status?: string[];
    priority?: string[];
    category?: string[];
  }) =>
    httpClient.get<ApiResponse<Record<string, unknown>>>(
      '/elasticsearch/aggregations',
      {
        params: {
          status: filters?.status?.join(','),
          priority: filters?.priority?.join(','),
          category: filters?.category?.join(','),
        },
      }
    ),

  getHealth: () =>
    httpClient.get<ApiResponse<ElasticsearchHealth>>('/elasticsearch/health'),

  reindex: () =>
    httpClient.post<ApiResponse<{ message: string }>>('/elasticsearch/reindex'),
};


