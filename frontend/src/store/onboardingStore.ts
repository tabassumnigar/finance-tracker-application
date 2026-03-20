import { create } from 'zustand';

type OnboardingState = {
  completed: boolean;
  markComplete: () => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  completed: false,
  markComplete: () => set({ completed: true }),
  reset: () => set({ completed: false }),
}));
