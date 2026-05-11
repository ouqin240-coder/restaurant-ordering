require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./websocket/socket');
const { sequelize } = require('./models');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    logger.info('数据库连接成功');

    // 同步模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('数据库模型同步完成');
    }

    // 创建 HTTP 服务器
    const server = http.createServer(app);

    // 初始化 WebSocket
    initSocket(server);

    server.listen(PORT, () => {
      logger.info(`服务器启动成功，端口: ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV}`);
    });

    // 优雅关闭
    process.on('SIGTERM', async () => {
      logger.info('收到 SIGTERM，开始优雅关闭...');
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

bootstrap();
