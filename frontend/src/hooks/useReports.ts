import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reports';
import type { AccountBalancePoint, CategorySpendReport, ReportTrendPoint, ReportsFilter } from '../types/report';

const buildKey = (type: string, filters: ReportsFilter) => ['reports', type, JSON.stringify(filters)];

export const useCategorySpendReport = (filters: ReportsFilter) =>
  useQuery<CategorySpendReport[]>({
    queryKey: buildKey('category-spend', filters),
    queryFn: () => reportsApi.categorySpend(filters),
  });

export const useIncomeVsExpenseReport = (filters: ReportsFilter) =>
  useQuery<ReportTrendPoint[]>({
    queryKey: buildKey('income-vs-expense', filters),
    queryFn: () => reportsApi.incomeVsExpense(filters),
  });

export const useAccountBalanceReport = (filters: ReportsFilter) =>
  useQuery<AccountBalancePoint[]>({
    queryKey: buildKey('account-balance-trend', filters),
    queryFn: () => reportsApi.accountBalanceTrend(filters),
  });
