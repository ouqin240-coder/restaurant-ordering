<template>
  <div class="orders-page">
    <!-- 顶部 Tab + 筛选 -->
    <div class="toolbar">
      <el-tabs v-model="activeTab" @tab-change="onTabChange" class="order-tabs">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.value"
          :label="tab.label"
          :name="tab.value"
        >
          <template #label>
            <span class="tab-label">
              {{ tab.label }}
              <el-badge
                v-if="tab.count > 0"
                :value="tab.count"
                :type="tab.value === 'pending' ? 'danger' : 'primary'"
                class="tab-badge"
              />
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <div class="toolbar-right">
        <el-date-picker
          v-model="filterDate"
          type="date"
          placeholder="筛选日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          clearable
          size="small"
          @change="loadOrders"
        />
        <el-select v-model="filterType" placeholder="就餐方式" size="small" clearable @change="loadOrders" style="width:110px">
          <el-option label="全部" :value="undefined" />
          <el-option label="堂食" :value="1" />
          <el-option label="外卖" :value="2" />
        </el-select>
        <el-button type="primary" size="small" :icon="Refresh" @click="loadOrders">刷新</el-button>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="orders-grid" v-loading="orderStore.loading">
      <div v-if="orderStore.orders.length === 0" class="empty-state">
        <el-empty :description="activeTab === 'pending' ? '暂无待确认订单' : '暂无订单'" />
      </div>

      <transition-group name="order-list" tag="div" class="order-cards">
        <order-card
          v-for="order in orderStore.orders"
          :key="order.id"
          :order="order"
          @accept="openAcceptDialog(order)"
          @reject="openRejectDialog(order)"
          @ready="markReady(order)"
          @complete="markComplete(order)"
        />
      </transition-group>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="orderStore.page"
        v-model:page-size="orderStore.pageSize"
        :total="orderStore.total"
        layout="total, prev, pager, next"
        background
        @current-change="loadOrders"
      />
    </div>

    <!-- 接单弹窗 -->
    <el-dialog v-model="showAcceptDialog" title="确认接单" width="400px">
      <div class="accept-form">
        <p style="margin-bottom:16px;color:#666">
          {{ currentOrder?.orderType === 1 ? '桌号' : '订单' }}：<strong>{{ currentOrder?.orderType === 1 ? (currentOrder?.tableNo || '-') : '🛵 外卖订单' }}</strong> ·
          金额：<strong>¥{{ currentOrder?.payAmount }}</strong>
        </p>
        <el-form-item label="预计制作时长（分钟）">
          <el-input-number
            v-model="estimatedMinutes"
            :min="5"
            :max="120"
            :step="5"
            controls-position="right"
          />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="showAcceptDialog = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmAccept">确认接单</el-button>
      </template>
    </el-dialog>

    <!-- 拒单弹窗 -->
    <el-dialog v-model="showRejectDialog" title="拒单原因" width="400px">
      <el-form>
        <el-form-item label="请选择拒单原因">
          <el-radio-group v-model="rejectReason" style="flex-direction:column;align-items:flex-start;gap:8px">
            <el-radio label="食材不足，无法制作">食材不足，无法制作</el-radio>
            <el-radio label="餐厅已打烊，无法接单">餐厅已打烊，无法接单</el-radio>
            <el-radio label="订单信息有误">订单信息有误</el-radio>
            <el-radio label="other">其他原因</el-radio>
          </el-radio-group>
          <el-input
            v-if="rejectReason === 'other'"
            v-model="customRejectReason"
            type="textarea"
            placeholder="请输入原因"
            :rows="2"
            style="margin-top:8px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmReject">确认拒单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { useOrderStore } from '@/stores/orders';
import OrderCard from '@/components/OrderCard.vue';

const orderStore = useOrderStore();
const activeTab = ref('pending');
const filterDate = ref('');
const filterType = ref<number | undefined>(undefined);
const showAcceptDialog = ref(false);
const showRejectDialog = ref(false);
const currentOrder = ref<any>(null);
const estimatedMinutes = ref(20);
const rejectReason = ref('食材不足，无法制作');
const customRejectReason = ref('');
const actionLoading = ref(false);

const tabs = computed(() => [
  { label: '待确认', value: 'pending', status: 1, count: orderStore.pendingCount },
  { label: '制作中', value: 'preparing', status: 2, count: orderStore.preparingCount },
  { label: '待取/配送', value: 'ready', status: 3, count: orderStore.readyCount },
  { label: '已完成', value: 'completed', status: 4, count: 0 },
  { label: '全部', value: 'all', status: undefined, count: 0 },
]);

onMounted(() => {
  loadOrders();
  orderStore.connectWebSocket();
  // 每30秒刷新
  const timer = setInterval(loadOrders, 30000);
  onUnmounted(() => clearInterval(timer));
});

onUnmounted(() => {
  orderStore.disconnectWebSocket();
});

function onTabChange(tab: string) {
  const found = tabs.value.find((t) => t.value === tab);
  orderStore.currentStatus = found?.status;
  orderStore.page = 1;
  loadOrders();
}

async function loadOrders() {
  await orderStore.fetchOrders({
    date: filterDate.value || undefined,
    orderType: filterType.value,
  });
  // 同步刷新各状态计数，badge 立刻更新
  orderStore.fetchCounts();
}

function openAcceptDialog(order: any) {
  currentOrder.value = order;
  estimatedMinutes.value = 20;
  showAcceptDialog.value = true;
}

async function confirmAccept() {
  actionLoading.value = true;
  try {
    await orderStore.accept(currentOrder.value.id, estimatedMinutes.value);
    showAcceptDialog.value = false;
  } finally {
    actionLoading.value = false;
  }
}

function openRejectDialog(order: any) {
  currentOrder.value = order;
  rejectReason.value = '食材不足，无法制作';
  customRejectReason.value = '';
  showRejectDialog.value = true;
}

async function confirmReject() {
  const reason = rejectReason.value === 'other' ? customRejectReason.value : rejectReason.value;
  if (!reason.trim()) { ElMessage.warning('请填写拒单原因'); return; }
  actionLoading.value = true;
  try {
    await orderStore.reject(currentOrder.value.id, reason);
    showRejectDialog.value = false;
  } finally {
    actionLoading.value = false;
  }
}

async function markReady(order: any) {
  const label = order.orderType === 1 ? `桌号 ${order.tableNo}` : '🛵 外卖订单';
  await ElMessageBox.confirm(`确认「${label}」出餐完成？`, '出餐确认', {
    confirmButtonText: '确认出餐',
    cancelButtonText: '取消',
    type: 'success',
  });
  await orderStore.updateStatus(order.id, 3);
  ElMessage.success('已标记出餐');
}

async function markComplete(order: any) {
  await orderStore.updateStatus(order.id, 4);
  ElMessage.success('订单已完成');
}
</script>

<style scoped>
.orders-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f6fa;
}

.toolbar {
  background: white;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.order-tabs {
  flex: 1;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.orders-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.order-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  align-items: start;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px;
}

.pagination-wrap {
  background: white;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #eee;
}

.order-list-enter-active {
  transition: all 0.4s ease;
}
.order-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.order-list-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}
.order-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
