#!/usr/bin/env tsx
/**
 * Debug Upstash Redis Response Format
 * Quick test to understand Upstash Redis API responses
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { Redis } from '@upstash/redis';

async function debugUpstashRedis() {
  console.log('🔍 Debugging Upstash Redis API responses...\n');

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    console.log('✅ Connected to Upstash Redis');

    // Clear any existing test data
    await redis.del('debug:queue');

    // Test 1: Basic zadd and zpopmax
    console.log('\n📊 Test 1: Basic zadd and zpopmax');
    
    const testData = JSON.stringify({ id: 'test-123', message: 'hello world' });
    
    // Add to sorted set
    await redis.zadd('debug:queue', { score: 1000, member: testData });
    console.log('✅ Added test data to sorted set');
    
    // Check what's in the set
    const allItems = await redis.zrange('debug:queue', 0, -1, { withScores: true });
    console.log('📋 Items in set:', allItems);
    
    // Try zpopmax
    const popped = await redis.zpopmax('debug:queue', 1);
    console.log('📤 Popped item:', popped);
    console.log('📤 Popped item type:', typeof popped);
    console.log('📤 Popped item structure:', JSON.stringify(popped, null, 2));
    
    if (Array.isArray(popped) && popped.length > 0) {
      console.log('📤 First element:', popped[0]);
      console.log('📤 First element type:', typeof popped[0]);
    }

    // Test 2: Multiple items with different scores
    console.log('\n📊 Test 2: Multiple items with priority scores');
    
    const items = [
      { data: JSON.stringify({ id: 'low', priority: 'low' }), score: 1000 },
      { data: JSON.stringify({ id: 'high', priority: 'high' }), score: 100000 },
      { data: JSON.stringify({ id: 'critical', priority: 'critical' }), score: 1000000 },
      { data: JSON.stringify({ id: 'normal', priority: 'normal' }), score: 10000 }
    ];
    
    // Add all items
    for (const item of items) {
      await redis.zadd('debug:queue', { score: item.score, member: item.data });
    }
    
    console.log('✅ Added 4 items with different priorities');
    
    // Check order
    const orderedItems = await redis.zrange('debug:queue', 0, -1, { rev: true, withScores: true });
    console.log('📋 Items ordered by priority (high to low):');
    orderedItems.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item} (type: ${typeof item})`);
    });
    
    // Pop items one by one
    console.log('\n📤 Popping items in priority order:');
    for (let i = 0; i < 4; i++) {
      const popped = await redis.zpopmax('debug:queue', 1);
      console.log(`  Pop ${i + 1}:`, popped);
      
      if (Array.isArray(popped) && popped.length > 0) {
        try {
          const parsed = JSON.parse(popped[0]);
          console.log(`    Parsed: ${parsed.id} (${parsed.priority})`);
        } catch (error) {
          console.log(`    Parse error: ${error}`);
        }
      }
    }

    // Test 3: Hash operations
    console.log('\n📊 Test 3: Hash operations (for processing queue)');
    
    await redis.hset('debug:processing', {
      'test-1': JSON.stringify({ id: 'test-1', status: 'processing' }),
      'test-2': JSON.stringify({ id: 'test-2', status: 'processing' })
    });
    
    const hashValue = await redis.hget('debug:processing', 'test-1');
    console.log('📋 Hash get result:', hashValue);
    console.log('📋 Hash get type:', typeof hashValue);
    
    const hashLen = await redis.hlen('debug:processing');
    console.log('📋 Hash length:', hashLen);

    // Cleanup
    await redis.del('debug:queue');
    await redis.del('debug:processing');
    
    console.log('\n✅ Debug testing completed successfully!');

  } catch (error) {
    console.error('❌ Debug testing failed:', error);
    throw error;
  }
}

// Run the debug test
if (require.main === module) {
  debugUpstashRedis()
    .then(() => {
      console.log('\n🎉 Debug testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Debug testing failed:', error);
      process.exit(1);
    });
}

export { debugUpstashRedis };