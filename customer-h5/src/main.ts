// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'vant/lib/index.css';
import App from './App.vue';
import router from './router';

// 扫码进入：从 URL 读取桌号自动写入
(function applyTableFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const table = params.get('table');
  if (table) {
    localStorage.setItem('table_no', table);
    localStorage.setItem('order_type', '1'); // 堂食
    // 清掉 URL 参数避免反复触发
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }
})();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
