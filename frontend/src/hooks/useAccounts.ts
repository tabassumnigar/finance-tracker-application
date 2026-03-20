import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { accountsApi } from '../services/accounts';
import type { AccountDto, CreateAccountPayload, TransferPayload, UpdateAccountPayload } from '../types/account';

const accountsQueryKey = ['accounts'];

export const useAccountsQuery = () =>
  useQuery<AccountDto[]>({
    queryKey: accountsQueryKey,
    queryFn: accountsApi.list,
    staleTime: 1000 * 60 * 2,
  });

const invalidateAccounts = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ predicate: (query) => isAccountsQuery(query) });
};

const isAccountsQuery = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && key === 'accounts';
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<AccountDto, Error, CreateAccountPayload>({
    mutationFn: (payload: CreateAccountPayload) => accountsApi.create(payload),
    onSuccess: () => invalidateAccounts(queryClient),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<AccountDto, Error, { id: number; payload: UpdateAccountPayload }>({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAccountPayload }) => accountsApi.update(id, payload),
    onSuccess: () => invalidateAccounts(queryClient),
  });
};

export const useTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, TransferPayload>({
    mutationFn: (payload: TransferPayload) => accountsApi.transfer(payload),
    onSuccess: () => invalidateAccounts(queryClient),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (accountId: number) => accountsApi.delete(accountId),
    onSuccess: () => invalidateAccounts(queryClient),
  });
};
