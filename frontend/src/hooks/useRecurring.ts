import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { recurringApi } from '../services/recurring';
import type { RecurringItem, RecurringRequest } from '../types/recurring';

const invalidateKeys = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ predicate: (query) => isRecurringOrDashboard(query) });
};

const isRecurringOrDashboard = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && ['recurring', 'dashboard'].includes(key);
};

export const useRecurring = () =>
  useQuery<RecurringItem[]>({
    queryKey: ['recurring'],
    queryFn: recurringApi.list,
    staleTime: 1000 * 60 * 2,
  });

export const useCreateRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation<RecurringItem, Error, RecurringRequest>({
    mutationFn: (payload: RecurringRequest) => recurringApi.create(payload),
    onSuccess: () => invalidateKeys(queryClient),
  });
};

export const useUpdateRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation<RecurringItem, Error, { id: number; payload: RecurringRequest }>({
    mutationFn: ({ id, payload }: { id: number; payload: RecurringRequest }) => recurringApi.update(id, payload),
    onSuccess: () => invalidateKeys(queryClient),
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => recurringApi.delete(id),
    onSuccess: () => invalidateKeys(queryClient),
  });
};

export const useToggleRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation<RecurringItem, Error, number>({
    mutationFn: (id: number) => recurringApi.toggle(id),
    onSuccess: () => invalidateKeys(queryClient),
  });
};
