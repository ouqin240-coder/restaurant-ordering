// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/pages/login.vue'), meta: { title: '登录' } },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/pages/dashboard/index.vue'), meta: { title: '营业概览' } },
        { path: 'orders', component: () => import('@/pages/orders/index.vue'), meta: { title: '订单管理' } },
        { path: 'dishes', component: () => import('@/pages/dishes/index.vue'), meta: { title: '菜品管理' } },
        { path: 'tables', component: () => import('@/pages/tables/index.vue'), meta: { title: '桌台管理' } },
        { path: 'settings', component: () => import('@/pages/settings/index.vue'), meta: { title: '营业设置' } },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || ''} - 餐厅管理后台`;
  if (to.meta.requiresAuth && !localStorage.getItem('merchant_token')) {
    next('/login');
  } else {
    next();
  }
});

export default router;
