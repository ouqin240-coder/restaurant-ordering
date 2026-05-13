<template>
  <div class="dish-detail">
    <!-- 关闭按钮 -->
    <div class="close-btn" @click="$emit('close')">
      <van-icon name="cross" size="20" />
    </div>

    <!-- 菜品大图 -->
    <div class="dish-hero" @click="previewImage">
      <img v-if="dish.imageUrl" :src="dish.imageUrl" :alt="dish.name" class="hero-img" />
      <div v-else class="hero-placeholder">
        <van-icon name="photo-o" size="64" color="#e0e0e0" />
      </div>
      <div v-if="dish.isRecommend" class="recommend-badge">
        🔥 今日推荐
      </div>
    </div>

    <!-- 菜品信息 -->
    <div class="detail-body">
      <h2 class="dish-title">{{ dish.name }}</h2>
      <div v-if="dish.tags" class="dish-tags">
        <span v-for="tag in tagsArr" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <p v-if="dish.description" class="dish-desc">{{ dish.description }}</p>
      <div v-if="dish.monthlySales > 0" class="sales-info">
        月售 {{ dish.monthlySales }} 份
      </div>

      <!-- 规格选择 -->
      <div v-if="dish.specs && dish.specs.length > 0" class="spec-section">
        <div class="spec-title">选择规格</div>
        <div class="spec-options">
          <div
            v-for="spec in dish.specs"
            :key="spec.id"
            class="spec-option"
            :class="{ selected: selectedSpecId === spec.id }"
            @click="selectedSpecId = spec.id"
          >
            <span class="spec-name">{{ spec.name }}</span>
            <span class="spec-price">
              {{ spec.priceDelta >= 0 ? '+' : '' }}¥{{ Number(spec.priceDelta).toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 单品备注 -->
      <div class="remark-section">
        <div class="spec-title">备注（选填）</div>
        <van-field
          v-model="itemRemark"
          placeholder="如：不要辣椒、少放盐..."
          maxlength="50"
          class="remark-input"
          clearable
        />
      </div>

      <!-- 数量 + 加入购物车 -->
      <div class="bottom-action">
        <div class="qty-control">
          <van-button
            icon="minus"
            size="small"
            type="primary"
            plain
            round
            :disabled="qty <= 1"
            class="qty-btn"
            @click="qty = Math.max(1, qty - 1)"
          />
          <span class="qty-num">{{ qty }}</span>
          <van-button
            icon="plus"
            size="small"
            type="primary"
            round
            class="qty-btn"
            @click="qty++"
          />
        </div>

        <div class="current-price">
          <span class="price-symbol">¥</span>
          <span class="price-num">{{ currentPrice.toFixed(2) }}</span>
        </div>

        <van-button
          type="primary"
          round
          class="add-btn"
          :disabled="dish.status === 2"
          @click="addToCart"
        >
          {{ dish.status === 2 ? '已售罄' : '加入购物车' }}
        </van-button>
      </div>
    </div>

    <image-preview
      :show="showPreview"
      :src="dish.imageUrl || ''"
      @close="showPreview = false"
    />
    <Teleport to="body">
      <div v-if="showPreview" class="img-preview-overlay" @click="showPreview = false">
        < img :src="dish.imageUrl" class="img-preview-full" @click.stop />
        <div class="img-preview-close" @click="showPreview = false">X</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { showToast } from 'vant';
import { useCartStore } from '@/stores/cart';

const props = defineProps<{ dish: any }>();
const emit = defineEmits(['add', 'close']);
const cartStore = useCartStore();

const showPreview = ref(false);

function previewImage() {
  if (props.dish.imageUrl) {
    showPreview.value = true;
  }
}

const qty = ref(1);
const itemRemark = ref('');

// 打开新菜品时重置备注和数量
watch(() => props.dish?.id, () => {
  itemRemark.value = '';
  qty.value = 1;
  selectedSpecId.value = props.dish?.specs?.[0]?.id ?? undefined;
});
const selectedSpecId = ref<number | undefined>(
  props.dish.specs?.[0]?.id ?? undefined,
);

const tagsArr = computed(() =>
  props.dish.tags ? props.dish.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
);

const selectedSpec = computed(() =>
  props.dish.specs?.find((s: any) => s.id === selectedSpecId.value),
);

const currentPrice = computed(() => {
  const base = Number(props.dish.price);
  const delta = Number(selectedSpec.value?.priceDelta ?? 0);
  return (base + delta) * qty.value;
});

function addToCart() {
  if (props.dish.status === 2) return;

  cartStore.addItem({
    dishId: props.dish.id,
    dishName: props.dish.name,
    dishImage: props.dish.imageUrl,
    price: Number(props.dish.price) + Number(selectedSpec.value?.priceDelta ?? 0),
    specId: selectedSpecId.value,
    specName: selectedSpec.value?.name,
    remark: itemRemark.value || undefined,
    quantity: qty.value,
  });

  showToast({ message: '已加入购物车', icon: 'success', duration: 1000 });
  emit('close');
}
</script>

<style scoped>
.dish-detail {
  position: relative;
  background: #1a1a1a;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.dish-hero {
  position: relative;
  width: 100%;
  max-height: 300px;
  overflow: hidden;
  background: #2a2a2a;
  cursor: pointer;
}

.hero-img {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recommend-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: linear-gradient(135deg, #FF6034, #FF8C42);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.detail-body {
  padding: 16px 16px 24px;
}

.dish-title {
  font-size: 20px;
  font-weight: 700;
  color: #eee;
  margin-bottom: 8px;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  font-size: 11px;
  color: #FF6034;
  background: rgba(255,87,34,0.12);
  border: 1px solid rgba(255,87,34,0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.dish-desc {
  font-size: 14px;
  color: #999;
  line-height: 1.6;
  margin-bottom: 8px;
}

.sales-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
}

.spec-section,
.remark-section {
  margin-top: 16px;
}

.spec-title {
  font-size: 14px;
  font-weight: 600;
  color: #ccc;
  margin-bottom: 10px;
}

.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1.5px solid #444;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.spec-option.selected {
  border-color: #FF6034;
  background: rgba(255,87,34,0.12);
  color: #FF6034;
}

.spec-name {
  font-size: 13px;
  font-weight: 500;
}

.spec-price {
  font-size: 12px;
}

.remark-input {
  border: 1px solid #333;
  border-radius: 8px;
}
.remark-input :deep(.van-field__control) { color: #eee !important; }
.remark-section :deep(.van-field) { background: #252525 !important; }
.remark-section :deep(.van-cell) { background: transparent !important; }
.remark-input-hack {
  background: #252525 !important;
  color: #eee;
}

.bottom-action {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty-btn {
  width: 30px !important;
  height: 30px !important;
}

.qty-num {
  font-size: 18px;
  font-weight: 700;
  color: #eee;
  min-width: 24px;
  text-align: center;
}

.current-price {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 14px;
  color: #FF6034;
  font-weight: 600;
}

.price-num {
  font-size: 22px;
  font-weight: 700;
  color: #FF6034;
}

.add-btn {
  background: linear-gradient(135deg, #FF6034, #FF8C42) !important;
  border: none !important;
  padding: 0 20px;
  height: 40px;
  font-size: 15px;
  font-weight: 600;
}
.img-preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-preview-full {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}
.img-preview-close {
  position: fixed;
  top: 20px; right: 20px;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
