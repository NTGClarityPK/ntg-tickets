import { ApiResponse } from '../../types/unified';

type Pagination =
  | {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  | undefined;

export interface NormalizedListResult<T> {
  items: T[];
  pagination?: Pagination;
}

export function normalizeListResponse<T>(
  payload: unknown
): NormalizedListResult<T> {
  const apiResponse = toApiResponse(payload);

  let data: unknown = apiResponse.data;
  let pagination = apiResponse.pagination;

  if (isRecord(data)) {
    if (Array.isArray(data.data)) {
      pagination =
        pagination ??
        extractPagination(data) ??
        extractPagination((data as Record<string, unknown>).meta);
      data = data.data;
    } else if (Array.isArray(data.items)) {
      pagination =
        pagination ??
        extractPagination(data) ??
        extractPagination((data as Record<string, unknown>).meta);
      data = data.items;
    }
  }

  const items = Array.isArray(data) ? (data as T[]) : [];

  return {
    items,
    pagination,
  };
}

export function normalizeItemResponse<T>(payload: unknown): T | null {
  const apiResponse = toApiResponse(payload);
  let data: unknown = apiResponse.data;

  if (isRecord(data) && 'data' in data && !Array.isArray(data.data)) {
    data = data.data;
  }

  return (data ?? null) as T | null;
}

export function extractPagination(
  source: unknown
): NormalizedListResult<unknown>['pagination'] {
  if (!isRecord(source)) {
    return undefined;
  }

  if (
    typeof source.page === 'number' &&
    typeof source.limit === 'number' &&
    typeof source.total === 'number' &&
    typeof source.totalPages === 'number'
  ) {
    return {
      page: source.page,
      limit: source.limit,
      total: source.total,
      totalPages: source.totalPages,
    };
  }

  return undefined;
}

function toApiResponse(payload: unknown): ApiResponse<unknown> {
  if (isApiResponse(payload)) {
    return payload;
  }

  if (isRecord(payload) && isApiResponse(payload.data)) {
    return payload.data;
  }

  return {
    data: payload,
  };
}

function isApiResponse(payload: unknown): payload is ApiResponse<unknown> {
  if (!isRecord(payload)) {
    return false;
  }

  return 'data' in payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

