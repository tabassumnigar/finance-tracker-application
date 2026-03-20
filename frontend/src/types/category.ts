export type CategoryType = 'INCOME' | 'EXPENSE';

export type CategoryDto = {
  id: number;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryPayload = {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
};

export type UpdateCategoryPayload = CreateCategoryPayload;
