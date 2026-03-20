import { apiClient } from './api';
import type { RecurringItem, RecurringRequest } from '../types/recurring';

const endpoint = '/recurring';

type RecurringApiResponse = {
  id: number;
  title: string;
  type: RecurringItem['type'];
  amount: number;
  category_id?: number | null;
  category_name?: string | null;
  account_id: number;
  account_name: string;
  transfer_account_id?: number | null;
  transfer_account_name?: string | null;
  frequency: RecurringItem['frequency'];
  start_date: string;
  end_date?: string | null;
  next_run: string;
  last_run?: string | null;
  auto_create_transaction: boolean;
  active: boolean;
};

const normalizeRecurring = (item: RecurringApiResponse): RecurringItem => ({
  id: item.id,
  title: item.title,
  type: item.type,
  amount: item.amount,
  categoryId: item.category_id ?? undefined,
  categoryName: item.category_name ?? undefined,
  accountId: item.account_id,
  accountName: item.account_name,
  transferAccountId: item.transfer_account_id ?? undefined,
  transferAccountName: item.transfer_account_name ?? undefined,
  frequency: item.frequency,
  startDate: item.start_date,
  endDate: item.end_date ?? undefined,
  nextRun: item.next_run,
  lastRun: item.last_run ?? undefined,
  autoCreateTransaction: item.auto_create_transaction,
  active: item.active,
});

export const recurringApi = {
  list: () => apiClient.get<RecurringApiResponse[]>(endpoint).then((res) => res.data.map(normalizeRecurring)),
  create: (payload: RecurringRequest) => apiClient.post<RecurringApiResponse>(endpoint, payload).then((res) => normalizeRecurring(res.data)),
  update: (id: number, payload: RecurringRequest) =>
    apiClient.put<RecurringApiResponse>(`${endpoint}/${id}`, payload).then((res) => normalizeRecurring(res.data)),
  delete: (id: number) => apiClient.delete(`${endpoint}/${id}`).then(() => undefined),
  toggle: (id: number) => apiClient.post<RecurringApiResponse>(`${endpoint}/${id}/toggle`).then((res) => normalizeRecurring(res.data)),
};
