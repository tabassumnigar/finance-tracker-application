import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './BudgetsPage.css';
import { useBudgetStore } from '../store/budgetStore';
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useDuplicateBudgets,
} from '../hooks/useBudgets';
import { useCategoriesQuery } from '../hooks/useCategories';
import type { BudgetRequest, BudgetResponse, BudgetAlertLevel } from '../types/budget';
import { formatCurrency } from '../utils/format';

import './BudgetsPage.css';

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

const budgetSchema = z.object({
  categoryId: z.number().int().positive({ message: 'Select a category' }),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  amount: z.number().positive({ message: 'Amount must be greater than zero' }),
  alertThresholdPercent: z.number().int().min(0).max(200).optional(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const levelMeta: Record<
  BudgetAlertLevel,
  { label: string; className: string }
> = {
  normal: { label: 'On Track', className: 'level-normal' },
  warning: { label: 'Near Limit', className: 'level-warning' },
  alert: { label: 'Exceeded', className: 'level-alert' },
  critical: { label: 'Critical', className: 'level-critical' },
};

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getProgressState(percent: number) {
  if (percent >= 100) return 'danger';
  if (percent >= 80) return 'warning';
  return 'safe';
}

export default function BudgetsPage() {
  const now = new Date();
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [toast, setToast] = useState<ToastState | null>(null);

  const previousMonthDate = useMemo(
    () => new Date(filters.year, filters.month - 2, 1),
    [filters.month, filters.year]
  );

  const { modalOpen, modalType, selectedBudget, openModal, closeModal } = useBudgetStore();

  const budgetsQuery = useBudgets(filters.month, filters.year);
  const previousMonthBudgetsQuery = useBudgets(previousMonthDate.getMonth() + 1, previousMonthDate.getFullYear());
  const categoriesQuery = useCategoriesQuery(false);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const duplicateBudgets = useDuplicateBudgets();

  const { register, handleSubmit, reset, formState } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: undefined,
      month: filters.month,
      year: filters.year,
      amount: 0,
      alertThresholdPercent: 80,
    },
  });

  useEffect(() => {
    if (!modalOpen) {
      reset({
        categoryId: undefined,
        month: filters.month,
        year: filters.year,
        amount: 0,
        alertThresholdPercent: 80,
      });
      return;
    }

    if (modalType === 'edit' && selectedBudget) {
      reset({
        categoryId: selectedBudget.categoryId,
        month: selectedBudget.month,
        year: selectedBudget.year,
        amount: selectedBudget.amount,
        alertThresholdPercent: selectedBudget.alertThresholdPercent,
      });
    } else {
      reset({
        categoryId: undefined,
        month: filters.month,
        year: filters.year,
        amount: 0,
        alertThresholdPercent: 80,
      });
    }
  }, [modalOpen, modalType, selectedBudget, filters.month, filters.year, reset]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const budgets = budgetsQuery.data ?? [];
  const previousMonthBudgets = previousMonthBudgetsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }).map((_, idx) => current - 2 + idx);
  }, []);

  const handleFormSubmit = (values: BudgetFormValues) => {
    const payload: BudgetRequest = {
      categoryId: values.categoryId,
      month: values.month,
      year: values.year,
      amount: values.amount,
      alertThresholdPercent: values.alertThresholdPercent,
    };

    const onSuccess = (message: string) => {
      setToast({ type: 'success', message });
      closeModal();
    };

    const onFailure = (error: unknown, fallback: string) => {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : fallback,
      });
    };

    if (modalType === 'edit' && selectedBudget) {
      updateBudget.mutate(
        { id: selectedBudget.id, payload },
        {
          onSuccess: () => onSuccess('Budget updated'),
          onError: (error) => onFailure(error, 'Unable to update budget'),
        }
      );
      return;
    }

    createBudget.mutate(payload, {
      onSuccess: () => onSuccess('Budget created'),
      onError: (error) => onFailure(error, 'Unable to create budget'),
    });
  };

  const handleDelete = (budget: BudgetResponse) => {
    const confirmed = window.confirm(`Delete budget for ${budget.categoryName}?`);
    if (!confirmed) return;

    deleteBudget.mutate(budget.id, {
      onSuccess: () => setToast({ type: 'success', message: 'Budget deleted' }),
      onError: (error) =>
        setToast({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unable to delete budget',
        }),
    });
  };

  const handleDuplicate = () => {
    duplicateBudgets.mutate(
      { month: filters.month, year: filters.year },
      {
        onSuccess: () =>
          setToast({ type: 'success', message: 'Budgets duplicated for the month' }),
        onError: (error) =>
          setToast({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to duplicate budgets',
          }),
      }
    );
  };

  const categoryOptions = categories
    .filter((category) => {
      const archived = (category as { archived?: boolean; isArchived?: boolean }).archived
        ?? (category as { archived?: boolean; isArchived?: boolean }).isArchived
        ?? false;
      return category.type === 'EXPENSE' && !archived;
    })
    .map((category) => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ));

  const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);
  const totalUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const canDuplicateLastMonth = previousMonthBudgets.length > 0;

  return (
    <section className="budgets-page">
      <div className="budgets-shell">
        <header className="budgets-hero">
          <div>
            <p className="budgets-eyebrow">Budget Planning</p>
            <h1>Budgets</h1>
            <p className="budgets-subtitle">
              Set monthly budgets for expense categories and track how much has been used.
            </p>
          </div>

          <div className="budgets-hero-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDuplicate}
              disabled={duplicateBudgets.status === 'pending' || previousMonthBudgetsQuery.isLoading || !canDuplicateLastMonth}
              title={
                canDuplicateLastMonth
                  ? 'Copy previous month budgets into the selected month'
                  : 'No previous month budgets available to duplicate'
              }
            >
              {duplicateBudgets.status === 'pending' ? 'Duplicating...' : 'Duplicate last month'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => openModal('create')}>
              Set Budget
            </button>
          </div>
        </header>

        {!previousMonthBudgetsQuery.isLoading && !canDuplicateLastMonth && (
          <div className="budget-helper-note">
            Duplicate last month is unavailable because there are no budgets in the previous month yet.
          </div>
        )}

        <div className="budget-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total Budget</span>
            <strong>{formatCurrency(totalBudget)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Spent</span>
            <strong>{formatCurrency(totalSpent)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Overall Usage</span>
            <strong>{totalUsage.toFixed(0)}%</strong>
          </div>
        </div>

        <div className="budget-toolbar">
          <div className="toolbar-group">
            <label htmlFor="month">Month</label>
            <select
              id="month"
              value={filters.month}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, month: Number(event.target.value) }))
              }
            >
              {months.map((label, index) => (
                <option key={index + 1} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-group">
            <label htmlFor="year">Year</label>
            <select
              id="year"
              value={filters.year}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, year: Number(event.target.value) }))
              }
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {toast && (
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.message}
          </div>
        )}

        {budgetsQuery.isError && (
          <div className="feedback error">
            {budgetsQuery.error instanceof Error ? budgetsQuery.error.message : 'Unable to load budgets'}
          </div>
        )}

        {budgetsQuery.isLoading && <div className="loading-pill">Loading budgets...</div>}

        {!budgetsQuery.isLoading && budgets.length === 0 && (
          <div className="empty-state">
            <p>No budgets set for this period yet.</p>
            <button type="button" className="btn btn-primary" onClick={() => openModal('create')}>
              Start budgeting
            </button>
          </div>
        )}

        {budgets.length > 0 && (
          <div className="budget-list-card">
            <div className="budget-list-header">
              <div>
                <h2>
                  {months[filters.month - 1]} {filters.year}
                </h2>
                <p>Track your category-wise monthly budgets</p>
              </div>
            </div>

            <div className="budget-list">
              {budgets.map((budget) => {
                const percent = clampProgress(budget.progressPercent);
                const rawPercent = Number.isFinite(budget.progressPercent)
                  ? budget.progressPercent
                  : 0;
                const progressState = getProgressState(rawPercent);
                const badge = levelMeta[budget.alertLevel];

                return (
                  <article key={budget.id} className="budget-row-card">
                    <div className="budget-row-main">
                      <div className="budget-row-top">
                        <div className="budget-row-title-wrap">
                          <h3>{budget.categoryName}</h3>
                          <span className={`status-pill ${badge.className}`}>{badge.label}</span>
                        </div>

                        <div className="budget-row-values">
                          <strong>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </strong>
                        </div>
                      </div>

                      <div className="budget-progress-block">
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${progressState}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="budget-progress-meta">
                          <span>{rawPercent.toFixed(0)}%</span>
                          <span>Threshold: {budget.alertThresholdPercent}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="budget-row-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openModal('edit', budget)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(budget)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="budget-modal">
            <header className="budget-modal-header">
              <div>
                <h3>{modalType === 'edit' ? 'Edit Budget' : 'Set Budget'}</h3>
                <p>Choose an expense category and monthly limit.</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>
                Close
              </button>
            </header>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="budget-form">
              <label className="field">
                <span>Category</span>
                <select
                  {...register('categoryId', {
                    setValueAs: (value) => (value ? Number(value) : undefined),
                  })}
                  disabled={categoriesQuery.isLoading}
                >
                  <option value="">Select category</option>
                  {categoryOptions}
                </select>
                {formState.errors.categoryId && (
                  <small>{formState.errors.categoryId.message}</small>
                )}
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Month</span>
                  <select {...register('month', { valueAsNumber: true })}>
                    {months.map((label, index) => (
                      <option key={index + 1} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Year</span>
                  <select {...register('year', { valueAsNumber: true })}>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Budget Amount</span>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                />
                {formState.errors.amount && <small>{formState.errors.amount.message}</small>}
              </label>

              <label className="field">
                <span>Alert Threshold (%)</span>
                <input
                  {...register('alertThresholdPercent', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                  type="number"
                  min="0"
                  max="200"
                />
                {formState.errors.alertThresholdPercent && (
                  <small>{formState.errors.alertThresholdPercent.message}</small>
                )}
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formState.isSubmitting}>
                  {formState.isSubmitting
                    ? 'Saving...'
                    : modalType === 'edit'
                    ? 'Save Changes'
                    : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
