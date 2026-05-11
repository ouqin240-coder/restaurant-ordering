<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">🍜</div>
        <h1>餐厅管理后台</h1>
        <p>Restaurant Admin System</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="login-form">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="请输入用户名"
            :prefix-icon="User"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="login-btn"
          @click="submit"
        >
          登 录
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>默认账号：admin / admin123</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { merchantLogin } from '@/api';

const router = useRouter();
const formRef = ref();
const loading = ref(false);
const form = ref({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
};

async function submit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    const res: any = await merchantLogin(form.value.username, form.value.password);
    localStorage.setItem('merchant_token', res.token);
    localStorage.setItem('merchant_name', res.name);
    localStorage.setItem('merchant_role', res.role);
    ElMessage.success(`欢迎回来，${res.name}`);
    router.push('/');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e2333 0%, #2d3348 50%, #1e2333 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 420px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-logo {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
}

.login-header p {
  font-size: 13px;
  color: #bbb;
  margin: 0;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #FF6034, #FF8C42) !important;
  border: none !important;
  border-radius: 10px !important;
  margin-top: 8px;
  letter-spacing: 4px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #ccc;
}
</style>
