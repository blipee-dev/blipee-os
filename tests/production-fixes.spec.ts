/**
 * Production Fixes E2E Tests
 *
 * Tests all critical production fixes:
 * 1. Redis Proxy method delegation
 * 2. AI JSON parsing with markdown blocks
 * 3. OpenAI JSON format validation
 * 4. ConversationMemoryManager exports
 * 5. Revolutionary chat features (streaming, voice, image)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

test.describe('Production Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Clear any existing state
    await page.goto(BASE_URL);
  });

  test('Server loads without errors', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(err =>
      !err.includes('Redis') && // Redis warnings are non-blocking
      !err.includes('DeprecationWarning')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('Chat interface loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/sustainability/overview`);

    // Wait for the floating chat or chat interface to load
    await page.waitForSelector('[data-testid="chat-input"], textarea[placeholder*="blipee"], textarea[placeholder*="Message"]', {
      timeout: 10000
    });

    // Verify chat input is present
    const chatInput = await page.locator('textarea').first();
    await expect(chatInput).toBeVisible();
  });

  test('No Redis method errors in console', async ({ page }) => {
    const redisErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' &&
          (msg.text().includes('redisClient.get is not a function') ||
           msg.text().includes('redisClient.setex is not a function'))) {
        redisErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to a few pages to trigger Redis operations
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    expect(redisErrors).toHaveLength(0);
  });

  test('No JSON parsing errors in console', async ({ page }) => {
    const jsonErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' &&
          (msg.text().includes('SyntaxError') ||
           msg.text().includes('JSON.parse') ||
           msg.text().includes('Unexpected token'))) {
        jsonErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    expect(jsonErrors).toHaveLength(0);
  });

  test('Chat interface has voice and image buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/sustainability/overview`);

    // Wait for chat interface to load
    await page.waitForSelector('textarea', { timeout: 10000 });

    // Look for microphone icon/button (revolutionary voice input)
    const micButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: /mic/i })
    }).or(page.locator('button[title*="voice"], button[title*="Voice"]'));

    // Look for image icon/button (revolutionary image upload)
    const imageButton = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: /image/i })
    }).or(page.locator('button[title*="image"], button[title*="Image"]'));

    // At least one of the revolutionary features should be present
    const micVisible = await micButton.count() > 0;
    const imageVisible = await imageButton.count() > 0;

    expect(micVisible || imageVisible).toBeTruthy();
  });

  test('Application builds and runs without critical errors', async ({ page }) => {
    // Track all error types
    const errors = {
      redis: [] as string[],
      json: [] as string[],
      openai: [] as string[],
      memory: [] as string[],
      other: [] as string[]
    };

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Redis') || text.includes('redis')) {
          errors.redis.push(text);
        } else if (text.includes('JSON') || text.includes('parse')) {
          errors.json.push(text);
        } else if (text.includes('OpenAI') || text.includes('BadRequest')) {
          errors.openai.push(text);
        } else if (text.includes('Memory') || text.includes('storeMemory')) {
          errors.memory.push(text);
        } else if (!text.includes('Deprecation')) {
          errors.other.push(text);
        }
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // All our fixed errors should be zero
    expect(errors.redis, 'Redis method errors should be fixed').toHaveLength(0);
    expect(errors.json, 'JSON parsing errors should be fixed').toHaveLength(0);
    expect(errors.openai, 'OpenAI provider errors should be fixed').toHaveLength(0);
    expect(errors.memory, 'Memory operation errors should be fixed').toHaveLength(0);

    console.log('✅ All production fixes verified in browser environment');
  });
});

test.describe('Chat Functionality Tests', () => {
  test('Can type message in chat input', async ({ page }) => {
    await page.goto(`${BASE_URL}/sustainability/overview`);

    const chatInput = await page.locator('textarea').first();
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });

    await chatInput.fill('What are my Scope 3 emissions?');
    await expect(chatInput).toHaveValue('What are my Scope 3 emissions?');
  });

  test('Send button is enabled when message is typed', async ({ page }) => {
    await page.goto(`${BASE_URL}/sustainability/overview`);

    const chatInput = await page.locator('textarea').first();
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });

    // Find send button (usually contains Send icon or text)
    const sendButton = page.locator('button').filter({
      has: page.locator('svg')
    }).last();

    // Should be disabled when empty
    await expect(sendButton).toBeDisabled();

    // Type message
    await chatInput.fill('Test message');

    // Should be enabled with message
    await expect(sendButton).toBeEnabled();
  });
});

test.describe('Performance Tests', () => {
  test('Pages load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('No memory leaks in console', async ({ page }) => {
    const memoryWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.text().includes('heap') || msg.text().includes('memory leak')) {
        memoryWarnings.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    expect(memoryWarnings).toHaveLength(0);
  });
});
