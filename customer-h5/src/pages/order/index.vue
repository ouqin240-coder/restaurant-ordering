<template>
  <div class="order-page">
    <van-nav-bar title="订单详情" left-arrow @click-left="$router.back()" />

    <div v-if="loading" class="loading-wrap">
      <van-loading size="32" color="#FF6034" />
    </div>

    <template v-else-if="order">
      <!-- 状态进度条 -->
      <div class="status-banner" :class="`status-${order.status}`">
        <div class="status-icon">
          <van-icon :name="statusIcon" size="36" color="white" />
        </div>
        <div class="status-info">
          <div class="status-text">{{ order.statusText }}</div>
          <div v-if="order.estimatedMinutes && order.status === 2" class="status-sub">
            预计 {{ order.estimatedMinutes }} 分钟内完成
          </div>
          <div v-if="order.status === 1" class="status-sub">商家正在确认您的订单</div>
          <div v-if="order.status === 3 && order.orderType === 1" class="status-sub">您的餐食已准备好，请前往取餐</div>
          <div v-if="order.status === 4" class="status-sub">感谢您的光临，欢迎再次惠顾 🎉</div>
        </div>
      </div>

      <!-- 步骤进度 -->
      <div class="progress-wrap">
        <van-steps :active="stepActive" active-color="#FF6034">
          <van-step>已下单</van-step>
          <van-step>商家确认</van-step>
          <van-step>制作中</van-step>
          <van-step>{{ order.orderType === 2 ? '配送中' : '待取餐' }}</van-step>
          <van-step>已完成</van-step>
        </van-steps>
      </div>

      <!-- 订单信息 -->
      <div class="section">
        <div class="section-title">订单信息</div>
        <div class="info-row">
          <span class="info-label">订单号</span>
          <span class="info-value copyable" @click="copyOrderNo">
            {{ order.orderNo }}
            <van-icon name="copy-o" size="14" color="#FF6034" />
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">就餐方式</span>
          <span class="info-value">{{ order.orderTypeText }}</span>
        </div>
        <div v-if="order.tableNo" class="info-row">
          <span class="info-label">桌号</span>
          <span class="info-value">{{ order.tableNo }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">下单时间</span>
          <span class="info-value">{{ formatTime(order.createdAt) }}</span>
        </div>
      </div>

      <!-- 菜品列表 -->
      <div class="section">
        <div class="section-title">已点菜品</div>
        <div v-for="item in order.items" :key="item.id" class="order-item">
          <img v-if="item.dishImage" :src="item.dishImage" class="item-img" />
          <div v-else class="item-img-placeholder"></div>
          <div class="item-name">
            {{ item.dishName }}
            <span v-if="item.specName" class="item-spec">（{{ item.specName }}）</span>
            <div v-if="item.remark" class="item-remark">备注：{{ item.remark }}</div>
          </div>
          <div class="item-right">
            <div class="item-price">¥{{ Number(item.price).toFixed(2) }}</div>
            <div class="item-qty">×{{ item.quantity }}</div>
          </div>
        </div>
      </div>

      <!-- 费用 -->
      <div class="section fee-section">
        <div class="fee-row">
          <span>商品合计</span>
          <span>¥{{ order.totalAmount }}</span>
        </div>
        <div v-if="order.deliveryFee > 0" class="fee-row">
          <span>配送费</span>
          <span>¥{{ order.deliveryFee }}</span>
        </div>
        <div v-if="order.discountAmount > 0" class="fee-row green">
          <span>优惠减免</span>
          <span>-¥{{ order.discountAmount }}</span>
        </div>
        <div class="fee-row total">
          <span>实付金额</span>
          <span class="total-price">¥{{ order.payAmount }}</span>
        </div>
      </div>

      <!-- 备注 -->
      <div v-if="order.remark" class="section">
        <div class="info-row">
          <span class="info-label">备注</span>
          <span class="info-value">{{ order.remark }}</span>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="bottom-actions">
        <van-button plain round size="small" @click="$router.push('/menu')">继续点餐</van-button>
        <van-button
          v-if="order.status === 4"
          type="primary"
          round
          size="small"
          style="background:#FF6034;border-color:#FF6034"
          @click="reorder"
        >
          再来一单
        </van-button>
      </div>
    </template>

    <van-empty v-else description="订单不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { io, Socket } from 'socket.io-client';
import { getOrder } from '@/api';
import { useCartStore } from '@/stores/cart';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const order = ref<any>(null);
const loading = ref(true);
let socket: Socket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const stepActive = computed(() => {
  const map: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 0 };
  return map[order.value?.status ?? 0];
});

const statusIcon = computed(() => {
  const icons: Record<number, string> = {
    0: 'clock-o', 1: 'clock-o', 2: 'fire-o', 3: 'checked', 4: 'smile-o', 5: 'close',
  };
  return icons[order.value?.status ?? 0];
});

onMounted(async () => {
  await loadOrder();
  connectWebSocket();
  // 降级轮询（每5秒）
  pollTimer = setInterval(loadOrder, 5000);
});

onUnmounted(() => {
  socket?.disconnect();
  if (pollTimer) clearInterval(pollTimer);
});

async function loadOrder() {
  const orderNo = route.params.orderNo as string;
  try {
    const data: any = await getOrder(orderNo);
    order.value = data;
  } catch {}
  loading.value = false;
}

function connectWebSocket() {
  const token = localStorage.getItem('customer_token');
  if (!token) return;

  socket = io('/ws', {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 3,
  });

  socket.on('connect', () => {
    socket!.emit('subscribe_order', route.params.orderNo);
  });

  socket.on('order_status_changed', (payload: any) => {
    if (order.value && payload.orderNo === order.value.orderNo) {
      order.value.status = payload.status;
      order.value.statusText = payload.statusText;
      order.value.estimatedMinutes = payload.estimatedMinutes;
      // 停止轮询
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }
  });
}

function formatTime(t: string) {
  return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
}

function copyOrderNo() {
  navigator.clipboard.writeText(order.value?.orderNo || '');
  showToast('已复制订单号');
}

function reorder() {
  if (!order.value?.items) return;
  cartStore.clearCart();
  order.value.items.forEach((item: any) => {
    cartStore.addItem({
      dishId: item.dishId,
      dishName: item.dishName,
      dishImage: item.dishImage,
      price: item.price,
      specName: item.specName,
      quantity: item.quantity,
    });
  });
  router.push('/menu');
}
</script>

<style scoped>
.order-page { background: #111; min-height: 100vh; padding-bottom: 80px; color: #eee; }
.loading-wrap { display: flex; justify-content: center; padding: 60px; }
:deep(.van-nav-bar) { background: #1a1a1a !important; }
:deep(.van-nav-bar .van-nav-bar__title) { color: #eee !important; }
:deep(.van-nav-bar .van-icon) { color: #eee !important; }
.status-banner { padding: 24px 20px; display: flex; align-items: center; gap: 16px; color: white; transition: background 0.5s; }
.status-0, .status-1 { background: linear-gradient(135deg, #f5a623, #f7c948); }
.status-2 { background: linear-gradient(135deg, #FF5722, #ff8c42); }
.status-3 { background: linear-gradient(135deg, #07C160, #39d070); }
.status-4 { background: linear-gradient(135deg, #576B95, #7b8fc4); }
.status-5 { background: linear-gradient(135deg, #555, #777); }
.status-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.status-text { font-size: 20px; font-weight: 700; }
.status-sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
.progress-wrap { background: #1a1a1a; padding: 16px; margin: 8px 0; }
:deep(.van-steps) { background: transparent !important; }
:deep(.van-step__title) { color: #999 !important; }
:deep(.van-step--finish .van-step__title) { color: #FF5722 !important; }
.section { background: #1a1a1a; padding: 16px; margin: 8px 0; }
.section-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #eee; }
.info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #252525; font-size: 14px; }
.info-label { color: #666; }
.info-value { color: #ccc; display: flex; align-items: center; gap: 4px; }
.copyable { cursor: pointer; }
.order-item { display: flex; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #252525; gap: 10px; }
.item-img { width: 52px; height: 52px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.item-img-placeholder { width: 52px; height: 52px; border-radius: 6px; background: #2a2a2a; flex-shrink: 0; }
.item-name { flex: 1; font-size: 14px; font-weight: 500; line-height: 1.4; color: #ccc; }
.item-spec { color: #666; font-size: 12px; }
.item-remark { color: #555; font-size: 12px; margin-top: 2px; }
.item-right { text-align: right; }
.item-price { font-size: 14px; color: #eee; font-weight: 500; }
.item-qty { font-size: 12px; color: #666; margin-top: 2px; }
.fee-section { padding: 12px 16px; }
.fee-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #999; }
.fee-row.green { color: #07C160; }
.fee-row.total { border-top: 1px solid #333; margin-top: 6px; padding-top: 10px; font-weight: 600; font-size: 15px; color: #eee; }
.total-price { color: #FF5722; font-size: 18px; font-weight: 700; }
.bottom-actions { display: flex; justify-content: center; gap: 12px; padding: 20px; }
:deep(.van-button--default) { background: transparent !important; border-color: #3a3a3a !important; color: #999 !important; }
:deep(.van-button--primary) { background: transparent !important; border-color: #FF5722 !important; color: #FF5722 !important; }
:deep(.van-steps) { background: transparent !important; }
:deep(.van-step__circle) { background: #FF5722 !important; border-color: #FF5722 !important; }
:deep(.van-step__line) { background: #333 !important; }
:deep(.van-step--finish .van-step__circle) { background: #FF5722 !important; }
:deep(.van-step--finish .van-step__line) { background: #FF5722 !important; }
:deep(.van-step--process .van-step__icon) { background: #FF5722 !important; color: white !important; border: none !important; }
:deep(.van-step__title) { color: #666 !important; font-size: 12px !important; }
:deep(.van-step--finish .van-step__title) { color: #FF5722 !important; }
:deep(.van-step--process .van-step__title) { color: #FF5722 !important; }
:deep(.van-icon-checked) { color: white !important; }
</style>