export type ReportsFilter = {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  categoryId?: number;
  transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
};

export type CategorySpendReport = {
  categoryId: number;
  categoryName: string;
  color?: string;
  icon?: string | null;
  amount: number;
  percentage: number;
};

export type AccountBalancePoint = {
  accountId: number;
  accountName: string;
  date: string;
  balance: number;
};

export type ReportTrendPoint = {
  label: string;
  income: number;
  expense: number;
};
