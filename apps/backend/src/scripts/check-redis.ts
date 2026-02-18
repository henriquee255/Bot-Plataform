import { Redis } from 'ioredis';

async function checkRedis() {
    console.log('Checking Redis connection...');
    const redis = new Redis('redis://localhost:6379');

    try {
        await redis.ping();
        console.log('Redis connected successfully!');
    } catch (err) {
        console.error('Redis connection failed:', err);
    } finally {
        redis.disconnect();
    }
}

checkRedis();
