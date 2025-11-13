import { httpClient } from './http-client';
import {
  ApiResponse,
  SavedSearch,
  CreateSavedSearchInput,
  UpdateSavedSearchInput,
  PopularSavedSearch,
  Ticket,
} from '../../types/unified';

export interface PaginatedTicketsResponse {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const savedSearchesClient = {
  getSavedSearches: (includePublic?: boolean) =>
    httpClient.get<ApiResponse<SavedSearch[]>>('/saved-searches', {
      params: { includePublic },
    }),

  createSavedSearch: (data: CreateSavedSearchInput) =>
    httpClient.post<ApiResponse<SavedSearch>>('/saved-searches', data),

  getSavedSearch: (id: string) =>
    httpClient.get<ApiResponse<SavedSearch>>(`/saved-searches/${id}`),

  executeSavedSearch: (id: string, page?: number, limit?: number) =>
    httpClient.get<ApiResponse<PaginatedTicketsResponse>>(
      `/saved-searches/${id}/execute`,
      { params: { page, limit } }
    ),

  duplicateSavedSearch: (id: string, name?: string) =>
    httpClient.post<ApiResponse<SavedSearch>>(
      `/saved-searches/${id}/duplicate`,
      { name }
    ),

  getPopularSearches: (limit?: number) =>
    httpClient.get<ApiResponse<PopularSavedSearch[]>>(
      '/saved-searches/popular',
      {
        params: { limit },
      }
    ),

  updateSavedSearch: (id: string, data: UpdateSavedSearchInput) =>
    httpClient.patch<ApiResponse<SavedSearch>>(`/saved-searches/${id}`, data),

  deleteSavedSearch: (id: string) =>
    httpClient.delete<ApiResponse<{ message: string }>>(
      `/saved-searches/${id}`
    ),
};


