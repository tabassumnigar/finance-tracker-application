import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { budgetsApi } from '../services/budgets';
import type { BudgetRequest, BudgetResponse } from '../types/budget';

const invalidateKeys = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ predicate: (query) => isBudgetOrDashboard(query) });
};

const isBudgetOrDashboard = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && ['budgets', 'dashboard'].includes(key);
};

export const useBudgets = (month: number, year: number) =>
  useQuery<BudgetResponse[]>({
    queryKey: ['budgets', month, year],
    queryFn: () => budgetsApi.list(month, year),
    staleTime: 1000 * 60 * 2,
  });

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<BudgetResponse, Error, BudgetRequest>({
    mutationFn: (payload: BudgetRequest) => budgetsApi.create(payload),
    onSuccess: () => invalidateKeys(queryClient),
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<BudgetResponse, Error, { id: number; payload: BudgetRequest }>({
    mutationFn: ({ id, payload }: { id: number; payload: BudgetRequest }) => budgetsApi.update(id, payload),
    onSuccess: () => invalidateKeys(queryClient),
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => invalidateKeys(queryClient),
  });
};

export const useDuplicateBudgets = () => {
  const queryClient = useQueryClient();
  return useMutation<BudgetResponse[], Error, { month: number; year: number }>({
    mutationFn: ({ month, year }: { month: number; year: number }) => budgetsApi.duplicateLastMonth(month, year),
    onSuccess: () => invalidateKeys(queryClient),
  });
};
