import { create } from 'zustand';

type AccountsModalState = {
  editOpen: boolean;
  transferOpen: boolean;
  editingId?: number;
  openEdit: (id: number) => void;
  openTransfer: () => void;
  closeAll: () => void;
};

export const useAccountsModalStore = create<AccountsModalState>((set) => ({
  editOpen: false,
  transferOpen: false,
  editingId: undefined,
  openEdit: (id: number) => set({ editOpen: true, transferOpen: false, editingId: id }),
  openTransfer: () => set({ transferOpen: true, editOpen: false }),
  closeAll: () => set({ editOpen: false, transferOpen: false, editingId: undefined }),
}));
