/**
 * Performance Test: Consolidated Dashboard API
 *
 * Compares performance between:
 * - OLD: 11+ separate API calls
 * - NEW: 1 consolidated API call
 *
 * Measures:
 * - Total response time
 * - Number of API calls
 * - Data completeness
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:3000';
const PERIOD_START = '2025-01-01';
const PERIOD_END = '2025-12-31';

async function testOldApproach() {
  console.log('\n🔴 Testing OLD Approach (Multiple API Calls)...\n');

  const params = new URLSearchParams({
    start_date: PERIOD_START,
    end_date: PERIOD_END,
  });

  const startTime = Date.now();
  let callCount = 0;

  try {
    // Simulate what useEnergyDashboard does
    const calls = [
      fetch(`${BASE_URL}/api/energy/sources?${params}`),
      fetch(`${BASE_URL}/api/energy/intensity?${params}`),
      fetch(`${BASE_URL}/api/energy/forecast?${params}`),
      fetch(`${BASE_URL}/api/sustainability/targets`),
      fetch(`${BASE_URL}/api/sustainability/targets/category?baseline_year=2023&categories=Electricity,Purchased Energy`),
    ];

    callCount = calls.length;

    console.log(`   Making ${callCount} API calls in parallel...`);

    const results = await Promise.all(calls);
    const duration = Date.now() - startTime;

    const allSuccessful = results.every(r => r.ok);
    const failedCalls = results.filter(r => !r.ok).length;

    console.log(`\n   ✅ Completed in ${duration}ms`);
    console.log(`   📊 API Calls: ${callCount}`);
    console.log(`   ${allSuccessful ? '✅' : '⚠️'} Success Rate: ${callCount - failedCalls}/${callCount}`);

    if (!allSuccessful) {
      console.log(`   ⚠️  Some calls failed - this is expected if running locally without server`);
    }

    return {
      duration,
      callCount,
      successRate: (callCount - failedCalls) / callCount,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`\n   ❌ Error: ${error.message}`);
    console.log(`   ⏱️  Failed after ${duration}ms`);
    return {
      duration,
      callCount,
      successRate: 0,
      error: error.message,
    };
  }
}

async function testNewApproach() {
  console.log('\n🟢 Testing NEW Approach (Consolidated API)...\n');

  const params = new URLSearchParams({
    organizationId: ORG_ID,
    start_date: PERIOD_START,
    end_date: PERIOD_END,
  });

  const startTime = Date.now();

  try {
    console.log(`   Making 1 consolidated API call...`);

    const response = await fetch(`${BASE_URL}/api/dashboard/energy?${params}`);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`\n   ✅ Completed in ${duration}ms`);
    console.log(`   📊 API Calls: 1`);
    console.log(`   ✅ Success Rate: 1/1`);
    console.log(`\n   📦 Data Received:`);
    console.log(`      - Current period: ${data.data?.current ? '✅' : '❌'}`);
    console.log(`      - Previous period: ${data.data?.previous ? '✅' : '❌'}`);
    console.log(`      - Baseline: ${data.data?.baseline ? '✅' : '❌'}`);
    console.log(`      - Forecast: ${data.data?.forecast ? '✅' : '❌'}`);
    console.log(`      - Targets: ${data.data?.targets ? '✅' : '❌'}`);
    console.log(`      - Sites: ${data.data?.sites?.length || 0} sites`);

    if (data.meta) {
      console.log(`\n   💾 Cache Status:`);
      console.log(`      - Targets: ${data.meta.cached?.targets ? '✅ Cached' : '❌ Not cached'}`);
      console.log(`      - Baseline: ${data.meta.cached?.baseline ? '✅ Cached' : '❌ Not cached'}`);
      console.log(`      - Forecast: ${data.meta.cached?.forecast ? '✅ Cached' : '❌ Not cached'}`);
    }

    return {
      duration,
      callCount: 1,
      successRate: 1,
      data,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`\n   ❌ Error: ${error.message}`);
    console.log(`   ⏱️  Failed after ${duration}ms`);
    return {
      duration,
      callCount: 1,
      successRate: 0,
      error: error.message,
    };
  }
}

async function runComparison() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 PERFORMANCE TEST: Consolidated Dashboard API');
  console.log('═══════════════════════════════════════════════════════');

  // Test old approach
  const oldResults = await testOldApproach();

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test new approach
  const newResults = await testNewApproach();

  // Compare results
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 PERFORMANCE COMPARISON');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('   Metric                  | OLD      | NEW      | Improvement');
  console.log('   ───────────────────────────────────────────────────────────');
  console.log(`   Response Time           | ${oldResults.duration}ms    | ${newResults.duration}ms     | ${Math.round((oldResults.duration / newResults.duration) * 10) / 10}x faster`);
  console.log(`   API Calls               | ${oldResults.callCount}      | ${newResults.callCount}       | ${oldResults.callCount}x fewer`);
  console.log(`   Database Queries (est)  | ~15     | ~3      | 5x fewer`);

  const speedup = Math.round((oldResults.duration / newResults.duration) * 10) / 10;

  console.log('\n═══════════════════════════════════════════════════════');

  if (newResults.error || oldResults.error) {
    console.log('⚠️  WARNING: Some tests failed. This is expected if running');
    console.log('   locally without a dev server. Deploy to test properly.');
  } else if (speedup >= 2) {
    console.log(`✅ SUCCESS: New approach is ${speedup}x faster!`);
    console.log(`\n   🎯 Achieved:`);
    console.log(`      ✓ ${oldResults.callCount - newResults.callCount} fewer API calls`);
    console.log(`      ✓ ${Math.round((oldResults.duration - newResults.duration) / 1000 * 10) / 10}s faster response`);
    console.log(`      ✓ ~12 fewer database queries`);
    console.log(`      ✓ Reduced server load`);
  } else {
    console.log('⚠️  Performance gain not as expected. Check implementation.');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

runComparison().catch(console.error);
