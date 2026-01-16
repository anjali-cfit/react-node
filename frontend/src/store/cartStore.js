import { create } from 'zustand';

export const useCartStore = create((set) => ({
  cart: null,
  isLoading: false,

  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),

  clearCart: () => set({ cart: null }),
}));
