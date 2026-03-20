export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export type GoalResponse = {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  targetDate: string;
  linkedAccountId?: number;
  linkedAccountName?: string;
  icon?: string;
  color?: string;
  status: GoalStatus;
};

export type GoalRequest = {
  name: string;
  targetAmount: number;
  targetDate: string;
  linkedAccountId?: number;
  icon?: string;
  color?: string;
};

export type GoalContributionRequest = {
  amount: number;
  sourceAccountId?: number;
};

export type GoalWithdrawRequest = {
  amount: number;
  targetAccountId?: number;
};
