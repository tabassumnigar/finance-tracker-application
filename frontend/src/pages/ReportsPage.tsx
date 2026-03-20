import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { reportsApi } from '../services/reports';
import { useAccountsQuery } from '../hooks/useAccounts';
import { useCategoriesQuery } from '../hooks/useCategories';
import {
  useAccountBalanceReport,
  useCategorySpendReport,
  useIncomeVsExpenseReport,
} from '../hooks/useReports';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency } from '../utils/format';
import type { ReportsFilter } from '../types/report';
import './ReportsPage.css';

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

type TransactionTypeOption = '' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

const transactionTypes: { label: string; value: TransactionTypeOption }[] = [
  { label: 'All transactions', value: '' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
];

const toIsoDate = (value?: string, endOfDay = false) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.toISOString();
};

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default function ReportsPage() {
  const today = new Date();
  type ReportsFilterForm = {
    startDate?: string;
    endDate?: string;
    accountId: string;
    categoryId: string;
    transactionType: TransactionTypeOption;
  };

  const [filters, setFilters] = useState<ReportsFilterForm>({
    startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    accountId: '',
    categoryId: '',
    transactionType: '',
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const accountsQuery = useAccountsQuery();
  const categoriesQuery = useCategoriesQuery();

  const sanitizedFilters: ReportsFilter = useMemo(
    () => ({
      startDate: toIsoDate(filters.startDate),
      endDate: toIsoDate(filters.endDate, true),
      accountId: filters.accountId ? Number(filters.accountId) : undefined,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      transactionType: filters.transactionType || undefined,
    }),
    [filters]
  );

  const categorySpendQuery = useCategorySpendReport(sanitizedFilters);
  const incomeVsExpenseQuery = useIncomeVsExpenseReport(sanitizedFilters);
  const accountBalanceQuery = useAccountBalanceReport(sanitizedFilters);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const categorySpend = categorySpendQuery.data ?? [];
  const incomeTrend = incomeVsExpenseQuery.data ?? [];
  const balancePoints = accountBalanceQuery.data ?? [];

  const summarySpend = useMemo(
    () => categorySpend.reduce((sum, row) => sum + row.amount, 0),
    [categorySpend]
  );

  const totalBalanceTrend = useMemo(() => {
    const map = new Map<string, { date: string; label: string; balance: number }>();
    balancePoints.forEach((point) => {
      const key = point.date.split('T')[0];
      const previous = map.get(key);
      const aggregated = (previous?.balance ?? 0) + point.balance;
      map.set(key, {
        date: point.date,
        label: formatDateLabel(point.date),
        balance: aggregated,
      });
    });
    return Array.from(map.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(({ label, balance }) => ({ label, balance }));
  }, [balancePoints]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportsApi.exportCsv(sanitizedFilters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `finance-reports-${new Date().toISOString()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setToast({ type: 'success', message: 'Reports exported to CSV' });
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'Unable to export CSV') });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const reportWindow = window.open('', '_blank', 'width=1100,height=800');
      if (!reportWindow) {
        throw new Error('Allow popups in the browser to export PDF');
      }

      const categoryRows = categorySpend
        .map(
          (row) => `
            <tr>
              <td>${row.categoryName}</td>
              <td>${formatCurrency(row.amount)}</td>
              <td>${Math.round(row.percentage)}%</td>
            </tr>
          `
        )
        .join('');

      const trendRows = incomeTrend
        .map(
          (row) => `
            <tr>
              <td>${row.label}</td>
              <td>${formatCurrency(row.income)}</td>
              <td>${formatCurrency(row.expense)}</td>
            </tr>
          `
        )
        .join('');

      const balanceRows = totalBalanceTrend
        .map(
          (row) => `
            <tr>
              <td>${row.label}</td>
              <td>${formatCurrency(row.balance)}</td>
            </tr>
          `
        )
        .join('');

      reportWindow.document.write(`
        <html>
          <head>
            <title>Finance Reports</title>
            <style>
              body { font-family: Segoe UI, Arial, sans-serif; padding: 28px; color: #163047; }
              h1, h2 { margin-bottom: 8px; }
              p { color: #4b6477; }
              .summary { margin: 18px 0 24px; padding: 16px 18px; background: #f5fbff; border: 1px solid #d9e8f1; border-radius: 14px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0 28px; }
              th, td { border: 1px solid #d8e3ea; padding: 10px 12px; text-align: left; }
              th { background: #f3f8fb; }
              .muted { color: #6b7f90; font-size: 13px; }
            </style>
          </head>
          <body>
            <h1>Finance Reports</h1>
            <p class="muted">Generated on ${new Date().toLocaleString()}</p>
            <div class="summary">
              <strong>Filters:</strong>
              <div>Start: ${filters.startDate || 'Any'} | End: ${filters.endDate || 'Any'} | Type: ${filters.transactionType || 'All'}</div>
            </div>

            <h2>Category Spend</h2>
            <table>
              <thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead>
              <tbody>${categoryRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
            </table>

            <h2>Income vs Expense</h2>
            <table>
              <thead><tr><th>Period</th><th>Income</th><th>Expense</th></tr></thead>
              <tbody>${trendRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
            </table>

            <h2>Account Balance Trend</h2>
            <table>
              <thead><tr><th>Period</th><th>Balance</th></tr></thead>
              <tbody>${balanceRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
            </table>
          </body>
        </html>
      `);
      reportWindow.document.close();
      reportWindow.focus();
      reportWindow.print();
      setToast({ type: 'success', message: 'Print dialog opened. Choose Save as PDF to export.' });
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'Unable to export PDF') });
    } finally {
      setExportingPdf(false);
    }
  };

  const categoryError = getErrorMessage(categorySpendQuery.error, '');
  const trendError = getErrorMessage(incomeVsExpenseQuery.error, '');
  const balanceError = getErrorMessage(accountBalanceQuery.error, '');

  return (
    <section className="page-panel reports-page">
      <div className="page-panel-header">
        <div>
          <h2>Reports</h2>
          <p>
            Analyze spending, income, and account trends. Use filters to narrow the data and export
            results for sharing.
          </p>
        </div>
        <div className="reports-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? 'Opening PDF...' : 'Export PDF'}
          </button>
          <button type="button" className="primary-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="report-helper-note">
        PDF export uses the browser print dialog on the frontend. CSV export still comes directly
        from the backend.
      </div>

      <div className="report-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="account">Account</label>
            <select
              id="account"
              value={filters.accountId}
              onChange={(event) => setFilters((prev) => ({ ...prev, accountId: event.target.value }))}
            >
              <option value="">All accounts</option>
              {accountsQuery.data?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={filters.categoryId}
              onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">All categories</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="transactionType">Type</label>
            <select
              id="transactionType"
              value={filters.transactionType}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  transactionType: event.target.value as TransactionTypeOption,
                }))
              }
            >
              {transactionTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="report-grid">
        <article className="report-card">
          <div className="report-card-header">
            <div>
              <h3>Spending by Category</h3>
              <p>{formatCurrency(summarySpend)} total</p>
            </div>
          </div>
          <div className="report-card-body">
            {categorySpendQuery.isLoading ? (
              <p className="lead">Loading categories...</p>
            ) : categorySpendQuery.isError ? (
              <p className="lead error">{categoryError || 'Unable to load category spend'}</p>
            ) : categorySpend.length === 0 ? (
              <p className="lead">No category data for the selected range. Adjust your filters to see insights.</p>
            ) : (
              <>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={categorySpend}>
                      <XAxis dataKey="categoryName" hide />
                      <YAxis tick={{ fill: '#94a3b8' }} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="report-legend">
                  {categorySpend.map((row) => (
                    <li key={row.categoryId}>
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: row.color ?? '#0ea5e9' }}
                      />
                      <span className="legend-title">{row.categoryName}</span>
                      <span className="legend-value">
                        {formatCurrency(row.amount)} - {Math.round(row.percentage)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </article>

        <article className="report-card">
          <div className="report-card-header">
            <div>
              <h3>Income vs Expense</h3>
              <p>Compare earned and spent amounts across the chosen period.</p>
            </div>
          </div>
          <div className="report-card-body">
            {incomeVsExpenseQuery.isLoading ? (
              <p className="lead">Loading trend...</p>
            ) : incomeVsExpenseQuery.isError ? (
              <p className="lead error">{trendError || 'Unable to load income vs expense'}</p>
            ) : incomeTrend.length === 0 ? (
              <p className="lead">No transactions available to render the trend.</p>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={incomeTrend}>
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8' }} />
                    <YAxis tick={{ fill: '#94a3b8' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </article>

        <article className="report-card">
          <div className="report-card-header">
            <div>
              <h3>Account Balance Trend</h3>
              <p>See how balances evolve across your accounts.</p>
            </div>
          </div>
          <div className="report-card-body">
            {accountBalanceQuery.isLoading ? (
              <p className="lead">Loading balances...</p>
            ) : accountBalanceQuery.isError ? (
              <p className="lead error">{balanceError || 'Unable to load balances'}</p>
            ) : totalBalanceTrend.length === 0 ? (
              <p className="lead">No balance entries; add a transaction to start tracking.</p>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={totalBalanceTrend}>
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8' }} />
                    <YAxis tick={{ fill: '#94a3b8' }} />
                    <Tooltip />
                    <Area dataKey="balance" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </article>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}
    </section>
  );
}
