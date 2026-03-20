export type BudgetAlertLevel = 'normal' | 'warning' | 'alert' | 'critical';

export type BudgetResponse = {
  id: number;
  categoryId: number;
  categoryName: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  progressPercent: number;
  alertThresholdPercent: number;
  alertLevel: BudgetAlertLevel;
};

export type BudgetRequest = {
  categoryId: number;
  month: number;
  year: number;
  amount: number;
  alertThresholdPercent?: number;
};
