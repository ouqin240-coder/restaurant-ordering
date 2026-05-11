<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '200px'" class="sidebar">
      <div class="logo-wrap">
        <div class="logo-icon">🍢</div>
        <span v-if="!collapsed" class="logo-text">老末烧烤铺</span>
      </div>

      <el-menu
        :default-active="$route.path"
        router
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#1a1008"
        text-color="#aab0c4"
        active-text-color="#FF9800"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>营业概览</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Tickets /></el-icon>
          <template #title>
            订单管理
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="menu-badge" />
          </template>
        </el-menu-item>
        <el-menu-item index="/dishes">
          <el-icon><Food /></el-icon>
          <template #title>菜品管理</template>
        </el-menu-item>
        <el-menu-item index="/tables">
          <el-icon><Grid /></el-icon>
          <template #title>桌台管理</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>营业设置</template>
        </el-menu-item>
      </el-menu>

      <!-- 底部折叠按钮 -->
      <div class="sidebar-footer">
        <el-icon class="collapse-btn" @click="collapsed = !collapsed">
          <component :is="collapsed ? ArrowRight : ArrowLeft" />
        </el-icon>
      </div>
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="top-bar">
        <div class="top-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="top-right">
          <!-- 营业开关 -->
          <div class="open-switch">
            <span class="switch-label">营业状态</span>
            <el-switch
              v-model="isOpen"
              active-text="营业中"
              inactive-text="已打烊"
              active-color="#67C23A"
              inactive-color="#F56C6C"
              @change="toggleOpen"
            />
          </div>
          <el-divider direction="vertical" />
          <span class="datetime">{{ currentTime }}</span>
          <el-divider direction="vertical" />
          <el-dropdown @command="handleUserCmd">
            <div class="user-info">
              <el-avatar size="small" :style="{ background: '#FF5722' }">
                {{ merchantName.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ merchantName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive :include="['OrdersPage', 'DishesPage']">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  DataAnalysis, Tickets, Food, Grid, Setting,
  ArrowLeft, ArrowRight, ArrowDown,
} from '@element-plus/icons-vue';
import { useOrderStore } from '@/stores/orders';
import dayjs from 'dayjs';

const router = useRouter();
const orderStore = useOrderStore();
const collapsed = ref(false);
const isOpen = ref(true);
const currentTime = ref('');
const merchantName = ref(localStorage.getItem('merchant_name') || '管理员');

const pendingCount = computed(() => orderStore.pendingCount);

let timer: ReturnType<typeof setInterval>;
let pollTimer: ReturnType<typeof setInterval>;
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  orderStore.connectWebSocket();
  // 拉一次全局计数（不污染 orders 数组）
  orderStore.fetchCounts();
  // 每 30 秒刷新一次计数
  pollTimer = setInterval(() => {
    orderStore.fetchCounts();
  }, 30000);
});

onUnmounted(() => {
  clearInterval(timer);
  clearInterval(pollTimer);
});

function updateTime() {
  currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
}

async function toggleOpen(val: boolean) {
  // TODO: 调用营业设置接口
  ElMessage.success(val ? '已开始营业' : '已暂停接单');
}

function handleUserCmd(cmd: string) {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确认退出登录？', '提示').then(() => {
      localStorage.removeItem('merchant_token');
      localStorage.removeItem('merchant_name');
      orderStore.disconnectWebSocket();
      router.push('/login');
    });
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: #1a1008;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

.logo-wrap {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  gap: 10px;
  border-bottom: 1px solid #2d3348;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo-text {
  color: white;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border: none !important;
  overflow-y: auto;
}

:deep(.el-menu-item.is-active) {
  background: #FF5722 !important;
  color: white !important;
  border-radius: 8px;
  margin: 2px 8px;
}

:deep(.el-menu-item) {
  border-radius: 8px;
  margin: 2px 8px;
}

.menu-badge {
  margin-left: 4px;
}

.sidebar-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #2d3348;
}

.collapse-btn {
  color: #aab0c4;
  cursor: pointer;
  font-size: 18px;
}

.top-bar {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  height: 56px !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.open-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 13px;
  color: #666;
}

.datetime {
  font-size: 13px;
  color: #999;
  font-family: monospace;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  background: #f5f6fa;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
