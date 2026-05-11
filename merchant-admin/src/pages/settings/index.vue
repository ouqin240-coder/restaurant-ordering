<template>
  <div class="settings-page">
    <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs">

      <!-- 基础设置 -->
      <el-tab-pane label="基础设置" name="basic">
        <div class="tab-content">
          <h3 class="section-title">店铺信息</h3>
          <el-form :model="shopForm" label-width="120px" style="max-width:560px">
            <el-form-item label="店铺名称">
              <el-input v-model="shopForm.name" placeholder="请输入店铺名称" />
            </el-form-item>
            <el-form-item label="营业状态">
              <el-switch
                v-model="shopForm.isOpen"
                active-text="营业中"
                inactive-text="已打烊"
                active-color="#67C23A"
                inactive-color="#F56C6C"
              />
            </el-form-item>
            <el-form-item label="营业时间">
              <div style="display:flex;align-items:center;gap:8px">
                <el-time-select v-model="shopForm.openTime" placeholder="开店" style="width:120px"
                  start="06:00" step="00:30" end="14:00" />
                <span>至</span>
                <el-time-select v-model="shopForm.closeTime" placeholder="关店" style="width:120px"
                  start="16:00" step="00:30" end="26:00" />
              </div>
            </el-form-item>
            <el-form-item label="店铺公告">
              <el-input
                v-model="shopForm.announcement"
                type="textarea"
                :rows="3"
                placeholder="展示在点餐首页的公告内容（选填）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="自动接单">
              <el-switch v-model="shopForm.autoAccept" active-text="开启" inactive-text="关闭" />
              <span style="margin-left:10px;font-size:12px;color:#999">开启后新订单将自动接单，无需手动确认</span>
            </el-form-item>
            <el-form-item label="默认制作时长">
              <el-input-number v-model="shopForm.defaultPrepareMinutes" :min="5" :max="120" :step="5" />
              <span style="margin-left:8px;color:#999;font-size:12px">分钟</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveBasic">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 外卖设置 -->
      <el-tab-pane label="外卖配置" name="delivery">
        <div class="tab-content">
          <h3 class="section-title">外卖配送设置</h3>
          <el-form :model="shopForm" label-width="120px" style="max-width:560px">
            <el-form-item label="起送金额（元）">
              <el-input-number v-model="shopForm.minDeliveryAmount" :min="0" :precision="2" :step="5" />
              <span style="margin-left:8px;color:#999;font-size:12px">0 表示无起送金额限制</span>
            </el-form-item>
            <el-form-item label="配送费（元）">
              <el-input-number v-model="shopForm.deliveryFee" :min="0" :precision="2" :step="1" />
            </el-form-item>
            <el-form-item label="配送范围（米）">
              <el-input-number v-model="shopForm.deliveryRadius" :min="500" :max="50000" :step="500" />
              <span style="margin-left:8px;color:#999;font-size:12px">超出范围的地址不可下单</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveBasic">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 优惠券 -->
      <el-tab-pane label="优惠券管理" name="coupons">
        <div class="tab-content">
          <div class="section-header">
            <h3 class="section-title">优惠券</h3>
            <div>
              <el-button v-if="selectedCouponIds.length > 0" type="danger" size="small" @click="batchDeleteCoupons">
                删除选中 ({{ selectedCouponIds.length }})
              </el-button>
              <el-button type="primary" size="small" :icon="Plus" @click="showCouponDialog = true">批量生成</el-button>
            </div>
          </div>

          <el-table :data="coupons.list" stripe @selection-change="onCouponSelectionChange" style="width:100%">
            <el-table-column type="selection" width="40" />
            <el-table-column label="批次名称" min-width="130">
              <template #default="{ row }">
                {{ row.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="code" label="券码" min-width="110">
              <template #default="{ row }">
                <el-tag type="info" effect="plain" size="small">{{ row.code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="面额" min-width="75">
              <template #default="{ row }">
                <span style="color:#FF6034;font-weight:700">¥{{ row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="使用条件" min-width="100">
              <template #default="{ row }">
                {{ row.minAmount > 0 ? `满¥${row.minAmount}可用` : '无门槛' }}
              </template>
            </el-table-column>
            <el-table-column label="有效期" min-width="100">
              <template #default="{ row }">
                {{ row.expiredAt ? formatDate(row.expiredAt) : '永久有效' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="75" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isUsed ? 'info' : 'success'" size="small">
                  {{ row.isUsed ? '已使用' : '未使用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="65" align="center">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="deleteSingleCoupon(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="couponPage"
            :total="coupons.total"
            :page-size="20"
            layout="total, prev, pager, next"
            style="margin-top:16px;justify-content:flex-end;display:flex"
            @current-change="loadCoupons"
          />
        </div>
      </el-tab-pane>


    </el-tabs>

    <!-- 满减规则表单 -->
    <el-dialog v-model="showPromoDialog" :title="editingPromo ? '编辑满减规则' : '新增满减规则'" width="440px">
      <el-form :model="promoForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="promoForm.name" placeholder="如：满50减5" />
        </el-form-item>
        <el-form-item label="满足金额">
          <el-input-number v-model="promoForm.threshold" :min="0" :precision="2" :step="10" />
          <span style="margin-left:6px">元</span>
        </el-form-item>
        <el-form-item label="减免金额">
          <el-input-number v-model="promoForm.value" :min="0" :precision="2" :step="1" />
          <span style="margin-left:6px">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPromoDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePromo">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成优惠券 -->
    <el-dialog v-model="showCouponDialog" title="批量生成优惠券" width="440px">
      <el-form :model="couponForm" label-width="100px">
        <el-form-item label="批次名称">
          <el-input v-model="couponForm.name" placeholder="如：新人立减5元（顾客领券中心可见）" />
        </el-form-item>
        <el-form-item label="生成数量">
          <el-input-number v-model="couponForm.count" :min="1" :max="500" />
          <span style="margin-left:6px;font-size:12px;color:#999">张</span>
        </el-form-item>
        <el-form-item label="面额">
          <el-input-number v-model="couponForm.amount" :min="1" :precision="2" :step="5" />
          <span style="margin-left:6px">元</span>
        </el-form-item>
        <el-form-item label="最低使用">
          <el-input-number v-model="couponForm.minAmount" :min="0" :precision="2" :step="10" />
          <span style="margin-left:6px">元（0表示无门槛）</span>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="couponForm.expiredAt"
            type="date"
            placeholder="不选则永久有效"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCouponDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="generateCoupons">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import * as api from '@/api';

const activeTab = ref('basic');
const saving = ref(false);
const shopForm = ref<any>({
  name: '美味餐厅',
  isOpen: true,
  openTime: '09:00',
  closeTime: '22:00',
  announcement: '',
  autoAccept: false,
  defaultPrepareMinutes: 20,
  minDeliveryAmount: 20,
  deliveryFee: 3,
  deliveryRadius: 5000,
  logoUrl: '',
  themeConfig: {
    primaryColor: '#FF6034',
    backgroundColor: '#f7f8fa',
    backgroundImage: '',
    categoryIcons: {},
  },
});

const categoriesList = ref<any[]>([]);

async function loadCategoriesForDIY() {
  try {
    const res: any = await api.default.get('/menu/categories-with-dishes');
    categoriesList.value = Array.isArray(res) ? res : (res.data || []);
  } catch (e) {
    console.error('加载分类失败', e);
  }
}

const promotions = ref<any[]>([]);
const showPromoDialog = ref(false);
const editingPromo = ref<any>(null);
const promoForm = ref({ name: '', threshold: 30, value: 5 });

const coupons = ref<any>({ list: [], total: 0 });
const couponPage = ref(1);
const showCouponDialog = ref(false);
const couponForm = ref({ name: '', count: 10, amount: 5, minAmount: 30, expiredAt: '' });
const selectedCouponIds = ref<number[]>([]);

function onCouponSelectionChange(rows: any[]) {
  selectedCouponIds.value = rows.map((r) => r.id);
}

async function deleteSingleCoupon(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除券码「${row.code}」？`, '删除确认', { type: 'warning' });
    await api.default.post('/merchant/settings/coupons/batch-delete', { ids: [row.id] });
    ElMessage.success('已删除');
    await loadCoupons();
  } catch {}
}

async function batchDeleteCoupons() {
  if (selectedCouponIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedCouponIds.value.length} 张优惠券？此操作不可撤销。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    );
    await api.default.post('/merchant/settings/coupons/batch-delete', { ids: selectedCouponIds.value });
    ElMessage.success(`已删除 ${selectedCouponIds.value.length} 张优惠券`);
    selectedCouponIds.value = [];
    await loadCoupons();
  } catch {
    // 用户取消
  }
}

onMounted(async () => {
  await Promise.all([loadSettings(), loadPromotions(), loadCoupons(), loadCategoriesForDIY()]);
});

async function loadSettings() {
  const data: any = await api.default.get('/merchant/settings');
  // 保留默认 themeConfig 结构
  const defaultTheme = { primaryColor: '#FF6034', backgroundColor: '#f7f8fa', backgroundImage: '', categoryIcons: {} };
  Object.assign(shopForm.value, data);
  // 确保布尔值正确（数据库返回 0/1）
  shopForm.value.autoAccept = !!data.autoAccept;
  shopForm.value.isOpen = data.isOpen !== false && data.isOpen !== 0;
  shopForm.value.themeConfig = Object.assign({}, defaultTheme, data.themeConfig || {});
}

async function saveBasic() {
  saving.value = true;
  try {
    await api.default.put('/merchant/settings', shopForm.value);
    ElMessage.success('设置已保存');
  } finally {
    saving.value = false;
  }
}

async function loadPromotions() {
  promotions.value = await api.default.get('/merchant/settings/promotions') as any[] || [];
}

function openPromoForm(promo?: any) {
  editingPromo.value = promo || null;
  promoForm.value = promo
    ? { name: promo.name, threshold: promo.threshold, value: promo.value }
    : { name: '', threshold: 30, value: 5 };
  showPromoDialog.value = true;
}

async function savePromo() {
  saving.value = true;
  try {
    if (editingPromo.value) {
      await api.default.put(`/merchant/settings/promotions/${editingPromo.value.id}`, promoForm.value);
    } else {
      await api.default.post('/merchant/settings/promotions', { ...promoForm.value, type: 'full_minus' });
    }
    ElMessage.success('保存成功');
    showPromoDialog.value = false;
    loadPromotions();
  } finally {
    saving.value = false;
  }
}

async function togglePromo(id: number, isActive: boolean) {
  await api.default.put(`/merchant/settings/promotions/${id}`, { isActive });
  ElMessage.success(isActive ? '已启用' : '已禁用');
  loadPromotions();
}

async function deletePromo(id: number) {
  await ElMessageBox.confirm('确认删除此满减规则？', '提示', { type: 'warning' });
  await api.default.delete(`/merchant/settings/promotions/${id}`);
  ElMessage.success('已删除');
  loadPromotions();
}

async function loadCoupons() {
  const res: any = await api.default.get('/merchant/settings/coupons', { params: { page: couponPage.value } });
  coupons.value = res.list ? res : (res.data || {list:[],total:0});
}

async function generateCoupons() {
  saving.value = true;
  try {
    const res: any = await api.default.post('/merchant/settings/coupons/batch', couponForm.value);
    ElMessage.success(`成功生成 ${res.created || couponForm.value.count} 张优惠券`);
    showCouponDialog.value = false;
    loadCoupons();
  } finally {
    saving.value = false;
  }
}

function formatDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD');
}
</script>

<style scoped>
.diy-preview {
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  max-width: 380px;
  min-height: 240px;
}
.diy-preview-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}
.diy-preview-logo, .diy-preview-logo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  object-fit: cover;
  flex-shrink: 0;
}
.diy-preview-name {
  font-size: 17px;
  font-weight: 700;
}
.diy-preview-announcement {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}
.diy-preview-body {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.diy-preview-cat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.85);
  border-radius: 16px;
  font-size: 13px;
  color: #333;
}
.settings-page {
  height: 100%;
  background: #f5f6fa;
}

.settings-tabs {
  height: 100%;
}

:deep(.el-tabs__content) {
  height: 100%;
  overflow-y: auto;
}

:deep(.el-tab-pane) {
  height: 100%;
}

.tab-content {
  padding: 24px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header .section-title {
  margin-bottom: 0;
}
</style>
