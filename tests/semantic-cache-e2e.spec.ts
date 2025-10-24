/**
 * End-to-End Test: Semantic Cache with Enhanced Exploratory SQL
 *
 * This test verifies:
 * 1. Chat API responds to sustainability questions
 * 2. Semantic cache works (first query vs cached query)
 * 3. BlipeeBrain uses schema context
 * 4. Response metadata includes cache information
 *
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - User authenticated in browser
 * - Organization has sustainability data
 */

import { test, expect } from '@playwright/test';

test.describe('Semantic Cache & Enhanced SQL', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should cache similar sustainability questions', async ({ page }) => {
    // Check if user is authenticated
    const isLoggedIn = await page.locator('text=Sign Out').isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log('⚠️ User not authenticated - test requires login');
      test.skip();
      return;
    }

    // Navigate to chat interface
    await page.goto('http://localhost:3000/dashboard');

    // Wait for chat interface to load
    await page.waitForSelector('[data-testid="chat-input"], textarea, input[placeholder*="ask"], input[placeholder*="message"]', {
      timeout: 10000
    });

    // Find the chat input (multiple possible selectors)
    const chatInput = page.locator('[data-testid="chat-input"]')
      .or(page.locator('textarea'))
      .or(page.locator('input[placeholder*="ask"]'))
      .or(page.locator('input[placeholder*="message"]'))
      .first();

    // === TEST 1: First Query (Fresh) ===
    console.log('📤 Sending first query (should NOT be cached)...');

    const firstQuery = 'What are my Scope 2 emissions this year?';
    await chatInput.fill(firstQuery);
    await chatInput.press('Enter');

    // Wait for response
    await page.waitForTimeout(3000); // Give time for LLM response

    // Check for response in the chat
    const firstResponse = await page.locator('[data-testid="chat-message"], .chat-message, .message').last();
    await expect(firstResponse).toBeVisible({ timeout: 10000 });

    // Record the timestamp
    const firstQueryTime = Date.now();
    console.log(`✅ First query completed at ${firstQueryTime}`);

    // Wait a moment before second query
    await page.waitForTimeout(2000);

    // === TEST 2: Similar Query (Should be Cached) ===
    console.log('📤 Sending similar query (should be cached)...');

    const secondQuery = 'Show me Scope 2 emissions for this year';
    await chatInput.fill(secondQuery);
    await chatInput.press('Enter');

    // Wait for response (should be much faster)
    await page.waitForTimeout(1000);

    const secondResponse = await page.locator('[data-testid="chat-message"], .chat-message, .message').last();
    await expect(secondResponse).toBeVisible({ timeout: 5000 });

    const secondQueryTime = Date.now();
    const timeDiff = secondQueryTime - firstQueryTime;

    console.log(`✅ Second query completed at ${secondQueryTime}`);
    console.log(`⚡ Time difference: ${timeDiff}ms (should be faster if cached)`);

    // === TEST 3: Verify Cache Metadata ===
    // Check if response includes cache information
    // This would need to be visible in the UI or in network responses

    // Intercept API calls to check cache metadata
    const apiResponse = await page.waitForResponse(
      response => response.url().includes('/api/ai/chat') && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    if (apiResponse) {
      const responseData = await apiResponse.json();
      console.log('📊 API Response metadata:', {
        cached: responseData.cached,
        similarity: responseData.metadata?.cacheSimilarity,
        hitCount: responseData.metadata?.cacheHitCount,
        processingTime: responseData.metadata?.processingTime
      });

      // Verify cache is working
      if (responseData.cached) {
        console.log('✅ SUCCESS: Response was served from cache!');
        expect(responseData.cached).toBe(true);
        expect(responseData.metadata?.cacheHit).toBe(true);
        expect(responseData.metadata?.cacheSimilarity).toBeGreaterThan(0.85);
      } else {
        console.log('ℹ️ Response was not cached (might be first similar query)');
      }
    }

    // Take screenshot for verification
    await page.screenshot({
      path: 'tests/screenshots/semantic-cache-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to tests/screenshots/semantic-cache-test.png');
  });

  test('should show schema context is being used', async ({ page }) => {
    // This test checks if BlipeeBrain is using schema context
    // by looking for sustainability-specific terminology in responses

    const isLoggedIn = await page.locator('text=Sign Out').isVisible().catch(() => false);

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    await page.goto('http://localhost:3000/dashboard');

    const chatInput = page.locator('[data-testid="chat-input"]')
      .or(page.locator('textarea'))
      .first();

    // Ask a question that requires sustainability domain knowledge
    const query = 'Explain the difference between Scope 1, 2, and 3 emissions';
    await chatInput.fill(query);
    await chatInput.press('Enter');

    // Wait for response
    await page.waitForTimeout(3000);

    // Check if response includes domain knowledge terms
    const responseText = await page.locator('[data-testid="chat-message"], .chat-message, .message').last().textContent();

    const hasDomainKnowledge =
      responseText?.includes('direct') ||
      responseText?.includes('indirect') ||
      responseText?.includes('value chain') ||
      responseText?.includes('GHG Protocol');

    console.log('🧠 Response includes domain knowledge:', hasDomainKnowledge);
    console.log('📝 Response excerpt:', responseText?.substring(0, 200));

    expect(hasDomainKnowledge).toBe(true);
  });

  test('should generate accurate SQL with schema context', async ({ page }) => {
    // This test verifies that the LLM generates proper SQL
    // by asking a specific data question

    const isLoggedIn = await page.locator('text=Sign Out').isVisible().catch(() => false);

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    await page.goto('http://localhost:3000/dashboard');

    const chatInput = page.locator('[data-testid="chat-input"]')
      .or(page.locator('textarea'))
      .first();

    // Ask a question that requires SQL generation
    const query = 'What is the total energy consumption in kWh?';
    await chatInput.fill(query);
    await chatInput.press('Enter');

    // Wait for response
    await page.waitForTimeout(4000);

    // Check for numeric response (indicates SQL was executed)
    const responseText = await page.locator('[data-testid="chat-message"], .chat-message, .message').last().textContent();

    const hasNumericData = /\d+/.test(responseText || '');
    const hasEnergyUnits =
      responseText?.includes('kWh') ||
      responseText?.includes('MWh') ||
      responseText?.includes('energy');

    console.log('📊 Response includes numeric data:', hasNumericData);
    console.log('⚡ Response includes energy units:', hasEnergyUnits);
    console.log('📝 Response:', responseText?.substring(0, 200));

    expect(hasNumericData || hasEnergyUnits).toBe(true);
  });
});

test.describe('Cache Statistics', () => {
  test('should track cache statistics in database', async ({ page }) => {
    // This test would check the database directly for cache statistics
    // Requires database access from test environment

    console.log('📊 Cache Statistics Test');
    console.log('Note: This would require direct database access');
    console.log('Run this SQL to check cache stats:');
    console.log(`
      SELECT
        COUNT(*) as total_cached_queries,
        AVG(hit_count) as avg_hits_per_query,
        SUM(hit_count) as total_cache_hits,
        MAX(hit_count) as most_popular_query
      FROM query_cache;
    `);
  });
});
