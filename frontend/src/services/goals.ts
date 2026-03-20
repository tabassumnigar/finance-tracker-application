import { apiClient } from './api';
import type { GoalContributionRequest, GoalRequest, GoalResponse, GoalWithdrawRequest } from '../types/goal';

const endpoint = '/goals';

type GoalApiResponse = {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  target_date: string;
  linked_account_id?: number | null;
  linked_account_name?: string | null;
  icon?: string | null;
  color?: string | null;
  status: GoalResponse['status'];
};

const normalizeGoal = (goal: GoalApiResponse): GoalResponse => ({
  id: goal.id,
  name: goal.name,
  targetAmount: goal.target_amount,
  currentAmount: goal.current_amount,
  progressPercent: goal.progress_percent,
  targetDate: goal.target_date,
  linkedAccountId: goal.linked_account_id ?? undefined,
  linkedAccountName: goal.linked_account_name ?? undefined,
  icon: goal.icon ?? undefined,
  color: goal.color ?? undefined,
  status: goal.status,
});

export const goalsApi = {
  list: () => apiClient.get<GoalApiResponse[]>(endpoint).then((res) => res.data.map(normalizeGoal)),
  create: (payload: GoalRequest) => apiClient.post<GoalApiResponse>(endpoint, payload).then((res) => normalizeGoal(res.data)),
  update: (id: number, payload: GoalRequest) =>
    apiClient.put<GoalApiResponse>(`${endpoint}/${id}`, payload).then((res) => normalizeGoal(res.data)),
  remove: (id: number) => apiClient.delete(`${endpoint}/${id}`),
  contribute: (id: number, payload: GoalContributionRequest) =>
    apiClient.post<GoalApiResponse>(`${endpoint}/${id}/contribute`, payload).then((res) => normalizeGoal(res.data)),
  withdraw: (id: number, payload: GoalWithdrawRequest) =>
    apiClient.post<GoalApiResponse>(`${endpoint}/${id}/withdraw`, payload).then((res) => normalizeGoal(res.data)),
};
