import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { categoriesApi } from '../services/categories';
import type { CategoryDto, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';

const categoriesKey = (includeArchived: boolean) => ['categories', includeArchived ? 'archived' : 'active'];

export const useCategoriesQuery = (includeArchived = false) =>
  useQuery<CategoryDto[]>({
    queryKey: categoriesKey(includeArchived),
    queryFn: () => categoriesApi.list(includeArchived),
    staleTime: 1000 * 60 * 2,
  });

const invalidateCategories = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ predicate: (query) => isCategoriesQuery(query) });
};

const isCategoriesQuery = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && key === 'categories';
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<CategoryDto, Error, CreateCategoryPayload>({
    mutationFn: (payload: CreateCategoryPayload) => categoriesApi.create(payload),
    onSuccess: () => invalidateCategories(queryClient),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<CategoryDto, Error, { id: number; payload: UpdateCategoryPayload }>({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryPayload }) => categoriesApi.update(id, payload),
    onSuccess: () => invalidateCategories(queryClient),
  });
};

export const useArchiveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => categoriesApi.archive(id),
    onSuccess: () => invalidateCategories(queryClient),
  });
};
