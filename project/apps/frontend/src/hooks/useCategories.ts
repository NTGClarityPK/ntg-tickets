import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, Category, Subcategory } from '../lib/apiClient';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getCategories();
      return response.data.data as Category[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useActiveCategories() {
  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const response = await categoriesApi.getActiveCategories();
      return response.data.data as Category[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await categoriesApi.getCategory(id);
      return response.data.data as Category;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await categoriesApi.createCategory(data);
      return response.data.data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Category>;
    }) => {
      const response = await categoriesApi.updateCategory(id, data);
      return response.data.data as Category;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await categoriesApi.deleteCategory(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
  });
}

export function useDynamicFields(categoryName: string) {
  return useQuery({
    queryKey: ['dynamic-fields', categoryName],
    queryFn: async () => {
      const response = await categoriesApi.getDynamicFields(categoryName);
      // Ensure we always return an array
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
    enabled: !!categoryName,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
  });
}

export function useSubcategories(categoryName: string) {
  return useQuery({
    queryKey: ['subcategories', categoryName],
    queryFn: async () => {
      const response = await categoriesApi.getSubcategories(categoryName);
      return response.data.data as Subcategory[];
    },
    enabled: !!categoryName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<Subcategory>;
    }) => {
      const response = await categoriesApi.createSubcategory(categoryId, data);
      return response.data.data as Subcategory;
    },
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      });
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      subcategoryId,
      data,
    }: {
      categoryId: string;
      subcategoryId: string;
      data: Partial<Subcategory>;
    }) => {
      const response = await categoriesApi.updateSubcategory(
        categoryId,
        subcategoryId,
        data
      );
      return response.data.data as Subcategory;
    },
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      });
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      subcategoryId,
    }: {
      categoryId: string;
      subcategoryId: string;
    }) => {
      await categoriesApi.deleteSubcategory(categoryId, subcategoryId);
    },
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      });
    },
  });
}
