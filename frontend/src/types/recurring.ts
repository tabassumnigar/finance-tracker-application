export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type RecurringItem = {
  id: number;
  title: string;
  type: TransactionType;
  amount: number;
  categoryId?: number;
  categoryName?: string;
  accountId: number;
  accountName: string;
  transferAccountId?: number;
  transferAccountName?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  nextRun: string;
  lastRun?: string | null;
  autoCreateTransaction: boolean;
  active: boolean;
};

export type RecurringRequest = {
  title: string;
  type: TransactionType;
  amount: number;
  categoryId?: number;
  accountId: number;
  transferAccountId?: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  autoCreateTransaction?: boolean;
  active?: boolean;
};
