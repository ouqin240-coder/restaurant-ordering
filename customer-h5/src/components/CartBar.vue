<template>
  <div class="cart-bar-wrapper">
    <!-- 购物车详情弹层 -->
    <van-popup v-model:show="showCart" position="bottom" round>
      <div class="cart-popup">
        <div class="cart-popup-header">
          <span class="cart-popup-title">已选菜品</span>
          <van-button size="small" plain type="danger" @click="clearCart">清空</van-button>
        </div>
        <div class="cart-popup-list">
          <div v-for="item in cartStore.items" :key="`${item.dishId}_${item.specId}`" class="cart-popup-item">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.dishName }}</span>
              <span v-if="item.specName" class="cart-item-spec">（{{ item.specName }}）</span>
            </div>
            <div class="cart-item-right">
              <span class="cart-item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
              <div class="cart-count-ctrl">
                <van-icon name="minus" class="ctrl-btn" @click="cartStore.removeItem(item.dishId, item.specId)" />
                <span class="cart-count">{{ item.quantity }}</span>
                <van-icon name="plus" class="ctrl-btn add" @click="cartStore.addItem(item)" />
              </div>
            </div>
          </div>
        </div>
        <!-- 备注 -->
        <div class="cart-remark">
          <van-field
            v-model="cartStore.remark"
            label="备注"
            placeholder="口味偏好、过敏原等（选填）"
            maxlength="100"
            clearable
          />
        </div>
      </div>
    </van-popup>

    <!-- 底部购物车栏 -->
    <div class="cart-bar" :class="{ 'has-items': !cartStore.isEmpty }" >
      <div class="cart-icon-wrap" @click="toggleCart">
        <div class="cart-icon-bg">
          <van-icon name="shopping-cart-o" size="26" color="white" />
          <van-badge
            v-if="cartStore.totalCount > 0"
            :content="cartStore.totalCount"
            class="cart-badge"
          />
        </div>
      </div>

      <div v-if="cartStore.isEmpty" class="cart-empty-hint">
        <span>你的胃和购物车一样空，这让我很心疼</span>
      </div>
      <div v-else class="cart-amount-wrap">
        <span class="cart-total">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        <span class="cart-min-hint" v-if="minAmount > 0 && cartStore.totalAmount < minAmount">
          还差 ¥{{ (minAmount - cartStore.totalAmount).toFixed(2) }} 起送
        </span>
      </div>

      <van-button
        v-if="!cartStore.isEmpty"
        type="primary"
        size="small"
        round
        class="checkout-btn"
        :disabled="minAmount > 0 && cartStore.totalAmount < minAmount"
        @click="$emit('checkout')"
      >
        老板，开烤！({{ cartStore.totalCount }})
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { showConfirmDialog } from 'vant';
import { useCartStore } from '@/stores/cart';

defineEmits(['checkout']);

const cartStore = useCartStore();
const showCart = ref(false);
const minAmount = ref(0); // 从配置读取

function toggleCart() {
  if (!cartStore.isEmpty) showCart.value = !showCart.value;
}

async function clearCart() {
  await showConfirmDialog({ title: '确认清空购物车？' });
  cartStore.clearCart();
  showCart.value = false;
}
</script>

<style scoped>
.cart-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.cart-bar {
  display: flex;
  align-items: center;
  background: #1a1a1a;
  padding: 8px 16px 8px 8px;
  min-height: 56px;
  transition: all 0.3s;
}

.cart-bar.has-items {
  background: #333;
}

.cart-icon-wrap {
  position: relative;
  margin-right: 12px;
  cursor: pointer;
}

.cart-icon-bg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6034, #FF8C42);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transform: translateY(-10px);
  box-shadow: 0 4px 12px rgba(255,96,52,0.5);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

.cart-empty-hint {
  flex: 1;
  color: #888;
  font-size: 14px;
}

.cart-amount-wrap {
  flex: 1;
}

.cart-total {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.cart-min-hint {
  display: block;
  font-size: 12px;
  color: #bbb;
}

.checkout-btn {
  background: #FF6034 !important;
  border-color: #FF6034 !important;
  font-weight: 600;
  padding: 0 20px;
  height: 38px;
}

.cart-popup {
  padding-bottom: env(safe-area-inset-bottom);
}

.cart-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.cart-popup-title {
  font-size: 16px;
  font-weight: 700;
}

.cart-popup-list {
  max-height: 40vh;
  overflow-y: auto;
  padding: 0 16px;
}

.cart-popup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f8f8f8;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-size: 14px;
  font-weight: 500;
}

.cart-item-spec {
  font-size: 12px;
  color: #999;
}

.cart-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-item-price {
  font-size: 14px;
  color: #FF6034;
  font-weight: 600;
}

.cart-count-ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ctrl-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.ctrl-btn.add {
  background: #FF6034;
  border-color: #FF6034;
  color: white;
}

.cart-count {
  font-size: 15px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.cart-remark {
  border-top: 1px solid #f0f0f0;
  padding: 4px 0;
}
</style>
