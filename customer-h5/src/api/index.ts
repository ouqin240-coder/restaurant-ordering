import axios from 'axios';
import { showToast } from 'vant';

const http = axios.create({
  baseURL: '/v1',
  timeout: 10000,
});

// 请求拦截：自动附加 Token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截：统一错误处理
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || '网络错误，请稍后重试';
    showToast({ message: msg, type: 'fail' });
    if (err.response?.status === 401) {
      localStorage.removeItem('customer_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── Auth ───
export const wxLogin = (code: string, scene?: string) =>
  http.post('/auth/wx-login', { code, scene });

// ─── Menu ───
export const getFullMenu = () => http.get('/menu/categories-with-dishes');
export const getShopInfo = () => http.get('/shop/info');
export const getRecommended = () => http.get('/menu/recommended');
export const getHotList = () => http.get('/menu/hot-list');
export const searchDishes = (keyword: string) => http.get('/menu/search', { params: { keyword } });

// ─── Orders ───
export const createOrder = (data: any) => http.post('/orders', data);
export const getOrder = (orderNo: string) => http.get(`/orders/${orderNo}`);
export const getUserOrders = (page = 1, status?: string) => http.get('/orders', { params: { page, status } });

// ─── Coupons ───
export const getAvailableCoupons = (userId: number) =>
  http.get('/customer/coupons/available', { params: { userId } });
export const claimCoupon = (userId: number, templateId: number) =>
  http.post('/customer/coupons/claim', { userId, templateId });
export const getMyCoupons = (userId: number) =>
  http.get('/customer/coupons/mine', { params: { userId } });

export default http;
