<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="slide-up" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { showDialog } from 'vant';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

onMounted(async () => {
  // 从 URL query 参数获取桌号（扫码进入）
  const scene = route.query.scene as string;
  const tableNo = route.query.table as string;

  if (!userStore.isLoggedIn) {
    // 在微信环境中获取 code 进行登录
    const code = route.query.code as string;
    if (code) {
      try {
        await userStore.login(code, scene || (tableNo ? `table_${tableNo}` : undefined));
        // 登录成功后询问就餐方式
        if (!userStore.orderType) {
          await chooseOrderType();
        }
      } catch (e) {
        console.error('Login failed', e);
      }
    } else if (tableNo) {
      // 存储桌号，等待用户交互时再登录
      localStorage.setItem('table_no', tableNo);
    }
  } else if (tableNo && !userStore.orderType) {
    userStore.tableNo = tableNo;
    await chooseOrderType();
  }
});

async function chooseOrderType() {
  const tableNo = localStorage.getItem('table_no') || userStore.tableNo;
  if (tableNo) {
    // 有桌号则询问堂食还是外卖
    await showDialog({
      title: '选择就餐方式',
      message: `您在 ${tableNo} 桌，请选择就餐方式`,
      confirmButtonText: '堂食',
      cancelButtonText: '外卖',
      confirmButtonColor: '#FF6034',
    }).then(() => {
      userStore.setOrderType('1');
    }).catch(() => {
      userStore.setOrderType('2');
    });
  } else {
    userStore.setOrderType('2');
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #111;
  color: #eee;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.slide-up-leave-to {
  opacity: 0;
}

/* ─── 全局暗色覆写 van 组件 ─── */
.van-nav-bar { background: #1a1a1a !important; }
.van-nav-bar__title { color: #eee !important; }
.van-nav-bar__arrow, .van-nav-bar .van-icon { color: #eee !important; }
.van-tabs__nav { background: #111 !important; }
.van-tab { color: #777 !important; }
.van-tab--active { color: #FF5722 !important; }
.van-tabs__line { background: #FF5722 !important; }
.van-cell::after { border-color: #333 !important; }
.van-field__control { color: #eee !important; }
.van-field__control::placeholder { color: #666 !important; }
.van-field__label { color: #ccc !important; }
.van-empty__description { color: #666 !important; }
.van-dialog { background: #1e1e1e !important; }
.van-dialog__header { color: #eee !important; }
.van-dialog__message { color: #ccc !important; }
.van-dialog__confirm { color: #FF5722 !important; }
.van-action-sheet { background: #1e1e1e !important; }
.van-action-sheet__header { color: #eee !important; }
.van-action-sheet__item { background: #1e1e1e !important; color: #eee !important; }
.van-action-sheet__cancel { background: #111 !important; color: #999 !important; }
.van-button--primary { background: #FF5722 !important; border-color: #FF5722 !important; }
.van-button--default { background: #252525 !important; border-color: #3a3a3a !important; color: #ccc !important; }
.van-loading__text { color: #999 !important; }

/* 图片预览 - 不干扰 vant 默认行为，只确保层级够高 */
.van-step__circle { background: #555 !important; border: none !important; width: 8px !important; height: 8px !important; }
.van-step__line { background: #333 !important; }
.van-step--finish .van-step__circle { background: #FF5722 !important; }
.van-step--finish .van-step__line { background: #FF5722 !important; }
.van-step--process .van-step__icon { background: #FF5722 !important; color: white !important; border: none !important; }
.van-step__title { color: #666 !important; font-size: 12px !important; }
.van-step--finish .van-step__title { color: #FF5722 !important; }
.van-step--process .van-step__title { color: #FF5722 !important; }
.van-step__icon .van-icon { color: white !important; }
.van-steps { background: transparent !important; }
.van-step__circle { background: #444 !important; border-color: #444 !important; width: 8px !important; height: 8px !important; }
.van-step__line { background: #333 !important; }
.van-step--finish .van-step__circle { background: #FF5722 !important; border-color: #FF5722 !important; }
.van-step--finish .van-step__line { background: #FF5722 !important; }
.van-step--process .van-step__icon { background: #FF5722 !important; color: white !important; border: none !important; }
.van-step__title { color: #666 !important; font-size: 12px !important; }
.van-step--finish .van-step__title { color: #FF5722 !important; }
.van-step--process .van-step__title { color: #FF5722 !important; }


</style>
