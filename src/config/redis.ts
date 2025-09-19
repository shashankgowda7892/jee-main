// import Redis from 'ioredis';

// const REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);
// const REDIS_HOST: string = process.env.REDIS_HOST || 'localhost';
// const REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;

// const client = new Redis({
//   host: REDIS_HOST,
//   port: REDIS_PORT,
//   password: REDIS_PASSWORD,
//   enableOfflineQueue: false,
//   maxRetriesPerRequest: 3,
//   lazyConnect: true
// });

// client.on('connect', () => {
//   console.log('✅ Redis client connected');
// });

// client.on('error', (err: Error) => {
//   console.error('❌ Redis connection error:', err);
// });

// export const connectRedis = async (): Promise<void> => {
//   try {
//     await client.connect();
//   } catch (err) {
//     console.error('❌ Failed to connect Redis:', err);
//     throw err;
//   }
// };

// export { client };
