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
        const locked = attempts >= 5 ? Date.now() + 60000 * 2 : null;
        set({ loginAttempts: attempts, lockedUntil: locked });
      },

      resetLoginAttempts: () => set({ loginAttempts: 0, lockedUntil: null }),

      isAdmin: () => {
        const user = get().user;
        return user?.email === 'manuel@tecnologiaalcala.es' || user?.role === 'administrador';
      },

      // ── Informes state ──
      items: [],
      selected: null,
      filters: {},
      resultCount: 0,

      setItems: (items) => set({ items, resultCount: items.length }),
      setSelected: (selected) => set({ selected }),
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
      setResultCount: (resultCount) => set({ resultCount }),
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
