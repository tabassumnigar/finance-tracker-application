import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoalStore } from '../store/goalStore';
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useContributeGoal,
  useWithdrawGoal,
  useDeleteGoal,
} from '../hooks/useGoals';
import { useAccountsQuery } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/format';
import type {
  GoalContributionRequest,
  GoalRequest,
  GoalWithdrawRequest,
} from '../types/goal';
import './GoalsPage.css';

const goalSchema = z.object({
  name: z.string().min(1, 'Please give your goal a name'),
  targetAmount: z.number().gt(0, 'Target amount must be greater than zero'),
  targetDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Select a valid date'),
  linkedAccountId: z.number().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const contributionSchema = z.object({
  amount: z.number().gt(0, 'Contribution must be greater than zero'),
  sourceAccountId: z.number().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().gt(0, 'Withdraw must be greater than zero'),
  targetAccountId: z.number().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;
type ContributionFormValues = z.infer<typeof contributionSchema>;
type WithdrawFormValues = z.infer<typeof withdrawSchema>;

const statusBadgeColor: Record<string, string> = {
  IN_PROGRESS: '#38bdf8',
  COMPLETED: '#22c55e',
  PAUSED: '#facc15',
};

type ToastState = { type: 'success' | 'error'; message: string };

const normalizeOptionalId = (value?: number) =>
  value !== undefined && !Number.isNaN(value) ? value : undefined;

export default function GoalsPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const { modalOpen, modalType, selectedGoal, openModal, closeModal } = useGoalStore();
  const goalsQuery = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const contributeGoal = useContributeGoal();
  const withdrawGoal = useWithdrawGoal();
  const deleteGoal = useDeleteGoal();
  const accountsQuery = useAccountsQuery();

  const { register, handleSubmit, reset, formState } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      targetDate: '',
      linkedAccountId: undefined,
      icon: '',
      color: '',
    },
  });

  const {
    register: registerContribution,
    handleSubmit: handleSubmitContribution,
    reset: resetContribution,
    formState: contributionState,
  } = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: 0, sourceAccountId: undefined },
  });

  const {
    register: registerWithdraw,
    handleSubmit: handleSubmitWithdraw,
    reset: resetWithdraw,
    formState: withdrawState,
  } = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: 0, targetAccountId: undefined },
  });

  useEffect(() => {
    if (!modalOpen) {
      reset({
        name: '',
        targetAmount: 0,
        targetDate: '',
        linkedAccountId: undefined,
        icon: '',
        color: '',
      });
      resetContribution({ amount: 0, sourceAccountId: undefined });
      resetWithdraw({ amount: 0, targetAccountId: undefined });
      return;
    }

    if (modalType === 'edit' && selectedGoal) {
      reset({
        name: selectedGoal.name,
        targetAmount: selectedGoal.targetAmount,
        targetDate: selectedGoal.targetDate.slice(0, 10),
        linkedAccountId: selectedGoal.linkedAccountId,
        icon: selectedGoal.icon ?? '',
        color: selectedGoal.color ?? '#1170b8',
      });
    }
  }, [modalOpen, modalType, selectedGoal, reset, resetContribution, resetWithdraw]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const goals = goalsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const completed = goals.filter((goal) => goal.status === 'COMPLETED').length;

    return { totalTarget, totalSaved, completed };
  }, [goals]);

  const handleToast = (state: ToastState) => setToast(state);

  const handleGoalSubmit = (values: GoalFormValues) => {
    const payload: GoalRequest = {
      name: values.name,
      targetAmount: values.targetAmount,
      targetDate: new Date(values.targetDate).toISOString(),
      linkedAccountId: normalizeOptionalId(values.linkedAccountId),
      icon: values.icon || undefined,
      color: values.color || undefined,
    };

    if (modalType === 'edit' && selectedGoal) {
      updateGoal.mutate(
        { id: selectedGoal.id, payload },
        {
          onSuccess: () => {
            handleToast({ type: 'success', message: 'Goal updated' });
            closeModal();
          },
          onError: (error) =>
            handleToast({
              type: 'error',
              message: error instanceof Error ? error.message : 'Unable to update goal',
            }),
        }
      );
    } else {
      createGoal.mutate(payload, {
        onSuccess: () => {
          handleToast({ type: 'success', message: 'Goal created' });
          closeModal();
        },
        onError: (error) =>
          handleToast({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to create goal',
          }),
      });
    }
  };

  const handleContribution = (values: ContributionFormValues) => {
    if (!selectedGoal) return;
    const payload: GoalContributionRequest = {
      amount: values.amount,
      sourceAccountId: normalizeOptionalId(values.sourceAccountId),
    };

    contributeGoal.mutate(
      { id: selectedGoal.id, payload },
      {
        onSuccess: () => {
          handleToast({ type: 'success', message: 'Contribution added' });
          closeModal();
        },
        onError: (error) =>
          handleToast({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to add contribution',
          }),
      }
    );
  };

  const handleWithdraw = (values: WithdrawFormValues) => {
    if (!selectedGoal) return;
    const payload: GoalWithdrawRequest = {
      amount: values.amount,
      targetAccountId: normalizeOptionalId(values.targetAccountId),
    };

    withdrawGoal.mutate(
      { id: selectedGoal.id, payload },
      {
        onSuccess: () => {
          handleToast({ type: 'success', message: 'Withdraw processed' });
          closeModal();
        },
        onError: (error) =>
          handleToast({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to withdraw',
          }),
      }
    );
  };

  const handleDeleteGoal = (goalId: number, goalName: string) => {
    if (!window.confirm(`Delete goal "${goalName}"? This cannot be undone.`)) {
      return;
    }

    deleteGoal.mutate(goalId, {
      onSuccess: () => handleToast({ type: 'success', message: 'Goal deleted' }),
      onError: (error) =>
        handleToast({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unable to delete goal',
        }),
    });
  };

  const renderStatusBadge = (status: string) => (
    <span
      className="status-badge"
      style={{ backgroundColor: statusBadgeColor[status] ?? '#94a3b8' }}
    >
      {status.replace('_', ' ')}
    </span>
  );

  return (
    <section className="page-panel goals-page">
      <div className="goals-hero">
        <div>
          <p className="goals-eyebrow">Savings planner</p>
          <h1>Goals</h1>
          <p className="goals-subtitle">
            Create savings goals, contribute funds, and track how close each target is to
            completion.
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={() => openModal('create')}>
          Create goal
        </button>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}

      <div className="goal-stats">
        <div className="goal-stat-card">
          <span>Total target</span>
          <strong>{formatCurrency(summary.totalTarget)}</strong>
        </div>
        <div className="goal-stat-card">
          <span>Total saved</span>
          <strong>{formatCurrency(summary.totalSaved)}</strong>
        </div>
        <div className="goal-stat-card">
          <span>Completed goals</span>
          <strong>{summary.completed}</strong>
        </div>
      </div>

      {goalsQuery.isError && (
        <div className="feedback error">
          {(goalsQuery.error as Error)?.message ?? 'Unable to load goals'}
        </div>
      )}

      {goalsQuery.isLoading && <div className="loading-pill">Loading goals...</div>}

      {!goalsQuery.isLoading && goals.length === 0 && (
        <div className="empty-state">
          <p>No goals yet. Set your first savings target to get started.</p>
          <button type="button" className="primary-btn" onClick={() => openModal('create')}>
            Add goal
          </button>
        </div>
      )}

      {goals.length > 0 && (
        <div className="goal-grid">
          {goals.map((goal) => (
            <article key={goal.id} className="goal-card">
              <header className="goal-card-header">
                <div className="goal-title-block">
                  <div className="goal-title-row">
                    <h3>{goal.name}</h3>
                    {renderStatusBadge(goal.status)}
                  </div>
                  <p className="goal-due-date">
                    Due {new Date(goal.targetDate).toLocaleDateString()} -{' '}
                    {goal.linkedAccountName ?? 'No linked account'}
                  </p>
                </div>

                <div className="goal-card-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => openModal('contribute', goal)}
                  >
                    Contribute
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => openModal('withdraw', goal)}
                  >
                    Withdraw
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => openModal('edit', goal)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleDeleteGoal(goal.id, goal.name)}
                  >
                    Delete
                  </button>
                </div>
              </header>

              <div className="goal-progress">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, goal.progressPercent)}%` }}
                  />
                </div>
                <div className="progress-meta">
                  <span>{goal.progressPercent.toFixed(1)}%</span>
                  <span>
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
              </div>

              <div className="goal-footer">
                <span className="muted-text">Saved so far: {formatCurrency(goal.currentAmount)}</span>
                <span className="muted-text">
                  Remaining: {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal goal-modal">
            <header className="modal-header">
              <div>
                <h3>
                  {modalType === 'edit'
                    ? 'Edit goal'
                    : modalType === 'contribute'
                    ? 'Add contribution'
                    : modalType === 'withdraw'
                    ? 'Withdraw from goal'
                    : 'Set new goal'}
                </h3>
                <p className="modal-copy">
                  {modalType === 'create' || modalType === 'edit'
                    ? 'Fill in the target, date, and optional linked account.'
                    : 'Choose an amount and optional account to move funds.'}
                </p>
              </div>
              <button type="button" className="ghost-btn" onClick={closeModal}>
                Close
              </button>
            </header>

            {modalType === 'contribute' && selectedGoal && (
              <form onSubmit={handleSubmitContribution(handleContribution)} className="goal-form">
                <label className="field">
                  <span>Amount</span>
                  <input
                    {...registerContribution('amount', { valueAsNumber: true })}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Example: 2000"
                  />
                  {contributionState.errors.amount && (
                    <small>{contributionState.errors.amount.message}</small>
                  )}
                </label>

                <label className="field">
                  <span>Source account</span>
                  <select
                    {...registerContribution('sourceAccountId', {
                      setValueAs: (value) => (value ? Number(value) : undefined),
                    })}
                  >
                    <option value="">Choose account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="modal-actions">
                  <button type="button" className="ghost-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Add contribution
                  </button>
                </div>
              </form>
            )}

            {modalType === 'withdraw' && selectedGoal && (
              <form onSubmit={handleSubmitWithdraw(handleWithdraw)} className="goal-form">
                <label className="field">
                  <span>Amount</span>
                  <input
                    {...registerWithdraw('amount', { valueAsNumber: true })}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Example: 1000"
                  />
                  {withdrawState.errors.amount && <small>{withdrawState.errors.amount.message}</small>}
                </label>

                <label className="field">
                  <span>Target account</span>
                  <select
                    {...registerWithdraw('targetAccountId', {
                      setValueAs: (value) => (value ? Number(value) : undefined),
                    })}
                  >
                    <option value="">Goal linked account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="modal-actions">
                  <button type="button" className="ghost-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Withdraw
                  </button>
                </div>
              </form>
            )}

            {(modalType === 'create' || modalType === 'edit') && (
              <form onSubmit={handleSubmit(handleGoalSubmit)} className="goal-form">
                <label className="field field-span-2">
                  <span>Name</span>
                  <input {...register('name')} placeholder="Example: Emergency Fund" />
                  {formState.errors.name && <small>{formState.errors.name.message}</small>}
                </label>

                <label className="field">
                  <span>Target amount</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Example: 50000"
                    {...register('targetAmount', { valueAsNumber: true })}
                  />
                  {formState.errors.targetAmount && (
                    <small>{formState.errors.targetAmount.message}</small>
                  )}
                </label>

                <label className="field">
                  <span>Target date</span>
                  <input type="date" {...register('targetDate')} />
                  {formState.errors.targetDate && <small>{formState.errors.targetDate.message}</small>}
                </label>

                <label className="field field-span-2">
                  <span>Linked account</span>
                  <select
                    {...register('linkedAccountId', {
                      setValueAs: (value) => (value ? Number(value) : undefined),
                    })}
                  >
                    <option value="">Unlinked</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Icon</span>
                  <input {...register('icon')} placeholder="Optional short icon" />
                </label>

                <label className="field">
                  <span>Accent color</span>
                  <input {...register('color')} type="color" />
                </label>

                <div className="modal-actions field-span-2">
                  <button type="button" className="ghost-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    {modalType === 'edit' ? 'Update goal' : 'Create goal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
