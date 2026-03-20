export type AccountDto = {
  id: number;
  userId: number;
  name: string;
  type: 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'CASH_WALLET' | 'SAVINGS_ACCOUNT';
  currency: string;
  openingBalance: number;
  currentBalance: number;
  institutionName?: string;
  lastUpdatedAt: string;
};

export type CreateAccountPayload = {
  name: string;
  type: 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'CASH_WALLET' | 'SAVINGS_ACCOUNT';
  currency: string;
  openingBalance: number;
  institutionName?: string;
};

export type UpdateAccountPayload = {
  name: string;
  type: 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'CASH_WALLET' | 'SAVINGS_ACCOUNT';
  currency: string;
  currentBalance: number;
  institutionName?: string;
};

export type TransferPayload = {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
};

export type Account = AccountDto;
export type CreateAccountRequest = CreateAccountPayload;
export type UpdateAccountRequest = UpdateAccountPayload;
export type TransferRequest = TransferPayload;
