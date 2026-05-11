#!/usr/bin/env node
// 批量生成模型文件
const fs = require('fs');
const path = require('path');

const models = {
  'Shop.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shop = sequelize.define('Shop', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, comment: '店铺名称' },
  logo: { type: DataTypes.STRING(255), comment: 'Logo URL' },
  description: { type: DataTypes.TEXT, comment: '店铺简介' },
  address: { type: DataTypes.STRING(255), comment: '店铺地址' },
  phone: { type: DataTypes.STRING(20) },
  business_hours: { type: DataTypes.JSON, comment: '营业时间配置 {start:"09:00",end:"22:00"}' },
  is_open: { type: DataTypes.BOOLEAN, defaultValue: true, comment: '是否营业' },
  is_delivery_open: { type: DataTypes.BOOLEAN, defaultValue: true, comment: '是否开启外卖' },
  min_delivery_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0, comment: '最低起送金额' },
  delivery_fee: { type: DataTypes.DECIMAL(10,2), defaultValue: 0, comment: '配送费' },
  delivery_radius: { type: DataTypes.DECIMAL(5,2), defaultValue: 5, comment: '配送半径(km)' },
  notice: { type: DataTypes.TEXT, comment: '公告/备注' },
}, { tableName: 'shops', comment: '店铺表' });

module.exports = Shop;
`,

  'User.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(64), unique: true, allowNull: false, comment: '微信 OpenID' },
  session_key: { type: DataTypes.STRING(128), comment: '微信 session_key（加密存储）' },
  nickname: { type: DataTypes.STRING(64), comment: '微信昵称' },
  avatar_url: { type: DataTypes.STRING(255) },
  phone: { type: DataTypes.STRING(20), comment: '手机号（加密）' },
  is_merchant: { type: DataTypes.BOOLEAN, defaultValue: false },
  merchant_role: { 
    type: DataTypes.ENUM('admin', 'cashier', 'kitchen'), 
    comment: '商家角色：admin=管理员,cashier=收银,kitchen=厨房' 
  },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED },
}, { tableName: 'users', comment: '用户表' });

module.exports = User;
`,

  'Category.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false },
  image: { type: DataTypes.STRING(255) },
  sort_no: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'categories', comment: '菜品分类' });

module.exports = Category;
`,

  'Dish.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dish = sequelize.define('Dish', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  image_url: { type: DataTypes.STRING(255) },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false, comment: '基础价格' },
  original_price: { type: DataTypes.DECIMAL(10,2), comment: '原价（划线价）' },
  status: { 
    type: DataTypes.TINYINT, defaultValue: 1, 
    comment: '0=下架 1=上架 2=售罄' 
  },
  is_recommend: { type: DataTypes.BOOLEAN, defaultValue: false },
  monthly_sales: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_sales: { type: DataTypes.INTEGER, defaultValue: 0 },
  sort_no: { type: DataTypes.INTEGER, defaultValue: 0 },
  tags: { type: DataTypes.JSON, comment: '标签数组 ["辣","招牌"]' },
  has_specs: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否有规格' },
}, { tableName: 'dishes', comment: '菜品表' });

module.exports = Dish;
`,

  'DishSpec.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DishSpec = sequelize.define('DishSpec', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  dish_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false, comment: '规格名 如：大份/小份' },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false, comment: '该规格的价格' },
  sort_no: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'dish_specs', timestamps: false });

module.exports = DishSpec;
`,

  'DishExtra.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DishExtra = sequelize.define('DishExtra', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  dish_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  group_name: { type: DataTypes.STRING(50), comment: '加料分组名 如：辣度' },
  option_name: { type: DataTypes.STRING(50), allowNull: false, comment: '选项名 如：微辣' },
  extra_price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'dish_extras', timestamps: false });

module.exports = DishExtra;
`,

  'RestaurantTable.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantTable = sequelize.define('RestaurantTable', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  table_no: { type: DataTypes.STRING(20), allowNull: false, comment: '桌台编号 如：A3' },
  area: { type: DataTypes.STRING(50), comment: '区域 如：大厅/包间' },
  capacity: { type: DataTypes.INTEGER, defaultValue: 4, comment: '容纳人数' },
  status: { 
    type: DataTypes.TINYINT, defaultValue: 0,
    comment: '0=空闲 1=使用中 2=待清理' 
  },
  qr_code_url: { type: DataTypes.STRING(255), comment: '二维码图片URL' },
  qr_code_scene: { type: DataTypes.STRING(100), comment: '二维码参数 如：shopId=1&tableNo=A3' },
}, { tableName: 'restaurant_tables' });

module.exports = RestaurantTable;
`,

  'Order.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  order_no: { type: DataTypes.STRING(32), unique: true, allowNull: false, comment: '订单号' },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED },
  user_openid: { type: DataTypes.STRING(64) },
  table_id: { type: DataTypes.BIGINT.UNSIGNED, comment: '桌台ID（堂食）' },
  address_id: { type: DataTypes.BIGINT.UNSIGNED, comment: '地址ID（外卖）' },
  order_type: { 
    type: DataTypes.TINYINT, allowNull: false,
    comment: '1=堂食 2=外卖' 
  },
  status: { 
    type: DataTypes.TINYINT, defaultValue: 0,
    comment: '0=待付款 1=待确认 2=制作中 3=待取/配送中 4=已完成 5=已取消' 
  },
  pay_status: { 
    type: DataTypes.TINYINT, defaultValue: 0,
    comment: '0=未支付 1=已支付 2=已退款' 
  },
  total_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, comment: '商品总金额' },
  discount_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0, comment: '优惠减免' },
  delivery_fee: { type: DataTypes.DECIMAL(10,2), defaultValue: 0, comment: '配送费' },
  pay_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, comment: '实付金额' },
  wx_prepay_id: { type: DataTypes.STRING(128), comment: '微信预支付ID' },
  wx_transaction_id: { type: DataTypes.STRING(64), comment: '微信交易号' },
  remark: { type: DataTypes.STRING(500), comment: '整单备注' },
  reject_reason: { type: DataTypes.STRING(200) },
  estimated_minutes: { type: DataTypes.INTEGER, defaultValue: 20, comment: '预计等待分钟' },
  paid_at: { type: DataTypes.DATE },
  accepted_at: { type: DataTypes.DATE },
  finished_at: { type: DataTypes.DATE },
  canceled_at: { type: DataTypes.DATE },
}, { tableName: 'orders', comment: '订单主表' });

// 生成订单号
Order.generateOrderNo = () => {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return datePart + randomPart;
};

module.exports = Order;
`,

  'OrderItem.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  dish_id: { type: DataTypes.BIGINT.UNSIGNED },
  dish_name: { type: DataTypes.STRING(100), allowNull: false, comment: '快照：菜品名' },
  dish_image: { type: DataTypes.STRING(255), comment: '快照：菜品图片' },
  spec_name: { type: DataTypes.STRING(50), comment: '规格名称' },
  extras: { type: DataTypes.JSON, comment: '加料选项快照 [{name:"微辣",price:0}]' },
  unit_price: { type: DataTypes.DECIMAL(10,2), allowNull: false, comment: '单价（含规格）' },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  subtotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  remark: { type: DataTypes.STRING(200), comment: '单品备注' },
}, { tableName: 'order_items', updatedAt: false });

module.exports = OrderItem;
`,

  'Address.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false, comment: '收货人姓名' },
  phone: { type: DataTypes.STRING(20), allowNull: false, comment: '手机号' },
  province: { type: DataTypes.STRING(50) },
  city: { type: DataTypes.STRING(50) },
  district: { type: DataTypes.STRING(50) },
  detail: { type: DataTypes.STRING(200), allowNull: false, comment: '详细地址' },
  longitude: { type: DataTypes.DECIMAL(10,6) },
  latitude: { type: DataTypes.DECIMAL(10,6) },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'addresses' });

module.exports = Address;
`,

  'Coupon.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  code: { type: DataTypes.STRING(32), unique: true },
  name: { type: DataTypes.STRING(100), comment: '优惠券名称' },
  type: { type: DataTypes.TINYINT, comment: '1=满减 2=折扣 3=无门槛' },
  min_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0, comment: '最低消费' },
  discount_amount: { type: DataTypes.DECIMAL(10,2), comment: '减免金额' },
  discount_rate: { type: DataTypes.DECIMAL(3,2), comment: '折扣率 0.8=8折' },
  total_count: { type: DataTypes.INTEGER, comment: '发放总量，null=无限' },
  used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  start_time: { type: DataTypes.DATE },
  end_time: { type: DataTypes.DATE },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'coupons' });

module.exports = Coupon;
`,

  'Promotion.js': `
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(100), comment: '活动名称' },
  type: { type: DataTypes.TINYINT, comment: '1=满减 2=限时特价' },
  rules: { type: DataTypes.JSON, comment: '[{min:50,discount:5},{min:100,discount:15}]' },
  start_time: { type: DataTypes.DATE },
  end_time: { type: DataTypes.DATE },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'promotions' });

module.exports = Promotion;
`,
};

const modelsDir = path.join(__dirname, '../models');
Object.entries(models).forEach(([filename, content]) => {
  fs.writeFileSync(path.join(modelsDir, filename), content.trimStart());
  console.log('Generated:', filename);
});
console.log('All models generated!');
