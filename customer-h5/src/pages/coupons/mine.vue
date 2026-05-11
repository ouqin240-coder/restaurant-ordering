<template>
  <div class="my-coupons-page">
    <van-nav-bar title="我的优惠券" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab">
      <van-tab title="可用" name="usable" />
      <van-tab title="已使用" name="used" />
      <van-tab title="已过期" name="expired" />
    </van-tabs>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="filteredList.length === 0" class="empty">
      <p>暂无{{ activeTab === 'usable' ? '可用' : (activeTab === 'used' ? '已使用' : '已过期') }}的优惠券</p>
    </div>

    <div v-else class="coupon-list">
      <div v-for="c in filteredList" :key="c.id" class="coupon-card" :class="{ disabled: !c.usable }">
        <div class="coupon-left">
          <div class="amount">¥<span class="num">{{ c.amount }}</span></div>
          <div class="condition">{{ c.minAmount > 0 ? `满¥${c.minAmount}` : '无门槛' }}</div>
        </div>
        <div class="coupon-right">
          <div class="name">{{ c.name || '优惠券' }}</div>
          <div class="meta">券码: {{ c.code }}</div>
          <div class="meta" v-if="c.expiredAt">有效期至 {{ formatDate(c.expiredAt) }}</div>
          <div class="status-tag" :class="statusClass(c)">{{ statusText(c) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { showToast } from 'vant';
import { getMyCoupons } from '@/api';
import { useUserStore } from '@/stores/user';
import dayjs from 'dayjs';

const userStore = useUserStore();
const coupons = ref<any[]>([]);
const loading = ref(true);
const activeTab = ref('usable');

const filteredList = computed(() => {
  return coupons.value.filter((c) => {
    if (activeTab.value === 'usable') return c.usable;
    if (activeTab.value === 'used') return c.isUsed;
    if (activeTab.value === 'expired') return c.isExpired && !c.isUsed;
    return false;
  });
});

async function load() {
  loading.value = true;
  try {
    const userId = userStore.userId || parseInt(localStorage.getItem('user_id') || '0');
    if (!userId) { showToast('请先登录'); return; }
    coupons.value = (await getMyCoupons(userId)) as any[];
  } finally {
    loading.value = false;
  }
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD');
}

function statusText(c: any) {
  if (c.isUsed) return '已使用';
  if (c.isExpired) return '已过期';
  return '可使用';
}

function statusClass(c: any) {
  if (c.isUsed) return 'used';
  if (c.isExpired) return 'expired';
  return 'usable';
}

onMounted(load);
</script>

<style scoped>
.my-coupons-page {
  min-height: 100vh;
  background: #111;
}
.loading, .empty {
  text-align: center;
  padding: 80px 0;
  color: #666;
}
.coupon-list { padding: 12px; }
.coupon-card {
  display: flex;
  background: #1a1a1a;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #252525;
}
.coupon-card.disabled { opacity: 0.5; }
.coupon-left {
  width: 120px;
  background: linear-gradient(135deg, #FF6034, #FF8C42);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px 8px;
}
.coupon-card.disabled .coupon-left { background: #ccc; }
.amount { font-size: 16px; }
.amount .num { font-size: 36px; font-weight: bold; }
.condition { font-size: 11px; margin-top: 4px; opacity: 0.95; }
.coupon-right {
  flex: 1;
  padding: 12px 14px;
  position: relative;
}
.name { font-size: 15px; font-weight: 500; color: #eee; }
.meta { font-size: 11px; color: #999; margin-top: 4px; }
.status-tag {
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.status-tag.usable { background: #FF6034; color: white; }
.status-tag.used { background: #ddd; color: #666; }
.status-tag.expired { background: #f0f0f0; color: #999; }
:deep(.van-nav-bar) { background: #1a1a1a !important; }
:deep(.van-nav-bar__title) { color: #eee !important; }
:deep(.van-nav-bar .van-icon) { color: #eee !important; }
:deep(.van-tabs__nav) { background: #111 !important; }
:deep(.van-tab) { color: #777 !important; }
:deep(.van-tab--active) { color: #FF5722 !important; }
:deep(.van-tabs__line) { background: #FF5722 !important; }
</style>
