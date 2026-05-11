# 老末烧烤铺 - 微信扫码点餐系统

> "解决不了人生的难题，至少先解决今晚的饥饿"

一款基于 Vue3 + NestJS + MySQL 的全栈微信扫码点餐系统，支持堂食和外卖，包含顾客端 H5 和商家管理后台。暗色烧烤主题，情绪化菜品分类。

## 功能特性

### 顾客端（H5 移动端）
- 微信扫码点餐，支持堂食/外卖切换
- 暗色烧烤主题，情绪化菜品分类（犒劳自己、被老板骂了、一个人静静...）
- 购物车实时计算，优惠券自动抵扣
- 订单全流程追踪（下单 - 接单 - 制作 - 出餐 - 完成）
- 菜品图片点击放大预览

### 商家后台（PC 管理端）
- 营业概览（营收趋势图、热销榜、待处理订单数）
- 订单管理（接单/拒单/出餐，Tab 状态筛选）
- 菜品管理（分类管理、图片上传、上下架）
- 桌台管理（区域划分、二维码生成下载）
- 营业设置（营业时间、外卖配置、自动接单）
- 优惠券管理（批量生成、批量删除）

## 技术栈

| 模块 | 技术 |
|------|------|
| 顾客端 H5 | Vue 3 + Vant 4 + Pinia + Vue Router |
| 商家后台 | Vue 3 + Element Plus + Pinia + ECharts |
| 后端 API | NestJS + TypeORM + JWT + Socket.IO |
| 数据库 | MySQL 8.0 + Redis |
| 部署 | Docker Compose（5 个容器） |

## 快速开始

### 前置要求
- Docker Desktop（已安装并运行）
- Git

### 1. 克隆项目

    git clone https://github.com/your-username/restaurant-ordering.git
    cd restaurant-ordering

### 2. 配置环境变量

    cp .env.example .env

编辑 .env 修改密码和密钥（或保持默认值用于本地开发）

### 3. 一键启动

    docker-compose up -d --build

等待约 2-3 分钟，所有服务启动完毕后：

| 服务 | 地址 |
|------|------|
| 顾客端 | http://localhost:8080/?table=A3 |
| 商家后台 | http://localhost:8081 |
| 后端 API | http://localhost:3000 |

## 开发说明

- 微信支付为 Mock 模式，生产环境需对接微信支付 API
- 微信登录为 Mock 模式（code 以 mock_ 开头跳过 OAuth）
- 图片上传限制 20MB
- 默认商家账号：admin / admin123
- 数据库时区：Asia/Shanghai (UTC+8)

## License

MIT
