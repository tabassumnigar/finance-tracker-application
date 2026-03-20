import { create } from 'zustand';
import type { BudgetResponse } from '../types/budget';

type BudgetModalType = 'create' | 'edit';

type BudgetState = {
  modalOpen: boolean;
  modalType?: BudgetModalType;
  selectedBudget?: BudgetResponse;
  openModal: (type: BudgetModalType, budget?: BudgetResponse) => void;
  closeModal: () => void;
};

export const useBudgetStore = create<BudgetState>((set) => ({
  modalOpen: false,
  modalType: undefined,
  selectedBudget: undefined,
  openModal: (type, budget) => set({ modalOpen: true, modalType: type, selectedBudget: budget }),
  closeModal: () => set({ modalOpen: false, modalType: undefined, selectedBudget: undefined }),
}));
