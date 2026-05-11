const sequelize = require('../config/database');

// 导入所有模型
const Shop = require('./Shop');
const User = require('./User');
const Category = require('./Category');
const Dish = require('./Dish');
const DishSpec = require('./DishSpec');
const DishExtra = require('./DishExtra');
const RestaurantTable = require('./RestaurantTable');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Address = require('./Address');
const Coupon = require('./Coupon');
const Promotion = require('./Promotion');

// ─── 关联关系 ────────────────────────────────────────────

// Shop - Category
Shop.hasMany(Category, { foreignKey: 'shop_id', as: 'categories' });
Category.belongsTo(Shop, { foreignKey: 'shop_id' });

// Category - Dish
Category.hasMany(Dish, { foreignKey: 'category_id', as: 'dishes' });
Dish.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Shop - Dish
Shop.hasMany(Dish, { foreignKey: 'shop_id' });
Dish.belongsTo(Shop, { foreignKey: 'shop_id' });

// Dish - DishSpec
Dish.hasMany(DishSpec, { foreignKey: 'dish_id', as: 'specs' });
DishSpec.belongsTo(Dish, { foreignKey: 'dish_id' });

// Dish - DishExtra
Dish.hasMany(DishExtra, { foreignKey: 'dish_id', as: 'extras' });
DishExtra.belongsTo(Dish, { foreignKey: 'dish_id' });

// Shop - RestaurantTable
Shop.hasMany(RestaurantTable, { foreignKey: 'shop_id', as: 'tables' });
RestaurantTable.belongsTo(Shop, { foreignKey: 'shop_id' });

// Order associations
Shop.hasMany(Order, { foreignKey: 'shop_id' });
Order.belongsTo(Shop, { foreignKey: 'shop_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

RestaurantTable.hasMany(Order, { foreignKey: 'table_id' });
Order.belongsTo(RestaurantTable, { foreignKey: 'table_id', as: 'table' });

Address.hasMany(Order, { foreignKey: 'address_id' });
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });

// Order - OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Dish.hasMany(OrderItem, { foreignKey: 'dish_id' });
OrderItem.belongsTo(Dish, { foreignKey: 'dish_id' });

// User - Address
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Shop,
  User,
  Category,
  Dish,
  DishSpec,
  DishExtra,
  RestaurantTable,
  Order,
  OrderItem,
  Address,
  Coupon,
  Promotion,
};
