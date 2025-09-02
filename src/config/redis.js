const Redis = require('ioredis');
require('dotenv').config();

const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const client = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

client.on('connect', () => {
  console.log('✅ Redis client connected');
});

client.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

const connectRedis = async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('❌ Failed to connect Redis:', err);
  }
};

module.exports = { client, connectRedis };
