import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import type { ShoppingCart } from '../types';

interface CartState {
  items: ShoppingCart[];
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (userId: string, productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => void;
  loadCart: (userId: string) => Promise<void>;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      totalItems: 0,
      totalPrice: 0,

      addItem: async (userId: string, productId: string, variantId?: string, quantity = 1) => {
        set({ isLoading: true });
        try {
          await apiService.addToCart(userId, productId, variantId, quantity);
          await get().loadCart(userId);
        } catch (error) {
          console.error('Error adding to cart:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateItem: async (id: string, quantity: number) => {
        set({ isLoading: true });
        try {
          await apiService.updateCartItem(id, quantity);
          
          // Update local state
          const items = get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          );
          
          set({ items });
          get().calculateTotals();
        } catch (error) {
          console.error('Error updating cart item:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (id: string) => {
        set({ isLoading: true });
        try {
          await apiService.removeFromCart(id);
          
          // Update local state
          const items = get().items.filter(item => item.id !== id);
          set({ items });
          get().calculateTotals();
        } catch (error) {
          console.error('Error removing from cart:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },

      loadCart: async (userId: string) => {
        set({ isLoading: true });
        try {
          const items = await apiService.getCartItems(userId);
          set({ items });
          get().calculateTotals();
        } catch (error) {
          console.error('Error loading cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      calculateTotals: () => {
        const { items } = get();
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => {
          const price = item.variant?.price || item.product?.base_price || 0;
          return sum + (price * item.quantity);
        }, 0);

        set({ totalItems, totalPrice });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
      }),
    }
  )
);