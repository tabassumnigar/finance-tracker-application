import { apiClient } from './api';
import type { CategoryDto, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category';

type CategoryApiDto = {
  id: number;
  name: string;
  type: CategoryDto['type'];
  color: string;
  icon?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

const normalizeCategory = (category: CategoryApiDto): CategoryDto => ({
  id: category.id,
  name: category.name,
  type: category.type,
  color: category.color,
  icon: category.icon ?? undefined,
  archived: category.archived,
  createdAt: category.created_at,
  updatedAt: category.updated_at,
});

export const categoriesApi = {
  list: (includeArchived = false) =>
    apiClient
      .get<CategoryApiDto[]>('/categories', { params: { includeArchived } })
      .then((res) => res.data.map(normalizeCategory)),
  create: (payload: CreateCategoryPayload) =>
    apiClient.post<CategoryApiDto>('/categories', payload).then((res) => normalizeCategory(res.data)),
  update: (id: number, payload: UpdateCategoryPayload) =>
    apiClient.put<CategoryApiDto>(`/categories/${id}`, payload).then((res) => normalizeCategory(res.data)),
  archive: (id: number) => apiClient.delete(`/categories/${id}`).then(() => undefined),
};
