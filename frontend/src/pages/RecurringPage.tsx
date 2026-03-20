import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecurringStore } from '../store/recurringStore';
import { useRecurring, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, useToggleRecurring } from '../hooks/useRecurring';
import { useCategoriesQuery } from '../hooks/useCategories';
import { useAccountsQuery } from '../hooks/useAccounts';
import { formatCurrency, stripCurrencySuffix } from '../utils/format';
import type { RecurringItem, RecurringRequest } from '../types/recurring';
import './RecurringPage.css';

const recurringSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.number().gt(0, 'Amount must be greater than zero'),
    categoryId: z.number().positive().optional(),
    accountId: z.number().positive({ message: 'Select an account' }),
    transferAccountId: z.number().positive().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.string().refine((value) => Boolean(Date.parse(value)), 'Start date is required'),
    endDate: z.string().optional(),
    autoCreateTransaction: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.endDate) {
      return;
    }
    if (new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date cannot be before start date',
      });
    }
  });

type RecurringFormValues = z.infer<typeof recurringSchema>;

type Toast = {
  type: 'success' | 'error';
  message: string;
};

const frequencyLabels: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

export default function RecurringPage() {
  const [toast, setToast] = useState<Toast | null>(null);
  const { modalOpen, modalType, selectedRecurring, openModal, closeModal } = useRecurringStore();
  const recurringQuery = useRecurring();
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();
  const deleteRecurring = useDeleteRecurring();
  const toggleRecurring = useToggleRecurring();

  const { register, handleSubmit, reset, formState, watch } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      title: '',
      type: 'EXPENSE',
      amount: 0,
      categoryId: undefined,
      accountId: undefined,
      transferAccountId: undefined,
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: undefined,
      autoCreateTransaction: true,
      active: true,
    },
  });

  const categories = useCategoriesQuery().data ?? [];
  const accounts = useAccountsQuery().data ?? [];
  const recurringType = watch('type');

  useEffect(() => {
    if (!modalOpen) {
      reset({
        title: '',
        type: 'EXPENSE',
        amount: 0,
        categoryId: undefined,
        accountId: undefined,
        transferAccountId: undefined,
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: undefined,
        autoCreateTransaction: true,
        active: true,
      });
      return;
    }

    if (modalType === 'edit' && selectedRecurring) {
      reset({
        title: selectedRecurring.title,
        type: selectedRecurring.type,
        amount: selectedRecurring.amount,
        categoryId: selectedRecurring.categoryId ?? undefined,
        accountId: selectedRecurring.accountId,
        transferAccountId: selectedRecurring.transferAccountId ?? undefined,
        frequency: selectedRecurring.frequency,
        startDate: selectedRecurring.startDate.slice(0, 10),
        endDate: selectedRecurring.endDate ? selectedRecurring.endDate.slice(0, 10) : undefined,
        autoCreateTransaction: selectedRecurring.autoCreateTransaction,
        active: selectedRecurring.active,
      });
    }
  }, [modalOpen, modalType, selectedRecurring, reset]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const recurringItems = recurringQuery.data ?? [];
  const recurringEmpty = !recurringQuery.isLoading && recurringItems.length === 0;

  const stats = useMemo(() => {
    const active = recurringItems.filter((item) => item.active).length;
    const paused = recurringItems.filter((item) => !item.active).length;
    const autoCreate = recurringItems.filter((item) => item.autoCreateTransaction).length;
    return { active, paused, autoCreate };
  }, [recurringItems]);

  const handleToast = (message: string, type: Toast['type'] = 'success') =>
    setToast({ message, type });

  const onSubmit = (values: RecurringFormValues) => {
    const payload: RecurringRequest = {
      title: values.title,
      type: values.type,
      amount: values.amount,
      categoryId: values.type === 'TRANSFER' ? undefined : values.categoryId,
      accountId: values.accountId,
      transferAccountId: values.type === 'TRANSFER' ? values.transferAccountId : undefined,
      frequency: values.frequency,
      startDate: new Date(values.startDate).toISOString(),
      endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      autoCreateTransaction: values.autoCreateTransaction,
      active: values.active,
    };

    const handlers = {
      onSuccess: () => {
        handleToast(modalType === 'edit' ? 'Recurring updated' : 'Recurring created');
        closeModal();
      },
      onError: (error: unknown) =>
        handleToast((error as Error)?.message ?? 'Unable to save recurrence', 'error'),
    };

    if (modalType === 'edit' && selectedRecurring) {
      updateRecurring.mutate({ id: selectedRecurring.id, payload }, handlers);
    } else {
      createRecurring.mutate(payload, handlers);
    }
  };

  const handleDelete = (item: RecurringItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }
    deleteRecurring.mutate(item.id, {
      onSuccess: () => handleToast('Recurring deleted'),
      onError: (error) => handleToast((error as Error)?.message ?? 'Unable to delete', 'error'),
    });
  };

  const handleToggle = (item: RecurringItem) => {
    toggleRecurring.mutate(item.id, {
      onSuccess: () => handleToast(item.active ? 'Recurrence paused' : 'Recurrence resumed'),
      onError: (error) => handleToast((error as Error)?.message ?? 'Unable to update status', 'error'),
    });
  };

  return (
    <section className="page-panel recurring-page">
      <div className="recurring-hero">
        <div>
          <p className="recurring-eyebrow">Automations</p>
          <h1>Recurring transactions</h1>
          <p className="recurring-subtitle">
            Manage subscriptions, bills, and repeated income with a cleaner schedule view and form.
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={() => openModal('create')}>
          Add recurrence
        </button>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div>
      )}

      <div className="recurring-stats">
        <div className="recurring-stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="recurring-stat-card">
          <span>Paused</span>
          <strong>{stats.paused}</strong>
        </div>
        <div className="recurring-stat-card">
          <span>Auto-create on</span>
          <strong>{stats.autoCreate}</strong>
        </div>
      </div>

      {recurringQuery.isError && (
        <div className="feedback error">
          {recurringQuery.error instanceof Error ? recurringQuery.error.message : 'Unable to load recurring items'}
        </div>
      )}

      {recurringQuery.isLoading && <div className="loading-pill">Loading recurring items...</div>}

      {recurringEmpty && (
        <div className="empty-state recurring-empty">
          <div>
            <h3>No recurring transactions yet</h3>
            <p>Start with subscriptions, loan payments, or salary inflows that repeat on a schedule.</p>
          </div>
          <button type="button" className="primary-btn" onClick={() => openModal('create')}>
            Start automating bills
          </button>
        </div>
      )}

      {recurringItems.length > 0 && (
        <div className="recurring-grid">
          {recurringItems.map((item) => (
            <article key={item.id} className="recurring-card">
              <header className="recurring-card-header">
                <div>
                  <div className="recurring-title-row">
                    <h3>{item.title}</h3>
                    <span className={`status-badge ${item.active ? 'active' : 'paused'}`}>
                      {item.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="recurring-subline">
                    {frequencyLabels[item.frequency]} - Next run {new Date(item.nextRun).toLocaleDateString()}
                  </p>
                </div>
                <strong className="recurring-amount">{formatCurrency(item.amount)}</strong>
              </header>

              <div className="recurring-details-grid">
                <div className="detail-chip">
                  <span>Type</span>
                  <strong>{item.type}</strong>
                </div>
                <div className="detail-chip">
                  <span>Account</span>
                  <strong>{stripCurrencySuffix(item.accountName)}</strong>
                </div>
                {item.transferAccountName && (
                  <div className="detail-chip">
                    <span>Transfer to</span>
                    <strong>{stripCurrencySuffix(item.transferAccountName)}</strong>
                  </div>
                )}
                {item.categoryName && (
                  <div className="detail-chip">
                    <span>Category</span>
                    <strong>{item.categoryName}</strong>
                  </div>
                )}
                <div className="detail-chip">
                  <span>Auto-create</span>
                  <strong>{item.autoCreateTransaction ? 'Yes' : 'No'}</strong>
                </div>
              </div>

              <footer className="recurring-actions">
                <button type="button" className="ghost-btn" onClick={() => openModal('edit', item)}>
                  Edit
                </button>
                <button type="button" className="ghost-btn" onClick={() => handleDelete(item)}>
                  Delete
                </button>
                <button type="button" className="ghost-btn" onClick={() => handleToggle(item)}>
                  {item.active ? 'Pause' : 'Resume'}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal recurring-modal">
            <header className="modal-header">
              <div>
                <h3>{modalType === 'edit' ? 'Edit recurring transaction' : 'Create recurring transaction'}</h3>
                <p className="modal-copy">
                  Set the schedule, source account, and whether this should auto-create transactions.
                </p>
              </div>
              <button type="button" className="ghost-btn" onClick={closeModal}>
                Close
              </button>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="recurring-form">
              <label className="field field-span-2">
                <span>Title</span>
                <input {...register('title')} placeholder="Example: Netflix subscription" />
                {formState.errors.title && <small>{formState.errors.title.message}</small>}
              </label>

              <label className="field">
                <span>Amount</span>
                <input type="number" step="0.01" min="0.01" placeholder="Example: 499" {...register('amount', { valueAsNumber: true })} />
                {formState.errors.amount && <small>{formState.errors.amount.message}</small>}
              </label>

              <label className="field">
                <span>Type</span>
                <select {...register('type')}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </label>

              <label className="field">
                <span>Account</span>
                <select
                  {...register('accountId', {
                    setValueAs: (value) => (value ? Number(value) : undefined),
                  })}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {formState.errors.accountId && <small>{formState.errors.accountId.message}</small>}
              </label>

              {recurringType !== 'TRANSFER' ? (
                <label className="field">
                  <span>Category</span>
                  <select
                    {...register('categoryId', {
                      setValueAs: (value) => (value ? Number(value) : undefined),
                    })}
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter((category) => category.type === recurringType)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <label className="field">
                  <span>Transfer account</span>
                  <select
                    {...register('transferAccountId', {
                      setValueAs: (value) => (value ? Number(value) : undefined),
                    })}
                  >
                    <option value="">Select target account</option>
                    {accounts
                      .filter((account) => account.id !== Number(watch('accountId')))
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}

              <label className="field">
                <span>Frequency</span>
                <select {...register('frequency')}>
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Start date</span>
                <input type="date" {...register('startDate')} />
              </label>

              <label className="field">
                <span>End date</span>
                <input type="date" {...register('endDate')} />
                {formState.errors.endDate && <small>{formState.errors.endDate.message}</small>}
              </label>

              <div className="field field-span-2 recurring-check-grid">
                <label className="checkbox-label">
                  <input type="checkbox" {...register('autoCreateTransaction')} />
                  Auto-create transaction
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" {...register('active')} />
                  Active schedule
                </label>
              </div>

              <div className="modal-actions field-span-2">
                <button type="button" className="ghost-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn">
                  {modalType === 'edit' ? 'Save changes' : 'Create recurrence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
