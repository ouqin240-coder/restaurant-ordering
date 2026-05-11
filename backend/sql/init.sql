-- 餐馆点餐系统 初始化 SQL
-- 数据库字符集：utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 插入初始商家管理员账号 (密码: admin123 的 bcrypt hash)
INSERT IGNORE INTO `merchants` (`username`, `password`, `name`, `role`, `isActive`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '超级管理员', 'admin', 1),
('cashier', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '收银员', 'cashier', 1);

-- 初始化桌台
INSERT IGNORE INTO `tables` (`tableNo`, `area`, `capacity`, `status`) VALUES
('A1', 'A区', 4, 'free'),
('A2', 'A区', 4, 'free'),
('A3', 'A区', 4, 'free'),
('A4', 'A区', 6, 'free'),
('B1', 'B区', 2, 'free'),
('B2', 'B区', 2, 'free'),
('B3', 'B区', 4, 'free'),
('VIP1', 'VIP包间', 10, 'free'),
('VIP2', 'VIP包间', 8, 'free');

-- 初始化店铺设置
INSERT IGNORE INTO `shop_settings` (`name`, `isOpen`, `openTime`, `closeTime`, `minDeliveryAmount`, `deliveryFee`, `deliveryRadius`) VALUES
('美味餐厅', 1, '10:00', '22:00', 20.00, 3.00, 5000);

-- 初始化菜品分类
INSERT IGNORE INTO `categories` (`id`, `name`, `sortNo`, `isActive`) VALUES
(1, '招牌推荐', 0, 1),
(2, '热菜', 1, 1),
(3, '凉菜', 2, 1),
(4, '汤类', 3, 1),
(5, '主食', 4, 1),
(6, '饮品', 5, 1);

-- 初始化示例菜品
INSERT IGNORE INTO `dishes` (`categoryId`, `name`, `description`, `price`, `status`, `isRecommend`, `monthlySales`, `tags`, `sortNo`) VALUES
(1, '招牌红烧肉', '选用五花肉，慢火炖煮，入口即化', 58.00, 1, 1, 328, '招牌,猪肉', 1),
(1, '秘制烤鸭', '北京风味，皮脆肉嫩', 88.00, 1, 1, 256, '招牌,鸭肉', 2),
(2, '鱼香肉丝', '经典川菜，酸甜微辣', 28.00, 1, 0, 412, '川菜,下饭', 1),
(2, '宫保鸡丁', '花生香脆，微辣爽口', 32.00, 1, 0, 389, '川菜,微辣', 2),
(2, '麻婆豆腐', '麻辣鲜香，豆腐嫩滑', 22.00, 1, 0, 521, '川菜,麻辣', 3),
(2, '糖醋里脊', '外酥内嫩，酸甜可口', 38.00, 1, 0, 267, '下饭', 4),
(3, '凉拌黄瓜', '清爽解腻，蒜香浓郁', 12.00, 1, 0, 634, '素食,凉菜', 1),
(3, '皮蛋豆腐', '嫩滑爽口', 15.00, 1, 0, 445, '凉菜', 2),
(4, '番茄蛋花汤', '家常口味，营养美味', 16.00, 1, 0, 312, '汤', 1),
(4, '酸辣汤', '酸辣开胃，暖胃暖心', 18.00, 1, 0, 289, '汤,微辣', 2),
(5, '白米饭', '新鲜蒸制', 3.00, 1, 0, 1024, '主食', 1),
(5, '蛋炒饭', '金包银，颗粒分明', 18.00, 1, 0, 456, '主食', 2),
(5, '手擀面', '劲道爽滑', 16.00, 1, 0, 234, '主食,面食', 3),
(6, '可口可乐', '罐装 330ml', 5.00, 1, 0, 567, '饮品,碳酸', 1),
(6, '柠檬水', '鲜榨，清爽酸甜', 12.00, 1, 0, 345, '饮品,鲜榨', 2),
(6, '冰峰汽水', '陕西特色', 6.00, 1, 0, 123, '饮品', 3);

SET FOREIGN_KEY_CHECKS = 1;
