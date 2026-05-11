import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';
import { ElNotification, ElMessage } from 'element-plus';
import { getOrders, acceptOrder, rejectOrder, updateOrderStatus } from '../api';

export const useOrderStore = defineStore('merchantOrders', {
  state: () => ({
    orders: [] as any[],
    total: 0,
    loading: false,
    currentStatus: undefined as number | undefined,
    page: 1,
    pageSize: 20,
    newOrderCount: 0,
    socket: null as Socket | null,
    // 全局计数（不受当前 Tab 过滤影响）
    pendingCount: 0,
    preparingCount: 0,
    readyCount: 0,
  }),

  getters: {
    pendingOrders: (state) => state.orders.filter((o) => o.status === 1),
    preparingOrders: (state) => state.orders.filter((o) => o.status === 2),
  },

  actions: {
    async fetchOrders(params: any = {}) {
      this.loading = true;
      try {
        const data: any = await getOrders({
          status: this.currentStatus,
          page: this.page,
          pageSize: this.pageSize,
          ...params,
        });
        this.orders = data.list;
        this.total = data.total;
      } finally {
        this.loading = false;
      }
    },

    /** 单独拉各状态的计数，不污染 orders 数组 */
    async fetchCounts() {
      try {
        const [p1, p2, p3]: any = await Promise.all([
          getOrders({ status: 1, page: 1, pageSize: 1 }),
          getOrders({ status: 2, page: 1, pageSize: 1 }),
          getOrders({ status: 3, page: 1, pageSize: 1 }),
        ]);
        this.pendingCount = p1.total || 0;
        this.preparingCount = p2.total || 0;
        this.readyCount = p3.total || 0;
      } catch {
        // 失败保持上次的值
      }
    },

    async accept(orderId: number, minutes = 20) {
      await acceptOrder(orderId, minutes);
      ElMessage.success('已接单');
      await this.fetchOrders();
    },

    async reject(orderId: number, reason: string) {
      await rejectOrder(orderId, reason);
      ElMessage.success('已拒单，退款将在1-3个工作日内到账');
      await this.fetchOrders();
    },

    async updateStatus(orderId: number, status: number) {
      await updateOrderStatus(orderId, status);
      await this.fetchOrders();
    },

    connectWebSocket() {
      const token = localStorage.getItem('merchant_token');
      if (!token || this.socket?.connected) return;

      this.socket = io('/ws', {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected to merchant channel');
      });

      this.socket.on('new_order', (payload: any) => {
        const order = payload.data;
        this.newOrderCount++;
        // 插入到列表头部
        this.orders.unshift(order);

        // 声音提醒
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...');
          audio.play().catch(() => {});
        } catch {}

        // 弹窗通知
        ElNotification({
          title: '🔔 新订单',
          message: `桌号 ${order.tableNo || '外卖'} · ¥${order.payAmount}`,
          type: 'success',
          duration: 8000,
          position: 'top-right',
          onClick: () => { this.currentStatus = 1; },
        });
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected, will reconnect...');
      });
    },

    disconnectWebSocket() {
      this.socket?.disconnect();
      this.socket = null;
    },
  },
});
