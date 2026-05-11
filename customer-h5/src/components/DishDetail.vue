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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { showToast } from 'vant';
import { useCartStore } from '@/stores/cart';
import ImagePreview from './ImagePreview.vue';

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
  background: white;
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
  height: 220px;
  overflow: hidden;
  background: #f5f5f5;
  cursor: pointer;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  color: #1a1a1a;
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
  background: #fff3ef;
  border: 1px solid #ffd0c0;
  padding: 2px 8px;
  border-radius: 4px;
}

.dish-desc {
  font-size: 14px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 8px;
}

.sales-info {
  font-size: 12px;
  color: #bbb;
  margin-bottom: 16px;
}

.spec-section,
.remark-section {
  margin-top: 16px;
}

.spec-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
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
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.spec-option.selected {
  border-color: #FF6034;
  background: #fff3ef;
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
  border: 1px solid #eee;
  border-radius: 8px;
}

.bottom-action {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
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
</style>
