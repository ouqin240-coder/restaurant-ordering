<template>
  <div class="dish-card" @click="$emit('click', dish)">
    <div class="dish-image-wrap" @click.stop="previewImage">
      <img v-if="dish.imageUrl" :src="dish.imageUrl" :alt="dish.name" class="dish-image" />
      <div v-else class="dish-image-placeholder">
        <van-icon name="photo-o" size="28" color="#555" />
      </div>
      <div v-if="dish.status === 2" class="sold-out-mask">
        <span>已售罄</span>
      </div>
    </div>

    <div class="dish-info">
      <div class="dish-name">
        <span v-if="dish.isRecommend" class="tag recommend">荐</span>
        {{ dish.name }}
      </div>
      <div v-if="dish.description" class="dish-desc">{{ dish.description }}</div>
      <div v-if="dish.tags" class="dish-tags">
        <span v-for="tag in dish.tags.split(',')" :key="tag" class="tag">{{ tag.trim() }}</span>
      </div>
      <div class="dish-meta">
        <span v-if="dish.monthlySales > 0" class="sales">月售 {{ dish.monthlySales }}</span>
      </div>
      <div class="dish-footer">
        <div class="price-wrap">
          <span class="currency">¥</span>
          <span class="price-int">{{ String(dish.price).split('.')[0] }}</span>
          <span class="price-dec">.{{ String(dish.price).split('.')[1] || '00' }}</span>
        </div>
        <div v-if="dish.status !== 2" class="count-control" @click.stop>
          <transition name="fade">
            <van-button
              v-if="itemCount > 0"
              icon="minus"
              size="mini"
              round
              @click="$emit('minus', dish)"
              class="count-btn minus-btn"
            />
          </transition>
          <span v-if="itemCount > 0" class="count">{{ itemCount }}</span>
          <van-button
            icon="plus"
            size="mini"
            type="primary"
            round
            @click="$emit('add', dish)"
            class="count-btn add-btn"
          />
        </div>
        <div v-else class="sold-out-btn">已售罄</div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showPreview" class="img-preview-overlay" @click="closePreview">
        <img :src="dish.imageUrl" class="img-preview-full" @click.stop />
        <div class="img-preview-close" @click="closePreview">✕</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCartStore } from '@/stores/cart';

const props = defineProps<{ dish: any }>();
defineEmits(['add', 'minus', 'click']);

const cartStore = useCartStore();
const itemCount = computed(() => cartStore.getItemCount(props.dish.id));
const showPreview = ref(false);

function previewImage() {
  if (props.dish.imageUrl) {
    showPreview.value = true;
  }
}

function closePreview() {
  showPreview.value = false;
}
</script>

<style scoped>
.dish-card {
  display: flex;
  padding: 12px;
  margin-bottom: 8px;
  background: #1a1a1a;
  border: 1px solid #252525;
  border-radius: 10px;
  cursor: pointer;
}
.dish-image-wrap {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #2a2a2a;
  margin-right: 12px;
}
.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dish-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
}
.sold-out-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
}
.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: #eee;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dish-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}
.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 4px;
}
.tag {
  font-size: 12px;
  color: #FF9800;
  background: rgba(255,87,34,0.12);
  border: 0.5px solid rgba(255,87,34,0.3);
  padding: 2px 10px;
  border-radius: 4px;
}
.tag.recommend {
  background: #FF5722;
  color: white;
  border-color: #FF5722;
  font-weight: 600;
  border-radius: 4px;
}
.dish-meta {
  flex: 1;
}
.sales {
  font-size: 12px;
  color: #666;
}
.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.price-wrap {
  display: flex;
  align-items: baseline;
}
.currency {
  font-size: 12px;
  color: #FF5722;
  font-weight: 600;
}
.price-int {
  font-size: 18px;
  font-weight: 700;
  color: #FF5722;
}
.price-dec {
  font-size: 12px;
  color: #FF5722;
  font-weight: 400;
}
.count-control {
  display: flex;
  align-items: center;
  gap: 8px;
}
.count {
  font-size: 16px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  color: #eee;
}
.count-btn {
  width: 26px !important;
  height: 26px !important;
}
.minus-btn {
  background: #333 !important;
  border-color: #555 !important;
  color: #aaa !important;
}
.add-btn {
  background: #FF5722 !important;
  border-color: #FF5722 !important;
  box-shadow: 0 2px 8px rgba(255,87,34,0.4);
}
.sold-out-btn {
  font-size: 12px;
  color: #555;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.img-preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
.img-preview-full {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  cursor: default;
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
