import { create } from 'zustand';

interface UiStore {
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  isModalOpen: false,
  setModalOpen: (v) => set({ isModalOpen: v }),
}));
