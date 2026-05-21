import { create } from "zustand";

type Filters = Record<string, string>;

interface UIState {
  globalLoading: boolean;
  activeModule: string | null;
  filters: Filters;
  setGlobalLoading: (loading: boolean) => void;
  setActiveModule: (module: string | null) => void;
  setFilter: (key: string, value: string) => void;
  clearFilter: (key: string) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  globalLoading: false,
  activeModule: null,
  filters: {},
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setActiveModule: (activeModule) => set({ activeModule }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilter: (key) =>
    set((state) => {
      const { [key]: _removed, ...filters } = state.filters;

      return { filters };
    }),
  clearFilters: () => set({ filters: {} }),
}));

