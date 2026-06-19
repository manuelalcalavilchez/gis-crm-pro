import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth state ──
      user: null,
      isAuthenticated: false,
      loginAttempts: 0,
      lockedUntil: null,

      login: (userData) => set({
        user: userData,
        isAuthenticated: true,
        loginAttempts: 0,
        lockedUntil: null
      }),

      logout: () => set({
        user: null,
        isAuthenticated: false
      }),

      incrementLoginAttempts: () => {
        const attempts = get().loginAttempts + 1;
        const locked = attempts >= 5 ? Date.now() + 60000 * 2 : null; // 2 min lock
        set({ loginAttempts: attempts, lockedUntil: locked });
      },

      resetLoginAttempts: () => set({ loginAttempts: 0, lockedUntil: null }),

      // ── Tasaciones state ──
      items: [],
      selected: null,
      filters: {},

      setItems: (items) => set({ items }),
      setSelected: (selected) => set({ selected }),
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      // ── Import state ──
      importData: [],
      setImportData: (importData) => set({ importData }),
      clearImportData: () => set({ importData: [] }),
    }),
    {
      name: 'gis-crm-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
