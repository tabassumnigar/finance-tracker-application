import { create } from 'zustand';
import type { GoalResponse } from '../types/goal';

export type GoalModalType = 'create' | 'edit' | 'contribute' | 'withdraw';

type GoalState = {
  modalOpen: boolean;
  modalType?: GoalModalType;
  selectedGoal?: GoalResponse;
  openModal: (type: GoalModalType, goal?: GoalResponse) => void;
  closeModal: () => void;
};

export const useGoalStore = create<GoalState>((set) => ({
  modalOpen: false,
  modalType: undefined,
  selectedGoal: undefined,
  openModal: (type, goal) => set({ modalOpen: true, modalType: type, selectedGoal: goal }),
  closeModal: () => set({ modalOpen: false, modalType: undefined, selectedGoal: undefined }),
}));
