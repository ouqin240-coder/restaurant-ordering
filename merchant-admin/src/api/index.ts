import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const http = axios.create({ baseURL: '/v1', timeout: 15000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('merchant_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || '请求失败';
    ElMessage.error(msg);
    if (err.response?.status === 401) {
      localStorage.removeItem('merchant_token');
      router.push('/login');
    }
    return Promise.reject(err);
  },
);

// Auth
export const merchantLogin = (username: string, password: string) =>
  http.post('/auth/merchant-login', { username, password });

// Orders
export const getOrders = (params: any) => http.get('/merchant/orders', { params });
export const acceptOrder = (id: number, estimatedMinutes?: number) =>
  http.put(`/merchant/orders/${id}/accept`, { estimatedMinutes });
export const rejectOrder = (id: number, reason: string) =>
  http.put(`/merchant/orders/${id}/reject`, { reason });
export const updateOrderStatus = (id: number, status: number) =>
  http.put(`/merchant/orders/${id}/status`, { status });

// Menu
export const getCategories = () => http.get('/merchant/menu/categories');
export const createCategory = (data: any) => http.post('/merchant/menu/categories', data);
export const updateCategory = (id: number, data: any) => http.put(`/merchant/menu/categories/${id}`, data);
export const deleteCategory = (id: number) => http.delete(`/merchant/menu/categories/${id}`);

export const getDishes = (params?: any) => http.get('/merchant/menu/dishes', { params });
export const createDish = (data: any) => http.post('/merchant/menu/dishes', data);
export const updateDish = (id: number, data: any) => http.put(`/merchant/menu/dishes/${id}`, data);
export const updateDishStatus = (id: number, status: number) =>
  http.put(`/merchant/menu/dishes/${id}/status`, { status });
export const batchDishStatus = (ids: number[], status: number) =>
  http.post('/merchant/menu/dishes/batch-status', { ids, status });
export const deleteDish = (id: number) => http.delete(`/merchant/menu/dishes/${id}`);

// Tables
export const getTables = () => http.get('/merchant/tables');
export const createTable = (data: any) => http.post('/merchant/tables', data);
export const updateTableStatus = (id: number, status: string) =>
  http.put(`/merchant/tables/${id}/status`, { status });
export const deleteTable = (id: number) => http.delete(`/merchant/tables/${id}`);

// Stats
export const getOverview = (date?: string) => http.get('/merchant/stats/overview', { params: { date } });
export const getDishRank = (params: any) => http.get('/merchant/stats/dish-rank', { params });
export const getRevenueTrend = (type: string, count = 7) =>
  http.get('/merchant/stats/revenue-trend', { params: { type, count } });

export default http;
