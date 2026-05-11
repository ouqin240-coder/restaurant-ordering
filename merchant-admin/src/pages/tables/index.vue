<template>
  <div class="tables-page">
    <div class="page-header">
      <div>
        <h2>桌台管理</h2>
        <p class="page-desc">管理餐厅桌位，生成专属二维码</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">添加桌台</el-button>
    </div>

    <!-- 状态概览 -->
    <el-row :gutter="16" class="status-cards">
      <el-col :span="6" v-for="s in statusStats" :key="s.label">
        <div class="status-card" :style="{ borderLeft: `4px solid ${s.color}` }">
          <span class="stat-num" :style="{ color: s.color }">{{ s.count }}</span>
          <span class="stat-lbl">{{ s.label }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 区域筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="activeArea" size="small">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button v-for="area in areas" :key="area" :label="area">{{ area }}</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 桌台网格 -->
    <div class="tables-grid" v-loading="loading">
      <div
        v-for="table in filteredTables"
        :key="table.id"
        class="table-card"
        :class="`status-${table.status}`"
      >
        <div class="table-status-dot"></div>
        <div class="table-no">{{ table.tableNo }}</div>
        <div class="table-area">{{ table.area || '未分区' }} · {{ table.capacity }}人</div>

        <div class="table-status-text">
          {{ statusLabels[table.status] }}
        </div>

        <div class="table-actions">
          <el-dropdown trigger="click" @command="(cmd: string) => handleCmd(cmd, table)">
            <el-button size="small" text :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="qrcode">
                  <el-icon><Crop /></el-icon> 查看/下载二维码
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="table.status !== 'free'"
                  command="free"
                >
                  <el-icon><CircleCheck /></el-icon> 标记为空闲
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="table.status !== 'cleaning'"
                  command="cleaning"
                >
                  <el-icon><Brush /></el-icon> 标记待清理
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon style="color:#F56C6C"><Delete /></el-icon>
                  <span style="color:#F56C6C">删除桌台</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredTables.length === 0" class="empty-tables">
        <el-empty description="暂无桌台，点击右上角添加" />
      </div>
    </div>

    <!-- 添加桌台对话框 -->
    <el-dialog v-model="showAddDialog" title="添加桌台" width="420px">
      <el-form :model="newTable" label-width="80px">
        <el-form-item label="桌号" required>
          <el-input v-model="newTable.tableNo" placeholder="如：A1、B3、VIP1" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="newTable.area" placeholder="如：A区、B区、包间" />
        </el-form-item>
        <el-form-item label="座位数">
          <el-input-number v-model="newTable.capacity" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="批量添加">
          <el-switch v-model="batchMode" active-text="批量模式" />
        </el-form-item>
        <el-form-item v-if="batchMode" label="数量">
          <el-input-number v-model="batchCount" :min="1" :max="50" />
          <span style="margin-left:8px;color:#999;font-size:12px">
            将创建 {{ newTable.tableNo }}1 ~ {{ newTable.tableNo }}{{ batchCount }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTable">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 二维码弹窗 -->
    <el-dialog v-model="showQrDialog" :title="`${qrTable?.tableNo} 桌二维码`" width="360px" align-center>
      <div class="qr-dialog-body">
        <div class="qr-box" ref="qrBoxRef">
          <div class="qr-title">{{ shopName }}</div>
          <div class="qr-placeholder">
            <img :src="qrCodeImg" class="qr-img" />
          </div>
          <div class="qr-table-no">{{ qrTable?.tableNo }} 桌</div>
          <div class="qr-area">{{ qrTable?.area }} · {{ qrTable?.capacity }}人桌</div>
        </div>
        <div class="qr-url">
          {{ qrUrl }}
        </div>
      </div>
      <template #footer>
        <el-button @click="showQrDialog = false">关闭</el-button>
        <el-button type="primary" :icon="Download" @click="downloadQr">下载二维码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MoreFilled, Crop, CircleCheck, Brush, Delete, Download } from '@element-plus/icons-vue';
import { getTables, createTable, updateTableStatus, deleteTable } from '@/api';

const tables = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const activeArea = ref('');
const showAddDialog = ref(false);
const showQrDialog = ref(false);
const qrTable = ref<any>(null);
const qrBoxRef = ref<HTMLElement | null>(null);
const batchMode = ref(false);
const batchCount = ref(5);
const shopName = ref('美味餐厅');

const newTable = ref({ tableNo: '', area: '', capacity: 4 });

const statusLabels: Record<string, string> = {
  free: '空闲',
  occupied: '使用中',
  cleaning: '待清理',
};

const statusColors: Record<string, string> = {
  free: '#67C23A',
  occupied: '#E6A23C',
  cleaning: '#909399',
};

const areas = computed(() => {
  const set = new Set(tables.value.map((t) => t.area).filter(Boolean));
  return [...set];
});

const filteredTables = computed(() =>
  activeArea.value ? tables.value.filter((t) => t.area === activeArea.value) : tables.value,
);

const statusStats = computed(() => [
  { label: '全部桌台', count: tables.value.length, color: '#409EFF' },
  { label: '空闲', count: tables.value.filter((t) => t.status === 'free').length, color: '#67C23A' },
  { label: '使用中', count: tables.value.filter((t) => t.status === 'occupied').length, color: '#E6A23C' },
  { label: '待清理', count: tables.value.filter((t) => t.status === 'cleaning').length, color: '#909399' },
]);

const qrUrl = computed(() => {
  if (!qrTable.value) return '';
  return `${window.location.origin}/?table=${qrTable.value.tableNo}`;
});

const qrCodeImg = computed(() => {
  if (!qrUrl.value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl.value)}`;
});

onMounted(loadTables);

async function loadTables() {
  loading.value = true;
  tables.value = (await getTables()) as any[];
  loading.value = false;
}

function openAddDialog() {
  newTable.value = { tableNo: '', area: '', capacity: 4 };
  batchMode.value = false;
  batchCount.value = 5;
  showAddDialog.value = true;
}

async function saveTable() {
  if (!newTable.value.tableNo.trim()) {
    ElMessage.warning('请输入桌号');
    return;
  }
  saving.value = true;
  try {
    if (batchMode.value) {
      for (let i = 1; i <= batchCount.value; i++) {
        await createTable({
          tableNo: `${newTable.value.tableNo}${i}`,
          area: newTable.value.area,
          capacity: newTable.value.capacity,
        });
      }
      ElMessage.success(`已批量创建 ${batchCount.value} 张桌台`);
    } else {
      await createTable(newTable.value);
      ElMessage.success('桌台已创建');
    }
    showAddDialog.value = false;
    loadTables();
  } finally {
    saving.value = false;
  }
}

async function handleCmd(cmd: string, table: any) {
  if (cmd === 'qrcode') {
    qrTable.value = table;
    showQrDialog.value = true;
  } else if (cmd === 'free' || cmd === 'cleaning') {
    await updateTableStatus(table.id, cmd);
    await loadTables();
    ElMessage.success('状态已更新');
  } else if (cmd === 'delete') {
    await ElMessageBox.confirm(`确认删除桌台「${table.tableNo}」？`, '删除确认', { type: 'warning' });
    await deleteTable(table.id);
    ElMessage.success('已删除');
    loadTables();
  }
}

function downloadQr() {
  if (!qrCodeImg.value || !qrTable.value) return;
  const a = document.createElement('a');
  a.href = qrCodeImg.value;
  a.download = `${qrTable.value.tableNo}-桌-二维码.png`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  ElMessage.success('开始下载，可打印贴在桌上');
}
</script>

<style scoped>
.tables-page {
  padding: 20px;
  background: #f5f6fa;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.page-desc {
  font-size: 13px;
  color: #999;
}

.status-cards {
  margin-bottom: 16px;
}

.status-card {
  background: white;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
}

.stat-lbl {
  font-size: 14px;
  color: #888;
}

.filter-bar {
  margin-bottom: 16px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.table-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform 0.2s;
  cursor: default;
}

.table-card:hover {
  transform: translateY(-2px);
}

.table-card.status-free {
  border-top: 3px solid #67C23A;
}

.table-card.status-occupied {
  border-top: 3px solid #E6A23C;
}

.table-card.status-cleaning {
  border-top: 3px solid #909399;
  opacity: 0.8;
}

.table-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 14px;
  left: 14px;
}

.status-free .table-status-dot { background: #67C23A; box-shadow: 0 0 0 3px #67c23a33; }
.status-occupied .table-status-dot { background: #E6A23C; box-shadow: 0 0 0 3px #e6a23c33; animation: blink 1.5s infinite; }
.status-cleaning .table-status-dot { background: #909399; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.table-no {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
  text-align: center;
  margin: 16px 0 4px;
}

.table-area {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 10px;
}

.table-status-text {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  margin: 0 auto 10px;
  display: inline-block;
  width: fit-content;
  left: 50%;
  position: relative;
  transform: translateX(-50%);
}

.status-free .table-status-text { background: #f0f9eb; color: #67C23A; }
.status-occupied .table-status-text { background: #fdf6ec; color: #E6A23C; }
.status-cleaning .table-status-text { background: #f4f4f5; color: #909399; }

.table-actions {
  position: absolute;
  top: 8px;
  right: 8px;
}

.empty-tables {
  grid-column: 1 / -1;
  padding: 60px;
  background: white;
  border-radius: 12px;
}

.qr-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qr-box {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  width: 260px;
}

.qr-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.qr-placeholder {
  width: 180px;
  height: 180px;
  margin: 0 auto 12px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-mock {
  text-align: center;
}

.qr-mock-inner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  width: 60px;
  margin: 0 auto 8px;
}

.qr-cell {
  width: 18px;
  height: 18px;
  background: #eee;
  border-radius: 2px;
}

.qr-cell.dark { background: #333; }

.qr-mock-hint {
  font-size: 11px;
  color: #999;
}

.qr-table-no {
  font-size: 22px;
  font-weight: 800;
}

.qr-area {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.qr-url {
  font-size: 11px;
  color: #999;
  word-break: break-all;
  text-align: center;
  max-width: 280px;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
}
</style>
