import { defineStore } from 'pinia';

export interface CartItem {
  dishId: number;
  dishName: string;
  dishImage?: string;
  price: number;
  quantity: number;
  specId?: number;
  specName?: string;
  remark?: string;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    remark: '',
  }),

  getters: {
    totalCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: (state) => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
      // 有单品备注时不合并，作为独立条目
      if (item.remark) {
        this.items.push({ ...item, quantity: item.quantity || 1 });
        return;
      }
      const existing = this.items.find(
        (i) => i.dishId === item.dishId && i.specId === item.specId && !i.remark,
      );
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        this.items.push({ ...item, quantity: item.quantity || 1 });
      }
    },

    removeItem(dishId: number, specId?: number) {
      const idx = this.items.findIndex(
        (i) => i.dishId === dishId && i.specId === specId,
      );
      if (idx !== -1) {
        if (this.items[idx].quantity > 1) {
          this.items[idx].quantity--;
        } else {
          this.items.splice(idx, 1);
        }
      }
    },

    deleteItem(dishId: number, specId?: number) {
      this.items = this.items.filter(
        (i) => !(i.dishId === dishId && i.specId === specId),
      );
    },

    clearCart() {
      this.items = [];
      this.remark = '';
    },

    getItemCount(dishId: number, specId?: number) {
      return this.items.find((i) => i.dishId === dishId && i.specId === specId)?.quantity || 0;
    },
  },

  persist: {
    key: 'cart',
    storage: localStorage,
  },
});
