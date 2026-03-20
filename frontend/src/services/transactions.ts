import { apiClient } from './api';
import type { CreateTransactionPayload, TransactionListFilter, TransactionPage, TransactionDto, UpdateTransactionPayload } from '../types/transaction';

type TransactionApiDto = {
  id: number;
  account_id: number;
  transfer_account_id?: number | null;
  category_id?: number | null;
  type: TransactionDto['type'];
  amount: number;
  description: string;
  merchant?: string | null;
  payment_method?: string | null;
  tags: string[];
  transaction_date: string;
  created_at: string;
  updated_at: string;
  recurring_transaction_id?: number | null;
};

type TransactionPageApi = {
  items: TransactionApiDto[];
  total: number;
  page: number;
  size: number;
};

const normalizeTransaction = (transaction: TransactionApiDto): TransactionDto => ({
  id: transaction.id,
  accountId: transaction.account_id,
  transferAccountId: transaction.transfer_account_id ?? undefined,
  categoryId: transaction.category_id ?? undefined,
  type: transaction.type,
  amount: transaction.amount,
  description: transaction.description,
  merchant: transaction.merchant ?? undefined,
  paymentMethod: transaction.payment_method ?? undefined,
  tags: transaction.tags ?? [],
  transactionDate: transaction.transaction_date,
  createdAt: transaction.created_at,
  updatedAt: transaction.updated_at,
  recurringTransactionId: transaction.recurring_transaction_id ?? undefined,
});

export const transactionsApi = {
  list: (filter: TransactionListFilter) =>
    apiClient
      .get<TransactionPageApi>('/transactions', {
        params: {
          page: filter.page,
          size: filter.size,
          search: filter.search,
          type: filter.type,
          accountId: filter.accountId,
          categoryId: filter.categoryId,
          minAmount: filter.minAmount,
          maxAmount: filter.maxAmount,
          fromDate: filter.fromDate,
          toDate: filter.toDate,
        },
      })
      .then((res) => ({
        ...res.data,
        items: res.data.items.map(normalizeTransaction),
      })),
  detail: (id: number) =>
    apiClient.get<TransactionApiDto>(`/transactions/${id}`).then((res) => normalizeTransaction(res.data)),
  create: (payload: CreateTransactionPayload) =>
    apiClient.post<TransactionApiDto>('/transactions', payload).then((res) => normalizeTransaction(res.data)),
  update: (id: number, payload: UpdateTransactionPayload) =>
    apiClient.put<TransactionApiDto>(`/transactions/${id}`, payload).then((res) => normalizeTransaction(res.data)),
  delete: (id: number) => apiClient.delete(`/transactions/${id}`).then(() => undefined),
};
