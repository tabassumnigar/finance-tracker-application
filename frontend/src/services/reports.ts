import { apiClient } from './api';
import type { AccountBalancePoint, CategorySpendReport, ReportTrendPoint, ReportsFilter } from '../types/report';

const sanitizeFilters = (filters: ReportsFilter) => {
  const params: Record<string, string | number> = {};
  if (filters.startDate) {
    params.startDate = filters.startDate;
  }
  if (filters.endDate) {
    params.endDate = filters.endDate;
  }
  if (filters.accountId) {
    params.accountId = filters.accountId;
  }
  if (filters.categoryId) {
    params.categoryId = filters.categoryId;
  }
  if (filters.transactionType) {
    params.transactionType = filters.transactionType;
  }
  return params;
};

type CategorySpendApi = {
  category_id: number;
  category_name: string;
  color?: string | null;
  icon?: string | null;
  amount: number;
  percentage: number;
};

type AccountBalancePointApi = {
  account_id: number;
  account_name: string;
  date: string;
  balance: number;
};

const normalizeCategorySpend = (item: CategorySpendApi): CategorySpendReport => ({
  categoryId: item.category_id,
  categoryName: item.category_name,
  color: item.color ?? undefined,
  icon: item.icon ?? undefined,
  amount: Number(item.amount),
  percentage: Number(item.percentage),
});

const normalizeBalancePoint = (item: AccountBalancePointApi): AccountBalancePoint => ({
  accountId: item.account_id,
  accountName: item.account_name,
  date: item.date,
  balance: Number(item.balance),
});

export const reportsApi = {
  categorySpend: (filters: ReportsFilter) =>
    apiClient
      .get<CategorySpendApi[]>('/reports/category-spend', { params: sanitizeFilters(filters) })
      .then((res) => res.data.map(normalizeCategorySpend)),
  incomeVsExpense: (filters: ReportsFilter) =>
    apiClient
      .get<ReportTrendPoint[]>('/reports/income-vs-expense', { params: sanitizeFilters(filters) })
      .then((res) => res.data),
  accountBalanceTrend: (filters: ReportsFilter) =>
    apiClient
      .get<AccountBalancePointApi[]>('/reports/account-balance-trend', { params: sanitizeFilters(filters) })
      .then((res) => res.data.map(normalizeBalancePoint)),
  exportCsv: (filters: ReportsFilter) =>
    apiClient
      .get('/reports/export/csv', {
        params: sanitizeFilters(filters),
        responseType: 'blob',
      })
      .then((res) => res.data),
};
