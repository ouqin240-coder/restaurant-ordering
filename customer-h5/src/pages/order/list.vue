<template>
  <div class="order-list-page">
    <van-nav-bar title="我的订单" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab" sticky color="#FF6034" title-active-color="#FF6034">
      <van-tab v-for="tab in tabs" :key="tab.value" :title="tab.label">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多订单了"
            @load="loadMore"
          >
            <div v-if="orders.length === 0 && !loading" class="empty-wrap">
              <div style="text-align:center;padding:60px 0;color:#555;font-size:14px">暂无{{ tab.label }}订单</div>
              <van-button round type="primary" size="small" style="background:#FF6034;border-color:#FF6034" @click="$router.push('/menu')">
                去点餐
              </van-button>
            </div>

            <div
              v-for="order in orders"
              :key="order.id"
              class="order-item-card"
              @click="$router.push(`/order/${order.orderNo}`)"
            >
              <!-- 卡片头 -->
              <div class="card-head">
                <div class="head-left">
                  <span class="order-type">{{ order.orderTypeText }}</span>
                  <span v-if="order.tableNo" class="table-no">{{ order.tableNo }}桌</span>
                </div>
                <span class="order-status" :class="`s${order.status}`">{{ order.statusText }}</span>
              </div>

              <!-- 菜品简览 -->
              <div class="items-preview">
                <div class="items-images">
                  <img
                    v-for="(item, idx) in order.items.slice(0, 3)"
                    :key="item.id"
                    :src="item.dishImage || '/placeholder.png'"
                    class="item-thumb"
                    :style="{ zIndex: 3 - idx, marginLeft: idx > 0 ? '-12px' : '0' }"
                  />
                </div>
                <div class="items-summary">
                  <div class="items-text">
                    {{ order.items.map((i: any) => i.dishName).slice(0, 3).join('、') }}
                    <span v-if="order.items.length > 3"> 等{{ order.items.length }}件</span>
                  </div>
                  <div class="order-time">{{ formatTime(order.createdAt) }}</div>
                </div>
                <div class="order-amount">
                  <span class="amount-label">共付</span>
                  <span class="amount-value">¥{{ order.payAmount }}</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="card-actions" @click.stop>
                <van-button
                  v-if="order.status === 4"
                  plain
                  round
                  size="small"
                  @click="reorder(order)"
                >
                  再来一单
                </van-button>
                <van-button
                  v-if="[1,2,3].includes(order.status)"
                  type="primary"
                  plain
                  round
                  size="small"
                  style="border-color:#FF6034;color:#FF6034"
                  @click="$router.push(`/order/${order.orderNo}`)"
                >
                  查看进度
                </van-button>
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getUserOrders } from '@/api';
import { useCartStore } from '@/stores/cart';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const router = useRouter();
const cartStore = useCartStore();

const activeTab = ref(0);
const orders = ref<any[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);

const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'done' },
];

watch(activeTab, () => {
  orders.value = [];
  page.value = 1;
  finished.value = false;
  loadMore();
});

function getStatusParam() {
  const tab = tabs[activeTab.value];
  if (tab.value === 'active') return 'active';   // 进行中: 1,2,3
  if (tab.value === 'done') return 'done';        // 已完成: 4,5
  return undefined;                                // 全部
}

async function loadMore() {
  if (finished.value) return;
  loading.value = true;
  try {
    const res: any = await getUserOrders(page.value, getStatusParam());
    const newOrders = res.list || [];
    orders.value.push(...newOrders);
    page.value++;
    if (orders.value.length >= res.total || newOrders.length === 0) {
      finished.value = true;
    }
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function onRefresh() {
  orders.value = [];
  page.value = 1;
  finished.value = false;
  await loadMore();
}

function formatTime(t: string) {
  const d = dayjs(t);
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const dateStr = d.format('YYYY-MM-DD');
  if (dateStr === today) return d.format('今天 HH:mm');
  if (dateStr === yesterday) return d.format('昨天 HH:mm');
  return d.format('MM月DD日 HH:mm');
}

function reorder(order: any) {
  cartStore.clearCart();
  order.items.forEach((item: any) => {
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
.order-list-page { min-height: 100vh; background: #111; }
:deep(.van-nav-bar) { background: #1a1a1a !important; }
:deep(.van-nav-bar .van-nav-bar__title) { color: #eee !important; }
:deep(.van-nav-bar .van-icon) { color: #eee !important; }
:deep(.van-tabs__nav) { background: #111 !important; }
:deep(.van-tab) { color: #777 !important; }
:deep(.van-tab--active) { color: #FF5722 !important; }
:deep(.van-tabs__line) { background: #FF5722 !important; }
.empty-wrap { padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 20px; color: #666; }
.order-item-card { background: #1a1a1a; margin: 10px 12px; border-radius: 12px; overflow: hidden; border: 1px solid #252525; cursor: pointer; transition: transform 0.2s; }
.order-item-card:active { transform: scale(0.98); }
.card-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px 8px; border-bottom: 1px solid #252525; }
.head-left { display: flex; align-items: center; gap: 8px; }
.order-type { font-size: 12px; color: #999; background: #252525; padding: 2px 8px; border-radius: 4px; }
.table-no { font-size: 13px; font-weight: 600; color: #eee; }
.order-status { font-size: 13px; font-weight: 600; }
.s1 { color: #E6A23C; } .s2 { color: #409EFF; } .s3 { color: #67C23A; } .s4 { color: #666; } .s5 { color: #F56C6C; }
.items-preview { display: flex; align-items: center; padding: 12px 14px; gap: 12px; }
.items-images { display: flex; position: relative; flex-shrink: 0; }
.item-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 2px solid #1a1a1a; position: relative; }
.items-summary { flex: 1; min-width: 0; }
.items-text { font-size: 13px; color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
.order-time { font-size: 12px; color: #666; }
.order-amount { text-align: right; flex-shrink: 0; }
.amount-label { font-size: 11px; color: #666; display: block; margin-bottom: 2px; }
.amount-value { font-size: 16px; font-weight: 700; color: #eee; }
.card-actions { display: flex; justify-content: flex-end; padding: 8px 14px 12px; gap: 10px; border-top: 1px solid #252525; }
:deep(.van-button--default) { background: transparent !important; border-color: #3a3a3a !important; color: #999 !important; font-size: 12px !important; height: 28px !important; padding: 0 14px !important; }
:deep(.van-button--primary) { background: transparent !important; border-color: #FF5722 !important; color: #FF5722 !important; font-size: 12px !important; height: 28px !important; padding: 0 14px !important; }
</style>