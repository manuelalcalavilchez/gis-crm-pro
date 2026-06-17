
import { create } from "zustand";

export const useStore = create((set) => ({
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
}));
