<template>
  <div class="coupon-center-page">
    <van-nav-bar title="🎟 领券中心" left-arrow @click-left="$router.back()">
      <template #right>
        <span style="font-size:14px;color:#FF6034" @click="$router.push('/coupons/mine')">我的券 →</span>
      </template>
    </van-nav-bar>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="coupons.length === 0" class="empty">
      <p>暂无可领取的优惠券</p>
    </div>

    <div v-else class="coupon-list">
      <div v-for="c in coupons" :key="c.templateId" class="coupon-card" :class="{ disabled: c.alreadyClaimed || c.remaining === 0 }">
        <div class="coupon-left">
          <div class="amount">
            ¥<span class="num">{{ c.amount }}</span>
          </div>
          <div class="condition">
            {{ c.minAmount > 0 ? `满¥${c.minAmount}可用` : '无门槛' }}
          </div>
        </div>
        <div class="coupon-right">
          <div class="name">{{ c.name }}</div>
          <div class="meta">
            <span v-if="c.expiredAt">有效期至 {{ formatDate(c.expiredAt) }}</span>
            <span v-else>长期有效</span>
          </div>
          <div class="meta">剩余 {{ c.remaining }} / {{ c.batchTotal }} 张</div>
          <van-button
            v-if="c.alreadyClaimed"
            size="small"
            disabled
            block
            class="btn"
          >已领取</van-button>
          <van-button
            v-else-if="c.remaining === 0"
            size="small"
            disabled
            block
            class="btn"
          >已领完</van-button>
          <van-button
            v-else
            size="small"
            type="primary"
            block
            class="btn"
            :loading="claimingId === c.templateId"
            @click="onClaim(c)"
          >立即领取</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showToast, showSuccessToast } from 'vant';
import { getAvailableCoupons, claimCoupon } from '@/api';
import { useUserStore } from '@/stores/user';
import dayjs from 'dayjs';

const userStore = useUserStore();
const coupons = ref<any[]>([]);
const loading = ref(true);
const claimingId = ref<number | null>(null);

async function load() {
  loading.value = true;
  try {
    const userId = userStore.userId || parseInt(localStorage.getItem('user_id') || '0');
    if (!userId) { showToast('请先登录'); return; }
    coupons.value = (await getAvailableCoupons(userId)) as any[];
  } finally {
    loading.value = false;
  }
}

async function onClaim(c: any) {
  const userId = userStore.userId || parseInt(localStorage.getItem('user_id') || '0');
  if (!userId) { showToast('请先登录'); return; }
  claimingId.value = c.templateId;
  try {
    const res: any = await claimCoupon(userId, c.templateId);
    if (res.success === false) {
      showToast(res.message || '领取失败');
    } else {
      showSuccessToast('领取成功！');
      await load();
    }
  } catch (e: any) {
    showToast(e?.response?.data?.message || '领取失败');
  } finally {
    claimingId.value = null;
  }
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD');
}

onMounted(load);
</script>

<style scoped>
.coupon-center-page {
  min-height: 100vh;
  background: #111;
}
.loading, .empty {
  text-align: center;
  padding: 80px 0;
  color: #666;
}
.coupon-list {
  padding: 12px;
}
.coupon-card {
  display: flex;
  background: #1a1a1a;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #252525;
}
.coupon-card.disabled {
  opacity: 0.6;
}
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
.coupon-card.disabled .coupon-left {
  background: #ccc;
}
.amount {
  font-size: 16px;
}
.amount .num {
  font-size: 36px;
  font-weight: bold;
}
.condition {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.95;
}
.coupon-right {
  flex: 1;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.name {
  font-size: 15px;
  font-weight: 500;
  color: #eee;
}
.meta {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
.btn {
  margin-top: 8px;
}
:deep(.van-nav-bar) { background: #1a1a1a !important; }
:deep(.van-nav-bar__title) { color: #eee !important; }
:deep(.van-nav-bar .van-icon) { color: #eee !important; }
</style>
