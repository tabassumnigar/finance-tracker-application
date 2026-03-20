import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard';

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
    staleTime: 1000 * 60 * 2,
  });

export const useDashboardSpending = () =>
  useQuery({
    queryKey: ['dashboard', 'spending'],
    queryFn: dashboardApi.spendingByCategory,
  });

export const useDashboardTrend = () =>
  useQuery({
    queryKey: ['dashboard', 'trend'],
    queryFn: dashboardApi.incomeVsExpense,
  });

export const useDashboardRecentTransactions = () =>
  useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: dashboardApi.recentTransactions,
  });

export const useDashboardUpcomingRecurring = () =>
  useQuery({
    queryKey: ['dashboard', 'upcoming-recurring'],
    queryFn: dashboardApi.upcomingRecurring,
  });

export const useDashboardBudgetProgress = () =>
  useQuery({
    queryKey: ['dashboard', 'budget-progress'],
    queryFn: dashboardApi.budgetProgress,
  });

export const useDashboardGoalsSummary = () =>
  useQuery({
    queryKey: ['dashboard', 'goals-summary'],
    queryFn: dashboardApi.goalsSummary,
  });
