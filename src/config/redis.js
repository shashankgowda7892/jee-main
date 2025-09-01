const redis = require('redis');
require('dotenv').config();

const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const client = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  },
  password: REDIS_PASSWORD
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
