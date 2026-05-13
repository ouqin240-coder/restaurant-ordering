<template>
  <div class="dishes-page">
    <!-- 左侧分类栏 -->
    <div class="category-panel">
      <div class="panel-header">
        <span>菜品分类</span>
        <el-button :icon="Plus" size="small" circle @click="openCategoryForm()" />
      </div>
      <el-menu :default-active="String(activeCategoryId)" @select="onCategorySelect">
        <el-menu-item index="all">
          <span>全部菜品</span>
        </el-menu-item>
        <el-menu-item v-for="cat in categories" :key="cat.id" :index="String(cat.id)">
          <div class="category-menu-item">
            <span>{{ cat.name }}</span>
            <div class="cat-actions">
              <el-icon @click.stop="openCategoryForm(cat)"><Edit /></el-icon>
              <el-icon @click.stop="deleteCategory(cat)" style="color:#F56C6C"><Delete /></el-icon>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧菜品列表 -->
    <div class="dish-panel">
      <!-- 工具栏 -->
      <div class="dish-toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索菜品名称"
          :prefix-icon="Search"
          clearable
          size="small"
          style="width:200px"
        />
        <el-select v-model="statusFilter" placeholder="状态" size="small" clearable style="width:100px">
          <el-option label="已上架" :value="1" />
          <el-option label="已下架" :value="0" />
          <el-option label="售罄" :value="2" />
        </el-select>
        <div style="flex:1"/>
        <el-button
          v-if="selectedIds.length > 0"
          size="small"
          @click="batchSetStatus(1)"
        >批量上架({{ selectedIds.length }})</el-button>
        <el-button
          v-if="selectedIds.length > 0"
          size="small"
          type="warning"
          @click="batchSetStatus(0)"
        >批量下架</el-button>
        <el-button type="primary" :icon="Plus" size="small" @click="openDishForm()">新增菜品</el-button>
      </div>

      <!-- 菜品表格 -->
      <el-table
        v-loading="loading"
        :data="filteredDishes"
        row-key="id"
        @selection-change="onSelectionChange"
        stripe
        style="flex:1"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="图片" width="70">
          <template #default="{ row }">
            <img
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              style="width:48px;height:48px;border-radius:6px;object-fit:cover;cursor:pointer"
              @click="previewUrl = row.imageUrl; showPreview = true"
            />
            <div v-else class="img-placeholder">暂无</div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="菜品名称" min-width="140">
          <template #default="{ row }">
            <div class="dish-name-cell">
              <el-tag v-if="row.isRecommend" type="warning" size="small">推荐</el-tag>
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="90">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="monthlySales" label="月销" width="80" sortable />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-switch
              v-if="row.status !== 2"
              :model-value="row.status === 1"
              active-text="上架"
              inactive-text="下架"
              size="small"
              @change="(v: boolean) => toggleDishStatus(row, v)"
            />
            <el-tag v-else type="info" size="small">售罄</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="售罄" width="80">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 2"
              size="small"
              @change="(v: boolean) => toggleSoldOut(row, v)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDishForm(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteDish(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 图片预览弹窗 -->
      <el-dialog v-model="showPreview" title="菜品图片" width="500px" append-to-body>
        <div style="text-align:center">
          <img :src="previewUrl" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:8px" />
        </div>
      </el-dialog>
    </div>

    <!-- 菜品表单弹窗 -->
    <el-dialog
      v-model="showDishDialog"
      :title="editingDish ? '编辑菜品' : '新增菜品'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="dishFormRef" :model="dishForm" :rules="dishRules" label-width="90px">
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="dishForm.categoryId" placeholder="请选择分类" style="width:100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜品名称" prop="name">
          <el-input v-model="dishForm.name" placeholder="请输入菜品名称" />
        </el-form-item>
        <el-form-item label="基础价格" prop="price">
          <el-input-number v-model="dishForm.price" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="菜品图片">
          <el-upload
            :action="'/v1/upload/image'"
            :show-file-list="false"
            :on-success="(res: any) => { dishForm.imageUrl = res.url }"
            :on-error="() => { ElMessage.error('上传失败') }"
            accept="image/*"
          >
            <img v-if="dishForm.imageUrl" :src="dishForm.imageUrl" style="width:100px;height:100px;object-fit:cover;border-radius:6px" />
            <el-button v-else type="primary" plain>📷 选择图片</el-button>
          </el-upload>
          <el-input v-model="dishForm.imageUrl" placeholder="或粘贴图片URL" style="margin-top:8px" />
        </el-form-item>
        <el-form-item label="菜品描述">
          <el-input v-model="dishForm.description" type="textarea" :rows="2" placeholder="口感、食材简介等" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="dishForm.tags" placeholder="用逗号分隔，如：微辣,热菜,招牌" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="dishForm.isRecommend" active-text="设为推荐" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dishForm.sortNo" :min="0" size="small" />
          <span style="margin-left:8px;color:#999;font-size:12px">数值越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDishDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveDish">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分类表单 -->
    <el-dialog v-model="showCategoryDialog" :title="editingCategory ? '编辑分类' : '新增分类'" width="400px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="如：热菜、凉菜、主食" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortNo" :min="0" size="small" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import {
  getCategories, createCategory, updateCategory, deleteCategory as deleteCategoryApi,
  getDishes, createDish, updateDish, updateDishStatus, batchDishStatus, deleteDish as deleteDishApi,
} from '@/api';

const categories = ref<any[]>([]);
const dishes = ref<any[]>([]);
const loading = ref(false);
const showPreview = ref(false);
const previewUrl = ref('');
const saving = ref(false);
const activeCategoryId = ref<number | 'all'>('all');
const searchText = ref('');
const statusFilter = ref<number | undefined>(undefined);
const selectedIds = ref<number[]>([]);

const showDishDialog = ref(false);
const editingDish = ref<any>(null);
const dishFormRef = ref();
const dishForm = ref({
  categoryId: undefined as number | undefined,
  name: '', price: 0, imageUrl: '', description: '', tags: '', isRecommend: false, sortNo: 0,
});
const dishRules = {
  categoryId: [{ required: true, message: '请选择分类' }],
  name: [{ required: true, message: '请输入菜品名称' }],
  price: [{ required: true, message: '请输入价格' }],
};

const showCategoryDialog = ref(false);
const editingCategory = ref<any>(null);
const categoryForm = ref({ name: '', sortNo: 0 });

onMounted(() => {
  loadCategories();
  loadDishes();
});

async function loadCategories() {
  categories.value = (await getCategories()) as any[];
}

async function loadDishes() {
  loading.value = true;
  dishes.value = (await getDishes({
    categoryId: activeCategoryId.value === 'all' ? undefined : activeCategoryId.value,
  })) as any[];
  loading.value = false;
}

const filteredDishes = computed(() => {
  return dishes.value.filter((d) => {
    if (searchText.value && !d.name.includes(searchText.value)) return false;
    if (statusFilter.value !== undefined && d.status !== statusFilter.value) return false;
    return true;
  });
});

function onCategorySelect(id: string) {
  activeCategoryId.value = id === 'all' ? 'all' : parseInt(id);
  loadDishes();
}

function onSelectionChange(rows: any[]) {
  selectedIds.value = rows.map((r) => r.id);
}

async function toggleDishStatus(row: any, online: boolean) {
  await updateDishStatus(row.id, online ? 1 : 0);
  row.status = online ? 1 : 0;
  ElMessage.success(online ? '已上架' : '已下架');
}

async function toggleSoldOut(row: any, soldOut: boolean) {
  const newStatus = soldOut ? 2 : 1;
  await updateDishStatus(row.id, newStatus);
  row.status = newStatus;
  ElMessage.success(soldOut ? '已标记售罄' : '已恢复上架');
}

async function batchSetStatus(status: number) {
  if (selectedIds.value.length === 0) return;
  await batchDishStatus(selectedIds.value, status);
  ElMessage.success('批量操作成功');
  loadDishes();
}

function openDishForm(dish?: any) {
  editingDish.value = dish || null;
  if (dish) {
    Object.assign(dishForm.value, {
      categoryId: dish.categoryId,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.imageUrl || '',
      description: dish.description || '',
      tags: dish.tags || '',
      isRecommend: dish.isRecommend,
      sortNo: dish.sortNo,
    });
  } else {
    Object.assign(dishForm.value, {
      categoryId: activeCategoryId.value === 'all' ? undefined : activeCategoryId.value,
      name: '', price: 0, imageUrl: '', description: '', tags: '', isRecommend: false, sortNo: 0,
    });
  }
  showDishDialog.value = true;
}

async function saveDish() {
  await dishFormRef.value?.validate();
  saving.value = true;
  try {
    if (editingDish.value) {
      await updateDish(editingDish.value.id, dishForm.value);
      ElMessage.success('菜品已更新');
    } else {
      await createDish(dishForm.value);
      ElMessage.success('菜品已创建');
    }
    showDishDialog.value = false;
    loadDishes();
  } finally {
    saving.value = false;
  }
}

async function deleteDish(row: any) {
  await ElMessageBox.confirm(`确认删除「${row.name}」？下架后顾客将看不到此菜品`, '删除确认', { type: 'warning' });
  await deleteDishApi(row.id);
  ElMessage.success('已删除');
  loadDishes();
}

function openCategoryForm(cat?: any) {
  editingCategory.value = cat || null;
  categoryForm.value = { name: cat?.name || '', sortNo: cat?.sortNo || 0 };
  showCategoryDialog.value = true;
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) { ElMessage.warning('请输入分类名称'); return; }
  saving.value = true;
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, categoryForm.value);
    } else {
      await createCategory(categoryForm.value);
    }
    showCategoryDialog.value = false;
    loadCategories();
  } finally {
    saving.value = false;
  }
}

async function deleteCategory(cat: any) {
  await ElMessageBox.confirm(`确认删除分类「${cat.name}」？`, '删除确认', { type: 'warning' });
  await deleteCategoryApi(cat.id);
  ElMessage.success('已删除');
  loadCategories();
}
</script>

<style scoped>
.dishes-page {
  display: flex;
  height: 100%;
  background: #f5f6fa;
  gap: 12px;
  padding: 16px;
}

.category-panel {
  width: 180px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.category-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.cat-actions {
  display: none;
  gap: 6px;
}

.category-menu-item:hover .cat-actions {
  display: flex;
}

.dish-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  gap: 12px;
}

.dish-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-text {
  color: #FF6034;
  font-weight: 600;
}

.dish-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.img-placeholder {
  width: 48px;
  height: 48px;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #ccc;
}
</style>
