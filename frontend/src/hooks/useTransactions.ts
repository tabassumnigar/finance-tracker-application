import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { transactionsApi } from '../services/transactions';
import type { CreateTransactionPayload, TransactionListFilter, UpdateTransactionPayload } from '../types/transaction';

const transactionsQueryKey = (filter: TransactionListFilter) => ['transactions', JSON.stringify(filter)];

export const useTransactions = (filter: TransactionListFilter) =>
  useQuery({
    queryKey: transactionsQueryKey(filter),
    queryFn: () => transactionsApi.list(filter),
  });

const invalidateTransactions = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ predicate: (query) => isTransactionsQuery(query) });
};

const invalidateAccountsAndDashboard = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({
    predicate: (query) => isAccountsQuery(query) || isDashboardQuery(query),
  });
};

const isTransactionsQuery = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && key === 'transactions';
};

const isAccountsQuery = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && key === 'accounts';
};

const isDashboardQuery = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && key === 'dashboard';
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionsApi.create(payload),
    onSuccess: () => {
      invalidateTransactions(queryClient);
      invalidateAccountsAndDashboard(queryClient);
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTransactionPayload }) =>
      transactionsApi.update(id, payload),
    onSuccess: () => invalidateTransactions(queryClient),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => invalidateTransactions(queryClient),
  });
};
