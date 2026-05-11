<template>
  <div class="menu-page">
    <!-- 顶部店铺信息 -->
    <div class="shop-header">
      <div class="banner-embers">
        <span class="ember"></span><span class="ember e2"></span><span class="ember e3"></span><span class="ember e4"></span>
      </div>
      <div class="shop-info">
        <h1 class="shop-name">{{ shopName }}</h1>
        <span class="order-type-badge" :class="userStore.isDineIn ? 'dine-in' : 'delivery'">
          {{ userStore.isDineIn ? `堂食 · ${userStore.tableNo}桌` : '外卖' }}
        </span>
      </div>
      <div class="shop-slogan">"{{ shopInfo.announcement || '解决不了人生的难题，至少先解决今晚的饥饿' }}"</div>
      <div class="shop-actions">
        <button class="action-btn" @click="goToCoupons">
          🎟 领券
        </button>
        <button class="action-btn" @click="toggleOrderType">
          {{ userStore.isDineIn ? '🛵 切换外卖' : '🍽 切换堂食' }}
        </button>
        <button class="action-btn" @click="goToOrders">
          📋 我的订单
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="searchKeyword"
        placeholder="今晚想吃点啥？"
        shape="round"
        background="#1a1a1a"
        @search="onSearch"
        @clear="clearSearch"
      />
    </div>

    <!-- 搜索结果 -->
    <div v-if="isSearching" class="search-results">
      <div v-if="searchResults.length === 0" class="empty-search">
        <van-empty description="未找到相关菜品" />
      </div>
      <div v-else class="dish-list">
        <dish-card
          v-for="dish in searchResults"
          :key="dish.id"
          :dish="dish"
          @add="addToCart"
          @minus="removeFromCart"
          @click="openDishDetail(dish)"
        />
      </div>
    </div>

    <!-- 主菜单区域 -->
    <div v-else class="menu-container">
      <!-- 左侧分类导航 -->
      <div class="category-nav">
        <!-- 推荐 Tab -->
        <div
          class="category-item"
          :class="{ active: activeCategoryId === 'recommend' }"
          @click="scrollToRecommend"
        >
          <van-icon name="fire-o" size="14" />
          <span>推荐</span>
        </div>
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: activeCategoryId === cat.id }"
          @click="scrollToCategory(cat.id)"
        >
          <span>{{ cat.name }}</span>
        </div>
      </div>

      <!-- 右侧菜品列表 -->
      <div class="dish-content" ref="dishContentRef" @scroll="onDishScroll">
        <!-- 今日推荐 -->
        <div v-if="recommendedDishes.length" class="category-section" data-category="recommend">
          <div class="category-title">
            <van-icon name="fire" color="#FF6034" />
            今日推荐
          </div>
          <dish-card
            v-for="dish in recommendedDishes"
            :key="`rec_${dish.id}`"
            :dish="dish"
            @add="addToCart(dish)"
            @minus="removeFromCart(dish)"
            @click="openDishDetail(dish)"
          />
        </div>

        <!-- 各分类菜品 -->
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-section"
          :data-category="cat.id"
        >
          <div class="category-title">{{ cat.name }}</div>
          <div v-if="cat.dishes?.length === 0" class="no-dishes">该分类暂无菜品</div>
          <dish-card
            v-for="dish in cat.dishes"
            :key="dish.id"
            :dish="dish"
            @add="addToCart(dish)"
            @minus="removeFromCart(dish)"
            @click="openDishDetail(dish)"
          />
        </div>

        <!-- 底部安全距离 -->
        <div style="height: 100px" />
      </div>
    </div>

    <!-- 购物车悬浮栏 -->
    <cart-bar @checkout="goToCheckout" />

    <!-- 菜品详情弹层 -->
    <van-popup
      v-model:show="showDishDetail"
      position="bottom"
      round
      :style="{ maxHeight: '80vh', overflow: 'auto' }"
    >
      <dish-detail
        v-if="selectedDish"
        :dish="selectedDish"
        @add="addToCart"
        @close="showDishDetail = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getFullMenu, getShopInfo, getRecommended, searchDishes } from '@/api';
import { useCartStore } from '@/stores/cart';
import { useUserStore } from '@/stores/user';
import DishCard from '@/components/DishCard.vue';
import CartBar from '@/components/CartBar.vue';
import DishDetail from '@/components/DishDetail.vue';

const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();

const categories = ref<any[]>([]);
const recommendedDishes = ref<any[]>([]);
const shopName = ref('老末烧烤铺');
const shopInfo = ref<any>({ announcement: '', logoUrl: '' });
const activeCategoryId = ref<number | 'recommend'>('recommend');
const dishContentRef = ref<HTMLElement | null>(null);
const showDishDetail = ref(false);
const selectedDish = ref<any>(null);
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const isSearching = ref(false);

onMounted(async () => {
  await Promise.all([loadMenu(), loadRecommended(), loadShopInfo()]);
});

async function loadShopInfo() {
  try {
    const data: any = await getShopInfo();
    shopName.value = data.name || '老末烧烤铺';
    shopInfo.value = data;
  } catch {}
}

async function loadMenu() {
  try {
    const data: any = await getFullMenu();
    categories.value = data;
  } catch (e) {
    console.error('Failed to load menu', e);
  }
}

async function loadRecommended() {
  try {
    const data: any = await getRecommended();
    recommendedDishes.value = data.slice(0, 5);
  } catch {}
}

// ─── 导航按钮 ───
function goToCoupons() {
  router.push('/coupons/center');
}

function goToOrders() {
  router.push('/orders');
}

function toggleOrderType() {
  if (userStore.isDineIn) {
    userStore.setOrderType('2');
  } else {
    userStore.setOrderType('1');
  }
}

// ─── 搜索 ───
async function onSearch(kw: string) {
  if (!kw.trim()) { clearSearch(); return; }
  isSearching.value = true;
  const data: any = await searchDishes(kw);
  searchResults.value = data;
}

function clearSearch() {
  isSearching.value = false;
  searchResults.value = [];
  searchKeyword.value = '';
}

// ─── 分类滚动 ───
function scrollToCategory(categoryId: number) {
  activeCategoryId.value = categoryId;
  const el = dishContentRef.value?.querySelector(`[data-category="${categoryId}"]`) as HTMLElement;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToRecommend() {
  activeCategoryId.value = 'recommend';
  const el = dishContentRef.value?.querySelector('[data-category="recommend"]') as HTMLElement;
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onDishScroll() {
  if (!dishContentRef.value) return;
  const sections = dishContentRef.value.querySelectorAll('.category-section');
  const scrollTop = dishContentRef.value.scrollTop;
  let current: number | 'recommend' = 'recommend';
  sections.forEach((section: any) => {
    if (section.offsetTop - 10 <= scrollTop) {
      const catAttr = section.getAttribute('data-category');
      current = catAttr === 'recommend' ? 'recommend' : parseInt(catAttr);
    }
  });
  activeCategoryId.value = current;
}

// ─── 购物车操作 ───
function addToCart(dish: any, specId?: number, specName?: string) {
  if (dish.status === 2) return; // 售罄
  cartStore.addItem({
    dishId: dish.id,
    dishName: dish.name,
    dishImage: dish.imageUrl,
    price: Number(dish.price) + (specId ? Number(dish.specs?.find((s: any) => s.id === specId)?.priceDelta || 0) : 0),
    specId,
    specName,
  });
}

function removeFromCart(dish: any, specId?: number) {
  cartStore.removeItem(dish.id, specId);
}

function openDishDetail(dish: any) {
  selectedDish.value = dish;
  showDishDetail.value = true;
}

function goToCheckout() {
  if (cartStore.isEmpty) return;
  router.push('/checkout');
}
</script>

<style scoped>
.menu-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #111;
  overflow: hidden;
}

/* banner */
.shop-header {
  background: linear-gradient(180deg, #1a0a00 0%, #2d1200 60%, #111 100%);
  padding: 20px 16px 16px;
  color: white;
  position: relative;
  overflow: hidden;
}
.banner-embers { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; }
.ember {
  position: absolute; width: 3px; height: 3px;
  background: #FF9800; border-radius: 50%;
  animation: ember-float 4s ease-in-out infinite;
  left: 30%; top: 70%;
}
.ember.e2 { left: 20%; top: 60%; animation-delay: 0.5s; width: 2px; height: 2px; }
.ember.e3 { left: 70%; top: 40%; animation-delay: 1s; }
.ember.e4 { left: 85%; top: 65%; animation-delay: 1.5s; width: 2px; height: 2px; }
@keyframes ember-float {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-30px) scale(0.5); opacity: 0.3; }
  100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

.shop-name {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 28px;
  color: #FF9800;
  margin: 0 0 4px;
  text-shadow: 0 0 20px rgba(255,152,0,0.3);
  letter-spacing: 4px;
}
.order-type-badge {
  display: inline-block; font-size: 11px;
  padding: 2px 8px; border-radius: 10px; font-weight: 500;
}
.order-type-badge.dine-in {
  background: rgba(255,87,34,0.3); border: 1px solid rgba(255,87,34,0.4); color: #FFAB91;
}
.order-type-badge.delivery {
  background: rgba(255,87,34,0.3); border: 1px solid rgba(255,87,34,0.4); color: #FFAB91;
}
.shop-slogan {
  font-size: 13px; color: #A0A0A0; font-style: italic;
  margin: 8px 0 14px; line-height: 1.6;
}
.shop-actions { display: flex; gap: 6px; }
.action-btn {
  flex: 1; padding: 10px 4px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; color: #ccc;
  font-size: 16px; cursor: pointer; text-align: center;
  transition: all 0.2s;
}
.action-btn:first-child {
  background: rgba(255,87,34,0.15);
  border-color: rgba(255,87,34,0.3); color: #FF9800;
}
.action-btn:active { background: rgba(255,255,255,0.15); }

/* search */
.search-bar { background: #111; padding: 6px 0; }
:deep(.van-search) { background: #161616 !important; }
:deep(.van-search__content) { background: #252525 !important; border: 1px solid #3a3a3a !important; }
:deep(.van-field__control) { color: #ddd !important; }
:deep(.van-field__control::placeholder) { color: #666 !important; }

/* sidebar */
.menu-container { display: flex; flex: 1; overflow: hidden; }
.category-nav {
  width: 84px; background: #0d0d0d;
  overflow-y: auto; border-right: 1px solid #222; flex-shrink: 0;
}
.category-item {
  padding: 14px 6px; text-align: center;
  font-size: 13px; color: #777; cursor: pointer;
  transition: all 0.2s; line-height: 1.4;
  display: flex; flex-direction: column;
  align-items: center; gap: 6px;
  border-left: 3px solid transparent;
}
.category-item.active {
  background: rgba(255,152,0,0.08);
  color: #FF9800; font-size: 14px; font-weight: 600;
  border-left-color: #FF9800;
}

/* dish list */
.dish-content {
  flex: 1; overflow-y: auto;
  background: #111; -webkit-overflow-scrolling: touch;
}
.category-section { padding: 0 12px; }
.category-title {
  font-size: 16px; font-weight: 600; color: #FF9800;
  padding: 16px 0 8px;
  display: flex; align-items: center; gap: 6px;
  position: sticky; top: 0;
  background: #111; z-index: 1;
}
.no-dishes {
  text-align: center; color: #555; font-size: 12px; padding: 20px;
}
.search-results {
  flex: 1; overflow-y: auto;
  background: #111; padding: 0 12px;
}
</style>