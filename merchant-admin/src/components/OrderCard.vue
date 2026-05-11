<template>
  <div class="order-card" :class="`status-${order.status}`">
    <!-- 卡片头 -->
    <div class="card-header">
      <div class="header-left">
        <span class="order-type-tag" :class="order.orderType === 1 ? 'dine-in' : 'delivery'">
          {{ order.orderType === 1 ? '🍽 堂食' : '🛵 外卖' }}
        </span>
        <span v-if="order.tableNo" class="table-no">{{ order.tableNo }} 桌</span>
      </div>
      <div class="header-right">
        <el-tag :type="statusTagType" size="small" effect="dark">{{ statusText }}</el-tag>
        <span class="order-time">{{ formatTime(order.createdAt) }}</span>
      </div>
    </div>

    <!-- 菜品列表 -->
    <div class="item-list">
      <div v-for="item in order.items" :key="item.id" class="item-row">
        <span class="item-name">
          {{ item.dishName }}
          <span v-if="item.specName" class="item-spec">（{{ item.specName }}）</span>
        </span>
        <span class="item-price">¥{{ Number(item.price).toFixed(2) }}</span>
        <span class="item-qty">×{{ item.quantity }}</span>
      </div>
      <div v-if="order.remark" class="order-remark">
        <el-icon><ChatLineRound /></el-icon>
        备注：{{ order.remark }}
      </div>
    </div>

    <!-- 金额区 -->
    <div class="card-footer">
      <!-- 价格明细：有优惠/配送费时显示 -->
      <div v-if="Number(order.discountAmount) > 0 || Number(order.deliveryFee) > 0" class="price-detail">
        <div class="price-row">
          <span>商品合计</span>
          <span>¥{{ Number(order.totalAmount).toFixed(2) }}</span>
        </div>
        <div v-if="Number(order.deliveryFee) > 0" class="price-row">
          <span>配送费</span>
          <span>+¥{{ Number(order.deliveryFee).toFixed(2) }}</span>
        </div>
        <div v-if="Number(order.discountAmount) > 0" class="price-row discount">
          <span>🎟 优惠券抵扣</span>
          <span>-¥{{ Number(order.discountAmount).toFixed(2) }}</span>
        </div>
      </div>

      <div class="amount-info">
        <span class="order-no">{{ order.orderNo }}</span>
        <span class="total-label">实付</span>
        <span class="total-amount">¥{{ Number(order.payAmount).toFixed(2) }}</span>
      </div>

      <!-- 操作按钮：根据状态显示 -->
      <div class="action-btns">
        <!-- 待确认 -->
        <template v-if="order.status === 1">
          <el-button size="small" type="danger" plain @click="$emit('reject', order)">拒单</el-button>
          <el-button size="small" type="success" @click="$emit('accept', order)">
            <el-icon><Check /></el-icon>接单
          </el-button>
        </template>

        <!-- 制作中 -->
        <template v-else-if="order.status === 2">
          <div class="preparing-info">
            <el-icon class="spin"><Loading /></el-icon>
            制作中
            <span v-if="order.estimatedMinutes" class="eta">约 {{ order.estimatedMinutes }} 分钟</span>
          </div>
          <el-button size="small" type="primary" @click="$emit('ready', order)">出餐完成</el-button>
        </template>

        <!-- 待取/配送 -->
        <template v-else-if="order.status === 3">
          <span class="ready-hint">
            {{ order.orderType === 1 ? '⏳ 等待顾客取餐' : '🚴 配送中' }}
          </span>
          <el-button size="small" type="info" plain @click="$emit('complete', order)">标记完成</el-button>
        </template>

        <!-- 已完成 -->
        <template v-else-if="order.status === 4">
          <span class="done-hint">✅ 已完成 {{ formatTime(order.finishedAt) }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check, Loading, ChatLineRound } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const props = defineProps<{ order: any }>();
defineEmits(['accept', 'reject', 'ready', 'complete']);

const statusText = computed(() => {
  const map: Record<number, string> = {
    1: '待确认', 2: '制作中', 3: '待取/配送', 4: '已完成', 5: '已取消',
  };
  return map[props.order.status] || '-';
});

const statusTagType = computed(() => {
  const map: Record<number, string> = {
    1: 'warning', 2: 'primary', 3: 'success', 4: 'info', 5: 'danger',
  };
  return map[props.order.status] || 'info';
});

function formatTime(t: string) {
  if (!t) return '-';
  const d = dayjs(t);
  const today = dayjs().format('YYYY-MM-DD');
  return d.format('YYYY-MM-DD') === today ? d.format('HH:mm') : d.format('MM-DD HH:mm');
}
</script>

<style scoped>
.order-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.order-card.status-1 {
  border-color: #E6A23C;
  box-shadow: 0 2px 12px rgba(230,162,60,0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(230,162,60,0.2); }
  50% { box-shadow: 0 2px 20px rgba(230,162,60,0.4); }
}

.order-card.status-2 { border-color: #409EFF33; }
.order-card.status-4 { opacity: 0.75; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-type-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.order-type-tag.dine-in {
  background: #e8f4fd;
  color: #409EFF;
}

.order-type-tag.delivery {
  background: #fef0e6;
  color: #E6A23C;
}

.table-no {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-time {
  font-size: 12px;
  color: #bbb;
}

.item-list {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 14px;
}

.item-name {
  color: #333;
  font-weight: 500;
}

.item-spec {
  color: #999;
  font-size: 12px;
}

.item-price {
  font-size: 13px;
  color: #FF6034;
  font-weight: 600;
  margin-right: 8px;
  white-space: nowrap;
}

.item-qty {
  color: #666;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.order-remark {
  margin-top: 8px;
  font-size: 12px;
  color: #E6A23C;
  background: #fef9f0;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-footer {
  padding: 10px 16px;
}

.price-detail {
  padding: 8px 12px;
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 8px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
}
.price-row.discount {
  color: #FF6034;
  font-weight: 500;
}
.total-label {
  font-size: 12px;
  color: #999;
  margin-left: auto;
  margin-right: 4px;
}

.amount-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 11px;
  color: #ccc;
  font-family: monospace;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #FF6034;
}

.action-btns {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.preparing-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #409EFF;
  flex: 1;
}

.eta {
  color: #999;
  font-size: 12px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ready-hint {
  font-size: 13px;
  color: #67C23A;
  flex: 1;
}

.done-hint {
  font-size: 12px;
  color: #aaa;
}
</style>
