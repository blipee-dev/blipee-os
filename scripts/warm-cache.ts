#!/usr/bin/env ts-node

import { aiCacheManager } from '../src/lib/ai/cache-strategies';
import { getAICache } from '../src/lib/cache/ai-cache';
import { getDataCache } from '../src/lib/cache/data-cache';

// Common queries to pre-cache
const commonQueries = [
  // Energy & Usage
  'What is our current energy usage?',
  'Show me energy consumption for today',
  'How much energy are we using right now?',
  'What are the peak usage hours?',
  
  // Temperature & Comfort
  'What is the current temperature?',
  'Show me temperature across all zones',
  'Is the HVAC system running efficiently?',
  'What are the comfort levels?',
  
  // Emissions & Sustainability
  'What is our carbon footprint?',
  'Show me emissions data',
  'How are we tracking against our sustainability goals?',
  'What is our scope 1, 2, and 3 emissions?',
  
  // Cost & Savings
  'How much are we spending on energy?',
  'Show me cost savings opportunities',
  'What would happen if we optimize our systems?',
  'How can we reduce costs?',
  
  // Reports & Analytics
  'Generate a sustainability report',
  'Show me this month\'s performance',
  'Compare this month to last month',
  'What are the trends?',
  
  // Recommendations
  'What should we focus on to improve?',
  'Give me recommendations for energy savings',
  'How can we reduce our carbon footprint?',
  'What equipment needs attention?',
];

// Test contexts
const testContexts = [
  { organizationId: 'org-1', buildingId: 'building-1', userId: 'user-1' },
  { organizationId: 'org-2', buildingId: 'building-2', userId: 'user-2' },
  { organizationId: 'org-3', buildingId: 'building-3', userId: 'user-3' },
];

async function warmCache() {
  console.log('🔥 Starting cache warming process...\n');
  
  // Initialize services
  await aiCacheManager.initialize();
  const aiCache = await getAICache();
  const dataCache = await getDataCache();
  
  let warmed = 0;
  let failed = 0;
  
  // Warm cache for each context and query combination
  for (const context of testContexts) {
    console.log(`\n📍 Warming cache for org: ${context.organizationId}`);
    
    for (const query of commonQueries) {
      try {
        // Check if already cached
        const existing = await aiCacheManager.get(query, context);
        
        if (!existing) {
          // Simulate AI response
          const mockResponse = {
            message: `Mock response for: ${query}`,
            suggestions: [
              'Tell me more',
              'Show details',
              'What else?',
            ],
            components: [],
          };
          
          // Cache it
          await aiCacheManager.set(query, context, mockResponse);
          warmed++;
          process.stdout.write('.');
        } else {
          process.stdout.write('✓');
        }
      } catch (error) {
        failed++;
        process.stdout.write('✗');
      }
    }
  }
  
  console.log('\n\n✅ Cache warming complete!');
  console.log(`   Warmed: ${warmed}`);
  console.log(`   Already cached: ${commonQueries.length * testContexts.length - warmed - failed}`);
  console.log(`   Failed: ${failed}`);
  
  // Show cache metrics
  const metrics = aiCacheManager.getMetrics();
  console.log('\n📊 Cache Metrics:');
  console.log(`   Hit Rate: ${metrics.hitRate}%`);
  console.log(`   Total Requests: ${metrics.totalRequests}`);
  console.log(`   Cache Hits: ${metrics.cacheHits}`);
  console.log(`   Cache Misses: ${metrics.cacheMisses}`);
}

// Run cache warming
warmCache().catch(console.error);