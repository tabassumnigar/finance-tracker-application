export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type TransactionDto = {
  id: number;
  accountId: number;
  transferAccountId?: number;
  categoryId?: number;
  type: TransactionType;
  amount: number;
  description: string;
  merchant?: string;
  paymentMethod?: string;
  tags: string[];
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  recurringTransactionId?: number;
};

export type TransactionPage = {
  items: TransactionDto[];
  total: number;
  page: number;
  size: number;
};

export type TransactionListFilter = {
  page?: number;
  size?: number;
  search?: string;
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
};

export type CreateTransactionPayload = {
  accountId: number;
  amount: number;
  description: string;
  type: TransactionType;
  categoryId?: number;
  transferAccountId?: number;
  merchant?: string;
  paymentMethod?: string;
  tags?: string[];
  transactionDate?: string;
  recurringTransactionId?: number;
};

export type UpdateTransactionPayload = CreateTransactionPayload;

export type TransactionFormValues = {
  accountId: number;
  amount: number;
  description: string;
  type: TransactionType;
  categoryId?: number;
  transferAccountId?: number;
  merchant?: string;
  paymentMethod?: string;
  tags?: string;
  transactionDate: string;
  recurringTransactionId?: number;
};
