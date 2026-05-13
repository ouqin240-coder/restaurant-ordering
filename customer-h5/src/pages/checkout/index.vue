<template>
  <div class="checkout-page">
    <van-nav-bar title="确认订单" left-arrow @click-left="$router.back()" />

    <!-- 就餐方式提示 -->
    <div class="order-type-bar">
      <van-icon :name="userStore.isDineIn ? 'location-o' : 'logistics'" size="16" />
      <span>{{ userStore.isDineIn ? `堂食 · ${userStore.tableNo} 桌` : '外卖配送' }}</span>
    </div>

    <!-- 外卖：收货地址 -->
    <div v-if="userStore.isDelivery" class="section address-section" @click="showAddressForm = true">
      <div v-if="selectedAddress" class="address-info">
        <div class="address-name">{{ selectedAddress.contactName }} {{ selectedAddress.contactPhone }}</div>
        <div class="address-detail">{{ selectedAddress.address }}</div>
      </div>
      <div v-else class="address-placeholder">
        <van-icon name="add-o" size="18" color="#FF6034" />
        <span>添加收货地址</span>
      </div>
      <van-icon name="arrow" color="#bbb" />
    </div>

    <!-- 地址输入弹窗 -->
    <van-popup v-model:show="showAddressForm" position="bottom" round :style="{ height: '60%', background: '#1a1a1a', color: '#eee' }">
      <div class="address-form-popup">
        <div class="popup-header">
          <span>填写收货地址</span>
          <van-icon name="cross" @click="showAddressForm = false" />
        </div>
        <van-field v-model="addressForm.contactName" label="收货人" placeholder="请输入姓名" />
        <van-field v-model="addressForm.contactPhone" label="手机号" placeholder="请输入手机号" type="tel" maxlength="11" />
        <van-field v-model="addressForm.address" label="详细地址" placeholder="请输入街道、门牌号" type="textarea" autosize rows="2" />
        <div class="address-form-btn-wrap">
          <van-button type="primary" block round @click="saveAddress">保存并使用</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 订单商品列表 -->
    <div class="section">
      <div class="section-title">订单详情</div>
      <div v-for="item in cartStore.items" :key="`${item.dishId}_${item.specId}`" class="order-item">
        <img v-if="item.dishImage" :src="item.dishImage" class="item-img" />
        <div v-else class="item-img-placeholder"><van-icon name="photo-o" color="#eee" size="24"/></div>
        <div class="item-info">
          <div class="item-name">
            {{ item.dishName }}
            <span v-if="item.specName" class="item-spec">（{{ item.specName }}）</span>
          </div>
          <div class="item-price-qty">
            <span class="item-price">¥{{ Number(item.price).toFixed(2) }}</span>
            <span class="item-qty">×{{ item.quantity }}</span>
          </div>
        </div>
        <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
      </div>
    </div>

    <!-- 备注 -->
    <div class="section">
      <van-field
        v-model="cartStore.remark"
        label="备注"
        placeholder="口味偏好、过敏原等（选填）"
        maxlength="100"
        clearable
        rows="2"
        type="textarea"
        autosize
      />
    </div>

    <!-- 费用明细 -->
    <div class="section fee-section">
      <div class="fee-row">
        <span>商品合计</span>
        <span>¥{{ cartStore.totalAmount.toFixed(2) }}</span>
      </div>
      <div v-if="userStore.isDelivery" class="fee-row">
        <span>配送费</span>
        <span>¥{{ deliveryFee.toFixed(2) }}</span>
      </div>
      <!-- 优惠券输入 -->
      <div class="coupon-row">
        <span>优惠券</span>
        <div class="coupon-input-wrap">
          <input
            v-model="couponCode"
            class="coupon-input"
            placeholder="输入券码或选券"
            :disabled="couponApplied"
          />
          <button v-if="!couponApplied" class="coupon-btn pick" @click="showCouponPicker = true">选券</button>
          <button v-if="!couponApplied" class="coupon-btn" @click="applyCoupon">使用</button>
          <button v-else class="coupon-btn cancel" @click="cancelCoupon">取消</button>
        </div>
      </div>

      <!-- 我的优惠券选择弹窗 -->
      <van-popup v-model:show="showCouponPicker" position="bottom" round style="max-height: 70vh; padding: 16px; background: #1a1a1a; color: #eee;">
        <div class="picker-header">
          <h3 style="margin:0 0 12px 0;color:#eee">选择优惠券</h3>
        </div>
        <div v-if="loadingMyCoupons" style="text-align:center;padding:40px 0;color:#666">加载中...</div>
        <div v-else-if="myCoupons.length === 0" style="text-align:center;padding:40px 0;color:#999">
          暂无可用优惠券<br/>
          <button style="margin-top:12px;padding:6px 16px;background:#FF6034;color:#fff;border:none;border-radius:16px" @click="goToCouponCenter">去领券</button>
        </div>
        <div v-else>
          <div
            v-for="c in myCoupons"
            :key="c.id"
            class="picker-coupon"
            :class="{ disabled: !canUseCoupon(c) }"
            @click="canUseCoupon(c) && pickCoupon(c)"
          >
            <div class="picker-coupon-left">
              <div style="font-size:14px">¥<span style="font-size:28px;font-weight:bold">{{ c.amount }}</span></div>
              <div style="font-size:11px;opacity:0.95">{{ c.minAmount > 0 ? `满¥${c.minAmount}` : '无门槛' }}</div>
            </div>
            <div class="picker-coupon-right">
              <div style="font-size:14px;font-weight:500">{{ c.name || '优惠券' }}</div>
              <div style="font-size:11px;color:#999;margin-top:2px">券码: {{ c.code }}</div>
              <div v-if="!canUseCoupon(c)" style="font-size:11px;color:#FF6034;margin-top:4px">订单未满 ¥{{ c.minAmount }}</div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px">
          <van-button block @click="showCouponPicker = false">关闭</van-button>
        </div>
      </van-popup>
      <div v-if="discount > 0" class="fee-row discount">
        <span>优惠减免</span>
        <span>-¥{{ discount.toFixed(2) }}</span>
      </div>
      <div class="fee-row total">
        <span>实付金额</span>
        <span class="total-price">¥{{ payAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 底部支付栏 -->
    <div class="pay-bar">
      <div class="pay-total">
        <span class="pay-label">需付</span>
        <span class="pay-amount">¥{{ payAmount.toFixed(2) }}</span>
      </div>
      <van-button
        type="primary"
        size="large"
        round
        class="pay-btn"
        :loading="paying"
        :disabled="userStore.isDelivery && !selectedAddress"
        @click="submitOrder"
      >
        老板，开烤！
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { createOrder, getMyCoupons } from '@/api';
import { useCartStore } from '@/stores/cart';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();

const paying = ref(false);
const selectedAddress = ref<any>(null);
const showAddressForm = ref(false);
const addressForm = ref({ contactName: '', contactPhone: '', address: '' });
const deliveryFee = ref(userStore.isDelivery ? 3 : 0);

function saveAddress() {
  if (!addressForm.value.contactName.trim()) { showToast('请输入收货人姓名'); return; }
  if (!/^1\d{10}$/.test(addressForm.value.contactPhone)) { showToast('手机号格式错误'); return; }
  if (!addressForm.value.address.trim()) { showToast('请输入详细地址'); return; }
  selectedAddress.value = {
    id: Date.now(),
    contactName: addressForm.value.contactName.trim(),
    contactPhone: addressForm.value.contactPhone.trim(),
    address: addressForm.value.address.trim(),
  };
  showAddressForm.value = false;
  showToast({ message: '地址已保存', type: 'success' });
}
const discount = ref(0);
const couponCode = ref('');
const showCouponPicker = ref(false);
const myCoupons = ref<any[]>([]);
const loadingMyCoupons = ref(false);
const couponApplied = ref(false);

const payAmount = computed(() =>
  cartStore.totalAmount + deliveryFee.value - discount.value
);

async function loadMyCoupons() {
  loadingMyCoupons.value = true;
  try {
    const userId = userStore.userId || parseInt(localStorage.getItem('user_id') || '0');
    if (!userId) {
      myCoupons.value = [];
      return;
    }
    const list: any = await getMyCoupons(userId);
    // 只显示可用的（未使用、未过期）
    myCoupons.value = list.filter((c: any) => c.usable);
  } finally {
    loadingMyCoupons.value = false;
  }
}

function canUseCoupon(c: any) {
  return cartStore.totalAmount >= Number(c.minAmount);
}

function pickCoupon(c: any) {
  couponCode.value = c.code;
  showCouponPicker.value = false;
  // 自动应用
  setTimeout(() => applyCoupon(), 100);
}

function goToCouponCenter() {
  router.push('/coupons/center');
}

// 弹窗打开时加载券列表
import { watch } from 'vue';
watch(showCouponPicker, (v) => {
  if (v) loadMyCoupons();
});

async function applyCoupon() {
  if (!couponCode.value.trim()) { showToast('请输入优惠券码'); return; }
  try {
    const res: any = await fetch(`/v1/coupons/validate?code=${encodeURIComponent(couponCode.value.trim())}&amount=${cartStore.totalAmount}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('customer_token') }
    }).then(r => r.json());
    if (res.valid) {
      discount.value = Number(res.discountAmount);
      couponApplied.value = true;
      showToast({ message: `已抵扣 ¥${discount.value.toFixed(2)}`, type: 'success' });
    } else {
      showToast(res.reason || '优惠券无效');
    }
  } catch (e) {
    showToast('验证失败');
  }
}

function cancelCoupon() {
  couponApplied.value = false;
  discount.value = 0;
  couponCode.value = '';
}

async function submitOrder() {
  if (paying.value) return;
  if (cartStore.isEmpty) { showToast('购物车为空'); return; }
  if (userStore.isDelivery && !selectedAddress.value) {
    showToast('请填写收货地址'); return;
  }

  paying.value = true;
  showLoadingToast({ message: '提交订单...', forbidClick: true });

  try {
    const payload: any = {
      orderType: parseInt(userStore.orderType),
      items: cartStore.items.map((i) => ({
        dishId: i.dishId,
        specId: i.specId,
        quantity: i.quantity,
        remark: i.remark,
      })),
      remark: cartStore.remark,
      couponCode: couponApplied.value ? couponCode.value.trim() : undefined,
    };

    if (userStore.isDineIn) {
      // 优先使用 tableNo 字符串（更可靠），后端会反查 tableId
      payload.tableNo = userStore.tableNo || localStorage.getItem('table_no') || undefined;
      payload.tableId = parseInt(localStorage.getItem('table_id') || '0') || undefined;
    } else {
      payload.addressId = selectedAddress.value?.id;
    }

    const res: any = await createOrder(payload);
    closeToast();

    // 调用老板，开烤！
    await callWxPay(res.wxPayParams, res.orderNo);
  } catch (e) {
    closeToast();
    paying.value = false;
  }
}

function callWxPay(params: any, orderNo: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof (window as any).WeixinJSBridge === 'undefined') {
      // 非微信环境（开发调试）：直接跳转成功页
      cartStore.clearCart();
      router.replace(`/order/${orderNo}`);
      resolve();
      return;
    }
    (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
      appId: import.meta.env.VITE_WX_APPID,
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType,
      paySign: params.paySign,
    }, (res: any) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        cartStore.clearCart();
        router.replace(`/order/${orderNo}`);
        resolve();
      } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
        showToast('已取消支付');
        paying.value = false;
        reject(new Error('cancel'));
      } else {
        showToast({ message: '支付失败，请重试', type: 'fail' });
        paying.value = false;
        reject(new Error(res.err_msg));
      }
    });
  });
}
</script>

<style scoped>
.checkout-page { background: #111; min-height: 100vh; padding-bottom: 80px; color: #eee; }
.order-type-bar { background: rgba(255,87,34,0.1); border-left: 3px solid #FF5722; padding: 10px 16px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #FF9800; font-weight: 500; }
.section { background: #1a1a1a; margin: 8px 0; padding: 16px; }
.section-title { font-size: 14px; font-weight: 700; color: #eee; margin-bottom: 12px; }
.address-form-popup { padding: 20px; background: #1a1a1a; }
.popup-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.address-form-btn-wrap { margin-top: 24px; }
.address-section { display: flex; align-items: center; cursor: pointer; gap: 12px; }
.address-info { flex: 1; }
.address-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: #eee; }
.address-detail { font-size: 13px; color: #999; }
.address-placeholder { flex: 1; display: flex; align-items: center; gap: 8px; color: #FF5722; font-size: 14px; }
.order-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #252525; gap: 10px; }
.order-item:last-child { border-bottom: none; }
.item-img { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.item-img-placeholder { width: 56px; height: 56px; border-radius: 6px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.item-info { flex: 1; }
.item-name { font-size: 14px; font-weight: 500; color: #eee; }
.item-spec { color: #999; font-size: 12px; }
.item-price-qty { display: flex; gap: 8px; margin-top: 4px; }
.item-price { font-size: 13px; color: #999; }
.item-qty { font-size: 13px; color: #666; }
.item-subtotal { font-size: 15px; font-weight: 600; color: #eee; }
.fee-section { padding: 12px 16px; }
.fee-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #999; }
.coupon-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 14px; color: #999; }
.coupon-input-wrap { display: flex; align-items: center; gap: 8px; }
.coupon-input { width: 130px; padding: 6px 10px; border: 1px solid #3a3a3a; border-radius: 6px; font-size: 13px; text-transform: uppercase; background: #252525; color: #eee; }
.coupon-input:disabled { background: #1a1a1a; color: #666; }
.coupon-btn { padding: 6px 14px; border: none; border-radius: 16px; background: #FF5722; color: white; font-size: 13px; cursor: pointer; }
.coupon-btn.pick { background: transparent; color: #FF5722; border: 1px solid #FF5722; margin-right: 6px; }
.picker-coupon { display: flex; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; margin-bottom: 10px; overflow: hidden; cursor: pointer; }
.picker-coupon.disabled { opacity: 0.5; cursor: not-allowed; }
.picker-coupon-left { width: 100px; background: linear-gradient(135deg, #FF5722, #FF9800); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 12px 8px; }
.picker-coupon.disabled .picker-coupon-left { background: #444; }
.picker-coupon-right { flex: 1; padding: 12px 14px; color: #eee; }
.coupon-btn.cancel { background: #555; }
.fee-row.discount { color: #07C160; }
.fee-row.total { border-top: 1px solid #333; margin-top: 8px; padding-top: 12px; font-weight: 600; color: #eee; font-size: 15px; }
.total-price { color: #FF5722; font-size: 18px; font-weight: 700; }
.pay-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a1a; padding: 10px 16px; padding-bottom: calc(10px + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 -2px 10px rgba(0,0,0,0.3); }
.pay-total { display: flex; align-items: baseline; gap: 6px; }
.pay-label { font-size: 14px; color: #999; }
.pay-amount { font-size: 22px; font-weight: 700; color: #FF5722; }
.pay-btn { background: #FF5722 !important; border-color: #FF5722 !important; width: 140px; height: 44px; font-size: 15px; font-weight: 600; }
:deep(.van-field) { background: #1a1a1a !important; }
:deep(.van-field__control) { color: #eee !important; }
:deep(.van-field__label) { color: #999 !important; }
:deep(.van-cell-group) { background: #1a1a1a !important; }
:deep(.van-popup) { background: #1e1e1e !important; }
:deep(.van-action-sheet__content) { background: #1e1e1e !important; }
:deep(.van-action-sheet__close) { color: #999 !important; }
</style>