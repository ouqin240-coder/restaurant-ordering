const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();

// ─── CORS ───────────────────────────────────────────────
const allowedOrigins = [
  process.env.CUSTOMER_H5_URL || 'http://localhost:5173',
  process.env.MERCHANT_ADMIN_URL || 'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true,
}));

// ─── 基础中间件 ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志（生产环境输出到 winston）
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) }
  }));
}

// 静态文件（上传的图片，本地开发用）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── 路由 ────────────────────────────────────────────────
app.use('/api/v1', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 错误处理 ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
