#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { redisClient } from '../src/lib/cache/redis-client';

async function testRedis() {
  console.log('🔧 Testing Redis connection...\n');

  try {
    // Test connection
    const client = await redisClient.getClient();
    const pong = await client.ping();
    console.log('✅ Redis connected:', pong);

    // Test basic operations
    console.log('\n📝 Testing basic operations...');
    
    // Set
    await client.set('test:key', 'Hello Redis!', 'EX', 60);
    console.log('✅ SET test:key = "Hello Redis!"');

    // Get
    const value = await client.get('test:key');
    console.log('✅ GET test:key =', value);

    // Delete
    await client.del('test:key');
    console.log('✅ DEL test:key');

    // Test cache service
    console.log('\n🚀 Testing cache service...');
    const { cache } = await import('../src/lib/cache');
    
    // Cache some data
    const testData = { message: 'Testing cache', timestamp: Date.now() };
    await cache.set('test:cache', testData, { ttl: 60 });
    console.log('✅ Cached test data');

    // Retrieve
    const cached = await cache.get('test:cache');
    console.log('✅ Retrieved:', cached);

    // Stats
    const stats = cache.getStats();
    console.log('\n📊 Cache Statistics:');
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
    console.log(`  Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);

    console.log('\n✅ Redis is working correctly!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Redis connection failed:', error);
    console.log('\n💡 To fix this:');
    console.log('1. Install Redis: brew install redis');
    console.log('2. Start Redis: brew services start redis');
    console.log('3. Or use Docker: docker run -d -p 6379:6379 redis:7-alpine');
    console.log('4. Check your .env settings');
    process.exit(1);
  }
}

testRedis();