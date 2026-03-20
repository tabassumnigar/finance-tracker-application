import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import { goalsApi } from '../services/goals';
import type { GoalContributionRequest, GoalRequest, GoalResponse, GoalWithdrawRequest } from '../types/goal';

const invalidateDashboard = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ predicate: (query) => isGoalOrDashboard(query) });
};

const isGoalOrDashboard = (query: Query) => {
  const key = query.queryKey[0];
  return typeof key === 'string' && ['goals', 'dashboard'].includes(key);
};

export const useGoals = () =>
  useQuery<GoalResponse[]>({
    queryKey: ['goals'],
    queryFn: goalsApi.list,
    staleTime: 1000 * 60 * 2,
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<GoalResponse, Error, GoalRequest>({
    mutationFn: (payload: GoalRequest) => goalsApi.create(payload),
    onSuccess: () => invalidateDashboard(queryClient),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<GoalResponse, Error, { id: number; payload: GoalRequest }>({
    mutationFn: ({ id, payload }: { id: number; payload: GoalRequest }) => goalsApi.update(id, payload),
    onSuccess: () => invalidateDashboard(queryClient),
  });
};

export const useContributeGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<GoalResponse, Error, { id: number; payload: GoalContributionRequest }>({
    mutationFn: ({ id, payload }: { id: number; payload: GoalContributionRequest }) => goalsApi.contribute(id, payload),
    onSuccess: () => invalidateDashboard(queryClient),
  });
};

export const useWithdrawGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<GoalResponse, Error, { id: number; payload: GoalWithdrawRequest }>({
    mutationFn: ({ id, payload }: { id: number; payload: GoalWithdrawRequest }) => goalsApi.withdraw(id, payload),
    onSuccess: () => invalidateDashboard(queryClient),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => goalsApi.remove(id).then(() => undefined),
    onSuccess: () => invalidateDashboard(queryClient),
  });
};
