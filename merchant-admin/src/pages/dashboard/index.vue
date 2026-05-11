<template>
  <div class="dashboard">
    <!-- 今日概览卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="card in statCards" :key="card.key">
        <div class="stat-card" :style="{ borderTop: `4px solid ${card.color}` }">
          <div class="stat-icon" :style="{ background: card.color + '20', color: card.color }">
            <el-icon size="22"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
          <div v-if="card.growth !== null" class="stat-growth" :class="parseFloat(card.growth) >= 0 ? 'up' : 'down'">
            {{ parseFloat(card.growth) >= 0 ? '↑' : '↓' }} {{ Math.abs(parseFloat(card.growth)) }}%
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <!-- 营收趋势折线图 -->
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">营收趋势</span>
            <el-radio-group v-model="trendType" size="small" @change="loadTrend">
              <el-radio-button label="day">一周</el-radio-button>
              <el-radio-button label="week">一个月</el-radio-button>
              <el-radio-button label="month">一个季度</el-radio-button>
              <el-radio-button label="year">一年</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChartEl" class="chart-body"></div>
        </div>
      </el-col>

      <!-- 菜品销量排行 -->
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">本周菜品热销榜</span>
          </div>
          <div class="dish-rank-list">
            <div v-for="(dish, i) in dishRank" :key="dish.dishName" class="rank-item">
              <span class="rank-no" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
              <img v-if="dish.dishImage" :src="dish.dishImage" class="rank-img" />
              <div v-else class="rank-img-placeholder"></div>
              <div class="rank-info">
                <div class="rank-name">{{ dish.dishName }}</div>
                <el-progress
                  :percentage="Math.round((parseInt(dish.totalQty) / maxQty) * 100)"
                  :color="['#FF6034', '#FF8C42', '#F5B942', '#A8D5A2', '#7FAECC'][i] || '#ddd'"
                  :show-text="false"
                  :stroke-width="6"
                />
              </div>
              <span class="rank-qty">{{ dish.totalQty }}份</span>
            </div>
            <div v-if="dishRank.length === 0" class="rank-empty">暂无数据</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Wallet, ShoppingBag, Tickets, DataAnalysis } from '@element-plus/icons-vue';
import { getOverview, getDishRank, getRevenueTrend } from '@/api';
import dayjs from 'dayjs';

const overview = ref<any>({});
const dishRank = ref<any[]>([]);
const trendData = ref<any[]>([]);
const trendType = ref<'day' | 'week' | 'month' | 'year'>('day');
const trendChartEl = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const maxQty = computed(() =>
  Math.max(...dishRank.value.map((d) => parseInt(d.totalQty) || 0), 1)
);

const statCards = computed(() => [
  {
    key: 'revenue', label: '今日营业额', icon: Wallet, color: '#FF6034',
    value: `¥${(overview.value.revenue || 0).toFixed(2)}`,
    growth: overview.value.revenueGrowth,
  },
  {
    key: 'orders', label: '今日订单', icon: ShoppingBag, color: '#409EFF',
    value: overview.value.orderCount || 0,
    growth: overview.value.orderCountGrowth,
  },
  {
    key: 'avg', label: '客单价', icon: Tickets, color: '#67C23A',
    value: `¥${(overview.value.avgAmount || 0).toFixed(2)}`,
    growth: null,
  },
  {
    key: 'pending', label: '待处理订单', icon: DataAnalysis, color: '#E6A23C',
    value: overview.value.pendingCount || 0,
    growth: null,
  },
]);

onMounted(async () => {
  await Promise.all([loadOverview(), loadDishRank(), loadTrend()]);
});

async function loadOverview() {
  overview.value = await getOverview() as any;
}

async function loadDishRank() {
  const end = dayjs().format('YYYY-MM-DD');
  const start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  dishRank.value = (await getDishRank({ startDate: start, endDate: end })) as any[];
}

async function loadTrend() {
  const countMap: any = { day: 7, week: 30, month: 90, year: 365 };
  trendData.value = (await getRevenueTrend(trendType.value, countMap[trendType.value])) as any[];
  await nextTick();
  renderChart();
}

function renderChart() {
  if (!trendChartEl.value) return;
  if (!chart) {
    chart = echarts.init(trendChartEl.value);
  }
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>营业额：¥${parseFloat(p.value).toFixed(2)}<br/>订单数：${params[1]?.value || 0}`;
      },
    },
    legend: { data: ['营业额', '订单数'], top: 0 },
    grid: { left: 60, right: 60, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trendData.value.map((d) => d.date),
      axisLine: { lineStyle: { color: '#eee' } },
    },
    yAxis: [
      { type: 'value', name: '营业额(¥)', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f5f5f5' } } },
      { type: 'value', name: '订单数', axisLine: { show: false }, minInterval: 1 },
    ],
    series: [
      {
        name: '营业额',
        type: 'line',
        data: trendData.value.map((d) => parseFloat(d.revenue) || 0),
        smooth: true,
        lineStyle: { color: '#FF6034', width: 3 },
        itemStyle: { color: '#FF6034' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,96,52,0.3)' }, { offset: 1, color: 'rgba(255,96,52,0)' }] } },
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: trendData.value.map((d) => parseInt(d.orderCount) || 0),
        itemStyle: { color: '#409EFF44', borderRadius: [4, 4, 0, 0] },
      },
    ],
  });
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: #f5f6fa;
  min-height: 100%;
}

.stat-cards {
  margin-bottom: 16px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: relative;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

.stat-growth {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.stat-growth.up {
  color: #67C23A;
  background: #f0f9eb;
}

.stat-growth.down {
  color: #F56C6C;
  background: #fef0f0;
}

.chart-row {}

.chart-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  height: 520px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.chart-body {
  flex: 1;
}

.dish-rank-list {
  flex: 1;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f8f8f8;
}

.rank-no {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-1 { background: #FF6034; color: white; }
.rank-2 { background: #FF8C42; color: white; }
.rank-3 { background: #F5B942; color: white; }

.rank-img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.rank-img-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #f5f5f5;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-qty {
  font-size: 13px;
  font-weight: 600;
  color: #FF6034;
  white-space: nowrap;
}

.rank-empty {
  text-align: center;
  color: #ccc;
  padding: 30px;
  font-size: 13px;
}
</style>
