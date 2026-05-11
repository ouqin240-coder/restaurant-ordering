const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis 连接成功'));
redis.on('error', (err) => logger.error('Redis 连接错误:', err));

// 封装常用操作
const cache = {
  async get(key) {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  },
  async set(key, value, ttl = 300) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },
  async del(key) {
    await redis.del(key);
  },
  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  },
  // 分布式锁
  async lock(key, ttl = 10) {
    const result = await redis.set(`lock:${key}`, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  },
  async unlock(key) {
    await redis.del(`lock:${key}`);
  },
};

module.exports = { redis, cache };
