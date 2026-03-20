import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../components/common/Modal';
import { getErrorMessage } from '../utils/errors';
import { useAccountsQuery } from '../hooks/useAccounts';
import { useCategoriesQuery } from '../hooks/useCategories';
import { useDeleteTransaction, useTransactions, useUpdateTransaction } from '../hooks/useTransactions';
import type { TransactionFormValues, TransactionListFilter, TransactionDto } from '../types/transaction';
import { useNavigate } from 'react-router-dom';
import { stripCurrencySuffix } from '../utils/format';
import './TransactionsPage.css';

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
    if (values.type === 'TRANSFER') {
      if (!values.transferAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['transferAccountId'],
          message: 'Destination account is required for transfers',
        });
      }
      if (values.transferAccountId && values.transferAccountId === values.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['transferAccountId'],
          message: 'Destination must differ from source',
        });
      }
    } else if (!values.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Category is required for income or expense',
      });
    }
  });

type FilterState = {
  search: string;
  type: '' | 'INCOME' | 'EXPENSE' | 'TRANSFER';
  accountId: string;
  categoryId: string;
  fromDate: string;
  toDate: string;
  minAmount: string;
  maxAmount: string;
  page: number;
  size: number;
};

type Feedback = { message: string; intent: 'success' | 'error' };

const initialFilterState: FilterState = {
  search: '',
  type: '',
  accountId: '',
  categoryId: '',
  fromDate: '',
  toDate: '',
  minAmount: '',
  maxAmount: '',
  page: 0,
  size: 12,
};

const formatDatetimeLocal = (value?: string) => {
  if (!value) return '';
  return value.slice(0, 16);
};

const sanitizeTags = (value?: string) =>
  value
    ? value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : undefined;

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function TransactionsPage() {
  const [filterState, setFilterState] = useState(initialFilterState);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null);
  const navigate = useNavigate();

  const { data: accounts } = useAccountsQuery();
  const { data: categories } = useCategoriesQuery(false);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const filterPayload = useMemo<TransactionListFilter>(() => ({
    page: filterState.page,
    size: filterState.size,
    search: filterState.search || undefined,
    type: filterState.type || undefined,
    accountId: filterState.accountId ? Number(filterState.accountId) : undefined,
    categoryId: filterState.categoryId ? Number(filterState.categoryId) : undefined,
    fromDate: filterState.fromDate ? new Date(filterState.fromDate).toISOString() : undefined,
    toDate: filterState.toDate ? new Date(`${filterState.toDate}T23:59:59.999`).toISOString() : undefined,
    minAmount: filterState.minAmount ? Number(filterState.minAmount) : undefined,
    maxAmount: filterState.maxAmount ? Number(filterState.maxAmount) : undefined,
  }), [filterState]);

  const { data, isLoading, isError, error } = useTransactions(filterPayload);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / filterState.size));

  useEffect(() => {
    if (!data) return;
    const boundedPage = Math.min(filterState.page, Math.max(totalPages - 1, 0));
    if (boundedPage !== filterState.page) {
      setFilterState((prev) => ({ ...prev, page: boundedPage }));
    }
  }, [data, filterState.page, filterState.size, totalPages]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const accountMap = useMemo(() => {
    if (!accounts) return {} as Record<number, { name: string; currency: string }>;
    return accounts.reduce<Record<number, { name: string; currency: string }>>((acc, account) => {
      acc[account.id] = { name: account.name, currency: account.currency };
      return acc;
    }, {} as Record<number, { name: string; currency: string }>);
  }, [accounts]);

  const categoryMap = useMemo(() => {
    if (!categories) return {} as Record<number, string>;
    return categories.reduce<Record<number, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {} as Record<number, string>);
  }, [categories]);

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isUpdating },
    watch: watchEdit,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'EXPENSE',
      accountId: 0,
      categoryId: undefined,
      transferAccountId: undefined,
      merchant: '',
      paymentMethod: '',
      tags: '',
      transactionDate: new Date().toISOString().slice(0, 16),
      recurringTransactionId: undefined,
    },
  });

  const editWatchType = watchEdit('type');

  useEffect(() => {
    if (!isEditOpen) {
      setEditingTransaction(null);
      resetEdit();
    }
  }, [isEditOpen, resetEdit]);

  useEffect(() => {
    if (!editingTransaction) return;
    resetEdit({
      accountId: editingTransaction.accountId,
      amount: editingTransaction.amount,
      description: editingTransaction.description,
      type: editingTransaction.type,
      categoryId: editingTransaction.categoryId,
      transferAccountId: editingTransaction.transferAccountId ?? undefined,
      merchant: editingTransaction.merchant ?? '',
      paymentMethod: editingTransaction.paymentMethod ?? '',
      tags: editingTransaction.tags.join(', '),
      transactionDate: formatDatetimeLocal(editingTransaction.transactionDate),
      recurringTransactionId: editingTransaction.recurringTransactionId ?? undefined,
    });
  }, [editingTransaction, resetEdit]);

  const handleFilterChange = (key: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...key, page: 0 }));
  };

  const onUpdate = handleEditSubmit(async (values) => {
    if (!editingTransaction) return;
    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        payload: {
          ...values,
          tags: sanitizeTags(values.tags),
          transactionDate: new Date(values.transactionDate).toISOString(),
        },
      });
      setFeedback({ message: 'Transaction updated', intent: 'success' });
      setEditOpen(false);
    } catch (apiError) {
      setFeedback({ message: getErrorMessage(apiError, 'Unable to update transaction'), intent: 'error' });
    }
  });

  const onDelete = async (transaction: TransactionDto) => {
    if (!window.confirm('Remove this transaction?')) {
      return;
    }
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      setFeedback({ message: 'Transaction deleted', intent: 'success' });
    } catch (apiError) {
      setFeedback({ message: getErrorMessage(apiError, 'Unable to delete transaction'), intent: 'error' });
    }
  };

  const transactions = data?.items ?? [];

  return (
    <section className="page-panel transactions-page">
      <header className="page-panel-header">
        <div>
          <h2>Transactions</h2>
          <p className="form-help">Track income, expenses, and transfers with filters.</p>
        </div>
        <button type="button" onClick={() => navigate('/transactions/new')}>
          + Add Transaction
        </button>
      </header>

      <div className="filter-row">
        <input
          type="text"
          placeholder="Search merchant or description"
          value={filterState.search}
          onChange={(event) => handleFilterChange({ search: event.target.value })}
        />
        <select value={filterState.type} onChange={(event) => handleFilterChange({ type: event.target.value as FilterState['type'] })}>
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <select value={filterState.accountId} onChange={(event) => handleFilterChange({ accountId: event.target.value })}>
          <option value="">All accounts</option>
          {accounts?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <select value={filterState.categoryId} onChange={(event) => handleFilterChange({ categoryId: event.target.value })}>
          <option value="">All categories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterState.fromDate}
          onChange={(event) => handleFilterChange({ fromDate: event.target.value })}
        />
        <input
          type="date"
          value={filterState.toDate}
          onChange={(event) => handleFilterChange({ toDate: event.target.value })}
        />
        <input
          type="number"
          min="0"
          placeholder="Min amount"
          value={filterState.minAmount}
          onChange={(event) => handleFilterChange({ minAmount: event.target.value })}
        />
        <input
          type="number"
          min="0"
          placeholder="Max amount"
          value={filterState.maxAmount}
          onChange={(event) => handleFilterChange({ maxAmount: event.target.value })}
        />
        <button type="button" onClick={() => setFilterState({ ...initialFilterState })}>
          Reset filters
        </button>
      </div>

      {feedback && <p className={`feedback ${feedback.intent === 'error' ? 'error' : ''}`}>{feedback.message}</p>}

      {isLoading ? (
        <p className="form-help">Loading transactions...</p>
      ) : isError ? (
        <p className="form-help">{getErrorMessage(error, 'Unable to load transactions')}</p>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet. Start by creating one.</p>
        </div>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const account = accountMap[transaction.accountId];
              const transferAccount = transaction.transferAccountId ? accountMap[transaction.transferAccountId] : undefined;
              const category = transaction.categoryId ? categoryMap[transaction.categoryId] : 'Uncategorized';
              const amount = formatAmount(Number(transaction.amount), account?.currency ?? 'INR');
              return (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                  <td>
                    <strong>{transaction.description}</strong>
                    <p className="form-help">{transaction.merchant ?? '-'}</p>
                    {transaction.tags.length > 0 && (
                      <div className="tag-row">
                        {transaction.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{category}</td>
                  <td>
                    {stripCurrencySuffix(account?.name)}
                    {transferAccount && (
                      <p className="form-help">To {stripCurrencySuffix(transferAccount.name)}</p>
                    )}
                  </td>
                  <td>{amount}</td>
                  <td>
                    <span className={`transaction-type ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => onDelete(transaction)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button
          type="button"
          onClick={() => setFilterState((prev) => ({ ...prev, page: Math.max(prev.page - 1, 0) }))}
          disabled={filterState.page === 0}
        >
          Previous
        </button>
        <span>
          Page {filterState.page + 1} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setFilterState((prev) => ({ ...prev, page: Math.min(prev.page + 1, totalPages - 1) }))}
          disabled={filterState.page + 1 >= totalPages}
        >
          Next
        </button>
      </div>

      <Modal open={isEditOpen} title="Edit transaction" onClose={() => setEditOpen(false)}>
        <form onSubmit={onUpdate} className="form-stack">
          <label>
            Description
            <input type="text" {...registerEdit('description')} />
            {editErrors.description && <span className="form-help">{editErrors.description.message}</span>}
          </label>
          <label>
            Amount
            <input type="number" step="0.01" {...registerEdit('amount', { valueAsNumber: true })} />
            {editErrors.amount && <span className="form-help">{editErrors.amount.message}</span>}
          </label>
          <label>
            Type
            <select {...registerEdit('type')}>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </label>
          <label>
            From account
            <select {...registerEdit('accountId', { valueAsNumber: true })}>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
          </label>
          {(editWatchType === 'INCOME' || editWatchType === 'EXPENSE') && (
            <label>
              Category
              <select
                {...registerEdit('categoryId', {
                  setValueAs: (value) => (value ? Number(value) : undefined),
                })}
              >
                <option value="">Select category</option>
                {categories
                  ?.filter((category) =>
                    editWatchType === 'INCOME' ? category.type === 'INCOME' : category.type === 'EXPENSE'
                  )
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {editErrors.categoryId && <span className="form-help">{editErrors.categoryId.message}</span>}
            </label>
          )}
          {editWatchType === 'TRANSFER' && (
            <label>
              To account
              <select
                {...registerEdit('transferAccountId', {
                  setValueAs: (value) => (value ? Number(value) : undefined),
                })}
              >
                <option value="">Select destination</option>
                {accounts
                  ?.filter((account) => account.id !== Number(watchEdit('accountId')))
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </option>
                  ))}
              </select>
              {editErrors.transferAccountId && <span className="form-help">{editErrors.transferAccountId.message}</span>}
            </label>
          )}
          <label>
            Merchant (optional)
            <input type="text" {...registerEdit('merchant')} />
          </label>
          <label>
            Payment method
            <input type="text" {...registerEdit('paymentMethod')} />
          </label>
          <label>
            Tags (comma separated)
            <input type="text" {...registerEdit('tags')} />
          </label>
          <label>
            Date and time
            <input type="datetime-local" {...registerEdit('transactionDate')} />
            {editErrors.transactionDate && <span className="form-help">{editErrors.transactionDate.message}</span>}
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button disabled={isUpdating} type="submit">
              {isUpdating ? 'Saving...' : 'Save changes'}
          </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
