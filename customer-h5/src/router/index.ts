// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/menu',
    },
    {
      path: '/menu',
      component: () => import('@/pages/menu/index.vue'),
      meta: { title: '点餐' },
    },
    {
      path: '/checkout',
      component: () => import('@/pages/checkout/index.vue'),
      meta: { title: '确认订单', requiresAuth: true },
    },
    {
      path: '/order/:orderNo',
      component: () => import('@/pages/order/index.vue'),
      meta: { title: '订单详情', requiresAuth: true },
    },
    {
      path: '/orders',
      component: () => import('@/pages/order/list.vue'),
      meta: { title: '我的订单', requiresAuth: true },
    },
    {
      path: '/coupons/center',
      component: () => import('@/pages/coupons/center.vue'),
      meta: { title: '领券中心', requiresAuth: true },
    },
    {
      path: '/coupons/mine',
      component: () => import('@/pages/coupons/mine.vue'),
      meta: { title: '我的优惠券', requiresAuth: true },
    },
    {
      path: '/login',
      component: () => import('@/pages/login.vue'),
      meta: { title: '登录' },
    },
  ],
});

// 路由守卫：未登录跳转
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '点餐';
  const token = localStorage.getItem('customer_token');
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
