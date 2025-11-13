import { httpClient } from './http-client';
import {
  ApiResponse,
  Category,
  Subcategory,
  DynamicField,
} from '../../types/unified';

export const categoriesClient = {
  getCategories: () =>
    httpClient.get<ApiResponse<Category[]>>('/categories'),

  getActiveCategories: () =>
    httpClient.get<ApiResponse<Category[]>>('/categories/active'),

  getCategory: (id: string) =>
    httpClient.get<ApiResponse<Category>>(`/categories/${id}`),

  createCategory: (data: Partial<Category>) =>
    httpClient.post<ApiResponse<Category>>('/categories', data),

  updateCategory: (id: string, data: Partial<Category>) =>
    httpClient.patch<ApiResponse<Category>>(`/categories/${id}`, data),

  deleteCategory: (id: string) => httpClient.delete(`/categories/${id}`),

  getDynamicFields: (categoryName: string) =>
    httpClient.get<ApiResponse<DynamicField[]>>(
      `/categories/dynamic-fields/${categoryName}`
    ),

  getSubcategories: (categoryName: string) =>
    httpClient.get<ApiResponse<Subcategory[]>>(
      `/categories/subcategories/${categoryName}`
    ),

  createSubcategory: (categoryId: string, data: Partial<Subcategory>) =>
    httpClient.post<ApiResponse<Subcategory>>(
      `/categories/${categoryId}/subcategories`,
      data
    ),

  updateSubcategory: (
    categoryId: string,
    subcategoryId: string,
    data: Partial<Subcategory>
  ) =>
    httpClient.put<ApiResponse<Subcategory>>(
      `/categories/${categoryId}/subcategories/${subcategoryId}`,
      data
    ),

  deleteSubcategory: (categoryId: string, subcategoryId: string) =>
    httpClient.delete(
      `/categories/${categoryId}/subcategories/${subcategoryId}`
    ),
};


