<template>
  <div class="login-page">
    <div class="login-hero">
      <div class="logo">🍢</div>
      <h1>老末烧烤铺</h1>
      <p>工作太烦恼，不如吃烧烤😋</p>
    </div>

    <div class="login-body">
      <van-button
        type="primary"
        size="large"
        round
        block
        :loading="loading"
        class="wx-login-btn"
        @click="handleLogin"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 40 40" fill="white" style="margin-right:6px">
            <path d="M16.2 10c-5.9 0-10.7 4-10.7 8.9 0 2.8 1.5 5.2 3.9 6.9l-.9 2.7 3.2-1.6c1.1.3 2.3.5 3.5.5 5.9 0 10.7-4 10.7-8.9S22.1 10 16.2 10zm-2.9 5.5c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm5.8 0c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1z"/>
            <path d="M33.8 22.8c0-4.3-4.2-7.7-9.3-7.7-.3 0-.6 0-.9.1 1.6 1.7 2.6 3.8 2.6 6.1 0 5-4.8 9.1-10.7 9.1-.2 0-.5 0-.7 0 1.5 2.3 4.5 3.8 7.9 3.8 1 0 2-.1 2.9-.4l2.6 1.4-.7-2.3c2-1.4 3.3-3.5 3.3-5.8 0 0 0-.2 0-.3z"/>
          </svg>
        </template>
        微信一键登录
      </van-button>

      <p class="login-hint">登录即表示同意
        <span class="link">《用户协议》</span>和
        <span class="link">《隐私政策》</span>
      </p>
    </div>

    <!-- 开发环境 mock 登录 -->
    <div class="dev-login">
      <van-divider>测试登录（无微信环境）</van-divider>
      <van-button size="small" plain @click="mockLogin">🧪 Mock 登录（桌号 A3）</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);
const isDev = import.meta.env.DEV;

async function handleLogin() {
  loading.value = true;
  try {
    // 在微信中获取 code
    if (typeof (window as any).wx !== 'undefined') {
      // 微信环境：跳转获取 code
      const appid = import.meta.env.VITE_WX_APPID;
      const redirectUri = encodeURIComponent(window.location.href);
      const scene = localStorage.getItem('table_no') ? `table_${localStorage.getItem('table_no')}` : '';
      window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${scene}#wechat_redirect`;
    } else {
      showToast('请在微信中打开');
      loading.value = false;
    }
  } catch {
    loading.value = false;
  }
}

async function mockLogin() {
  loading.value = true;
  try {
    // 先设置桌号，确保下单时有值
    localStorage.setItem('table_no', 'A3');
    userStore.tableNo = 'A3';
    await userStore.login('mock_code_' + Date.now(), 'table_A3');
    userStore.setOrderType('1');
    const redirect = route.query.redirect as string || '/menu';
    router.replace(redirect);
  } catch (e) {
    showToast('登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0a00 0%, #2d1200 40%, #111 100%);
  display: flex;
  flex-direction: column;
}

.login-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px 40px;
  color: white;
}

.logo {
  font-size: 72px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
}

.login-hero h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.login-hero p {
  font-size: 15px;
  opacity: 0.85;
}

.login-body {
  background: #1a1a1a;
  border-radius: 24px 24px 0 0;
  padding: 36px 24px 40px;
}

.wx-login-btn {
  background: #07C160 !important;
  border-color: #07C160 !important;
  height: 50px;
  font-size: 17px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-hint {
  text-align: center;
  font-size: 12px;
  color: #777;
  margin-top: 20px;
}

.link {
  color: #FF6034;
  cursor: pointer;
}

.dev-login {
  background: #1a1a1a;
  padding: 0 24px 30px;
  text-align: center;
}
.van-button--primary { background: #FF5722 !important; border-color: #FF5722 !important; }
</style>
