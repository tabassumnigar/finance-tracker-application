import { create } from 'zustand';
import type { RecurringItem } from '../types/recurring';

export type RecurringModalType = 'create' | 'edit';

type RecurringState = {
  modalOpen: boolean;
  modalType?: RecurringModalType;
  selectedRecurring?: RecurringItem;
  openModal: (type: RecurringModalType, item?: RecurringItem) => void;
  closeModal: () => void;
};

export const useRecurringStore = create<RecurringState>((set) => ({
  modalOpen: false,
  modalType: undefined,
  selectedRecurring: undefined,
  openModal: (type, item) => set({ modalOpen: true, modalType: type, selectedRecurring: item }),
  closeModal: () => set({ modalOpen: false, modalType: undefined, selectedRecurring: undefined }),
}));
