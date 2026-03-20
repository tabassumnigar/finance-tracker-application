import { apiClient } from './api';
import type { BudgetRequest, BudgetResponse } from '../types/budget';

const endpoint = '/budgets';

type BudgetApiResponse = {
  id: number;
  category_id: number;
  category_name: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  progress_percent: number;
  alert_threshold_percent: number;
  alert_level: BudgetResponse['alertLevel'];
};

const normalizeBudget = (budget: BudgetApiResponse): BudgetResponse => ({
  id: budget.id,
  categoryId: budget.category_id,
  categoryName: budget.category_name,
  month: budget.month,
  year: budget.year,
  amount: budget.amount,
  spent: budget.spent,
  progressPercent: budget.progress_percent,
  alertThresholdPercent: budget.alert_threshold_percent,
  alertLevel: budget.alert_level,
});

export const budgetsApi = {
  list: (month: number, year: number) =>
    apiClient.get<BudgetApiResponse[]>(endpoint, { params: { month, year } }).then((res) => res.data.map(normalizeBudget)),
  create: (payload: BudgetRequest) => apiClient.post<BudgetApiResponse>(endpoint, payload).then((res) => normalizeBudget(res.data)),
  update: (id: number, payload: BudgetRequest) =>
    apiClient.put<BudgetApiResponse>(`${endpoint}/${id}`, payload).then((res) => normalizeBudget(res.data)),
  delete: (id: number) => apiClient.delete(`${endpoint}/${id}`).then(() => undefined),
  duplicateLastMonth: (month: number, year: number) =>
    apiClient.post<BudgetApiResponse[]>(`${endpoint}/duplicate-last-month`, null, { params: { month, year } }).then((res) => res.data.map(normalizeBudget)),
};
