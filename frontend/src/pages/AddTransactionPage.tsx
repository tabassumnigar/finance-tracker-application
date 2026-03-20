import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../utils/errors';
import { useAccountsQuery } from '../hooks/useAccounts';
import { useCategoriesQuery } from '../hooks/useCategories';
import { useCreateTransaction } from '../hooks/useTransactions';
import type { TransactionFormValues } from '../types/transaction';
import { stripCurrencySuffix } from '../utils/format';
import './AddTransactionPage.css';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Food', type: 'EXPENSE' },
  { id: 2, name: 'Rent', type: 'EXPENSE' },
  { id: 3, name: 'Utilities', type: 'EXPENSE' },
  { id: 4, name: 'Transport', type: 'EXPENSE' },
  { id: 5, name: 'Entertainment', type: 'EXPENSE' },
  { id: 6, name: 'Shopping', type: 'EXPENSE' },
  { id: 7, name: 'Health', type: 'EXPENSE' },
  { id: 8, name: 'Education', type: 'EXPENSE' },
  { id: 9, name: 'Travel', type: 'EXPENSE' },
  { id: 10, name: 'Subscriptions', type: 'EXPENSE' },
  { id: 11, name: 'Miscellaneous', type: 'EXPENSE' },

  { id: 12, name: 'Salary', type: 'INCOME' },
  { id: 13, name: 'Freelance', type: 'INCOME' },
  { id: 14, name: 'Bonus', type: 'INCOME' },
  { id: 15, name: 'Investment', type: 'INCOME' },
  { id: 16, name: 'Gift', type: 'INCOME' },
  { id: 17, name: 'Refund', type: 'INCOME' },
  { id: 18, name: 'Other', type: 'INCOME' },
] as const;

const transactionSchema = z
  .object({
    accountId: z.number().int().positive({ message: 'Select an account' }),
    amount: z.number().gt(0, { message: 'Amount must be more than zero' }),
    description: z.string().min(2, { message: 'Description is required' }),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    categoryId: z.number().int().positive().optional(),
    transferAccountId: z.number().int().positive().optional(),
    merchant: z.string().max(120).optional(),
    paymentMethod: z.string().max(80).optional(),
    tags: z.string().optional(),
    transactionDate: z.string().nonempty({ message: 'Date and time are required' }),
    recurringTransactionId: z.number().int().positive().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'TRANSFER' && !values.transferAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferAccountId'],
        message: 'Destination account is required for transfers',
      });
    }

    if (values.type !== 'TRANSFER' && !values.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Category is required for income or expense',
      });
    }
  });

const toLocalDatetimeInputValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const defaultValues: TransactionFormValues = {
  accountId: 0,
  amount: 0,
  description: '',
  type: 'EXPENSE',
  categoryId: undefined,
  transferAccountId: undefined,
  merchant: '',
  paymentMethod: '',
  tags: '',
  transactionDate: toLocalDatetimeInputValue(),
  recurringTransactionId: undefined,
};

const sanitizeTags = (value?: string) =>
  value
    ? value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : undefined;

type Feedback = {
  message: string;
  intent: 'success' | 'error';
};

export default function AddTransactionPage() {
  const cleanAccountName = (name?: string) => stripCurrencySuffix(name) || 'Account';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: apiCategories = [] } = useCategoriesQuery(false);
  const createTransaction = useCreateTransaction();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const type = watch('type');
  const accountId = watch('accountId');
  const hasAccounts = accounts.length > 0;

  useEffect(() => {
    const requestedType = searchParams.get('type');
    if (requestedType === 'INCOME' || requestedType === 'EXPENSE' || requestedType === 'TRANSFER') {
      setValue('type', requestedType);
    }
  }, [searchParams, setValue]);

  const categories = useMemo(() => {
    if (Array.isArray(apiCategories) && apiCategories.length > 0) {
      return apiCategories;
    }
    return DEFAULT_CATEGORIES;
  }, [apiCategories]);

  const filteredCategories = useMemo(() => {
    if (type === 'EXPENSE') {
      return categories.filter(
        (category) => String(category.type).toUpperCase() === 'EXPENSE'
      );
    }

    if (type === 'INCOME') {
      return categories.filter(
        (category) => String(category.type).toUpperCase() === 'INCOME'
      );
    }

    return [];
  }, [categories, type]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTransaction.mutateAsync({
        ...values,
        tags: sanitizeTags(values.tags),
        transactionDate: new Date(values.transactionDate).toISOString(),
      });

      setFeedback({ message: 'Transaction saved.', intent: 'success' });

      setTimeout(() => {
        reset(defaultValues);
        navigate('/transactions');
      }, 900);
    } catch (error) {
      setFeedback({
        message: getErrorMessage(error, 'Unable to save transaction'),
        intent: 'error',
      });
    }
  });

  return (
    <section className="page-panel add-transaction-page">
      <header className="page-panel-header">
        <div>
          <h2>Add transaction</h2>
          <p className="form-help">Required: account, amount, description, type, and date. Category is required for income or expense.</p>
        </div>
        <button
          type="button"
          className="ghost-btn icon-btn"
          onClick={() => navigate('/transactions')}
        >
          <span aria-hidden="true">✕</span>
          Cancel
        </button>
      </header>

      {!hasAccounts && (
        <p className="feedback error">Create at least one account before adding a transaction.</p>
      )}

      <form onSubmit={onSubmit} className="form-stack">
        <label>
          Account (required)
          <select {...register('accountId', { valueAsNumber: true })} disabled={!hasAccounts}>
            <option value={0}>Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {cleanAccountName(account.name)}
              </option>
            ))}
          </select>
          {errors.accountId && <span className="form-help">{errors.accountId.message}</span>}
        </label>

        <label>
          Amount (required)
          <input
            type="number"
            step="0.01"
            placeholder="Example: 250.00"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <span className="form-help">{errors.amount.message}</span>}
        </label>

        <label>
          Description (required)
          <input type="text" placeholder="Example: Grocery shopping" {...register('description')} />
          {errors.description && <span className="form-help">{errors.description.message}</span>}
        </label>

        <label>
          Type (required)
          <select
            {...register('type')}
            onChange={(e) => {
              const nextType = e.target.value as 'INCOME' | 'EXPENSE' | 'TRANSFER';
              setValue('type', nextType);
              setValue('categoryId', undefined);
              if (nextType !== 'TRANSFER') {
                setValue('transferAccountId', undefined);
              }
            }}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </label>

        {(type === 'EXPENSE' || type === 'INCOME') && (
          <label>
            Category (required)
            <select
              {...register('categoryId', {
                setValueAs: (value) => (value ? Number(value) : undefined),
              })}
            >
              <option value={0}>
                {type === 'EXPENSE' ? 'Select expense category' : 'Select income category'}
              </option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <span className="form-help">{errors.categoryId.message}</span>}
          </label>
        )}

        {type === 'TRANSFER' && (
          <label>
            Destination account (required)
            <select
              {...register('transferAccountId', {
                setValueAs: (value) => (value ? Number(value) : undefined),
              })}
            >
              <option value={0}>Select account</option>
              {accounts
                .filter((account) => account.id !== accountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
            {errors.transferAccountId && (
              <span className="form-help">{errors.transferAccountId.message}</span>
            )}
          </label>
        )}

        <label>
          Merchant (optional)
          <input type="text" placeholder="Example: DMart or Amazon" {...register('merchant')} />
        </label>

        <label>
          Payment method (optional)
          <input type="text" placeholder="Example: UPI, Cash, Credit Card" {...register('paymentMethod')} />
        </label>

        <label>
          Tags (comma separated)
          <input type="text" placeholder="Example: groceries, home, weekly" {...register('tags')} />
        </label>

        <label>
          Date and time (required)
          <input type="datetime-local" {...register('transactionDate')} />
          {errors.transactionDate && (
            <span className="form-help">{errors.transactionDate.message}</span>
          )}
        </label>

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={() => navigate('/transactions')}>
            Cancel
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={!hasAccounts || isSubmitting || createTransaction.status === 'pending'}
          >
            {isSubmitting || createTransaction.status === 'pending'
              ? 'Saving…'
              : 'Save transaction'}
          </button>
        </div>

        {feedback && (
          <p className={`feedback ${feedback.intent === 'error' ? 'error' : ''}`} role="status">
            {feedback.message}
          </p>
        )}
      </form>
    </section>
  );
}
