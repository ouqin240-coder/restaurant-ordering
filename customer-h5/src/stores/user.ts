import { defineStore } from 'pinia';
import { wxLogin } from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('customer_token') || '',
    openid: localStorage.getItem('customer_openid') || '',
    userId: parseInt(localStorage.getItem('user_id') || '0'),
    tableNo: localStorage.getItem('table_no') || '',
    orderType: (localStorage.getItem('order_type') || '') as '1' | '2' | '',
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isDineIn: (state) => state.orderType === '1',
    isDelivery: (state) => state.orderType === '2',
  },

  actions: {
    async login(code: string, scene?: string) {
      const res: any = await wxLogin(code, scene);
      this.token = res.token;
      this.openid = res.openid;
      this.userId = res.userId || 0;
      this.tableNo = res.tableNo || '';
      localStorage.setItem('customer_token', res.token);
      localStorage.setItem('customer_openid', res.openid);
      if (res.userId) localStorage.setItem('user_id', String(res.userId));
      if (res.tableNo) localStorage.setItem('table_no', res.tableNo);
      return res;
    },

    setOrderType(type: '1' | '2') {
      this.orderType = type;
      localStorage.setItem('order_type', type);
    },

    logout() {
      this.token = '';
      this.openid = '';
      this.userId = 0;
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_openid');
      localStorage.removeItem('user_id');
    },
  },
});
