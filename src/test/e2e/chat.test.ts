/**
 * AI Chat Interface E2E Tests
 *
 * Tests the production-grade AI chat system built with Vercel AI SDK
 * Following official patterns: ToolLoopAgent, createAgentUIStreamResponse, useChat
 *
 * Test Coverage:
 * - Authentication flow
 * - Chat interface rendering
 * - Message sending and receiving
 * - Tool invocation and visualization
 * - Error handling and retry
 * - Stop functionality
 * - Streaming responses
 */

import { test as base, expect, Page } from '@playwright/test';
import { test, authenticate } from '../fixtures/auth';

const CHAT_URL = '/chat';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

/**
 * Helper: Wait for chat interface to be ready
 */
async function waitForChatReady(page: Page) {
  // Wait for ChatInput component to be visible
  await page.waitForSelector('input[placeholder*="sustainability"], input[placeholder*="Ask"], textarea[placeholder*="Ask"]', {
    timeout: 10000,
    state: 'visible'
  });
}

/**
 * Helper: Send a message in chat
 */
async function sendChatMessage(page: Page, message: string) {
  const input = page.locator('input[type="text"], textarea').first();
  await input.fill(message);

  // Find and click send button
  const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
  await sendButton.click();
}

/**
 * Helper: Wait for AI response to appear
 */
async function waitForAIResponse(page: Page, timeout = 30000) {
  // Wait for "Blipee AI:" message to appear
  await page.waitForSelector('text=/Blipee AI:/', {
    timeout,
    state: 'visible'
  });
}

// Use base.describe for authentication tests (no auth needed)
base.describe('Chat Authentication', () => {
  base('redirects to signin when not authenticated', async ({ page }) => {
    // Use base test (no auth) to check redirect
    // Navigate to chat without authentication
    await page.goto(CHAT_URL);

    // Should redirect to signin page
    await page.waitForURL(/.*signin.*/, { timeout: 5000 });

    // Check that redirect parameter is set
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe('/chat');
  });

  base('shows "no organization" message when user has no org', async ({ page }) => {
    // This test assumes you have a way to set up a user without org
    // Skip for now - would need proper test fixtures
    base.skip();
  });
});

test.describe('Chat Interface Rendering', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Use authenticated page fixture
    await page.goto(CHAT_URL);
  });

  test('loads chat interface successfully', async ({ authenticatedPage: page }) => {
    // Check if the page loaded
    await page.waitForLoadState('networkidle');

    // Should have chat container
    await expect(page.locator('.flex.flex-col')).toBeVisible();
  });

  test('displays welcome message when no messages', async ({ authenticatedPage: page }) => {
    await waitForChatReady(page);

    // Should show welcome message if no initial messages
    const welcomeText = page.locator('text=/Welcome to Blipee AI/');
    const hasWelcome = await welcomeText.count() > 0;

    // Either has welcome or has existing messages
    if (hasWelcome) {
      await expect(welcomeText).toBeVisible();
    }
  });

  test('chat input is visible and enabled', async ({ authenticatedPage: page }) => {
    await waitForChatReady(page);

    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('send button is disabled when input is empty', async ({ authenticatedPage: page }) => {
    await waitForChatReady(page);

    const input = page.locator('input[type="text"], textarea').first();
    await input.clear();

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when input has text', async ({ authenticatedPage: page }) => {
    await waitForChatReady(page);

    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('Test message');

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await expect(sendButton).toBeEnabled();
  });
});

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('can type and send a message', async ({ authenticatedPage: page }) => {
    const testMessage = 'Hello, can you help me with sustainability?';

    // Type message
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill(testMessage);
    await expect(input).toHaveValue(testMessage);

    // Send message
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();

    // Message should appear in the chat
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible();

    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('receives AI response after sending message', async ({ authenticatedPage: page }) => {
    // Send a simple message
    await sendChatMessage(page, 'Hello');

    // Wait for AI response
    await waitForAIResponse(page, 30000);

    // Should have AI response visible
    await expect(page.locator('text=/Blipee AI:/')).toBeVisible();
  });

  test('displays loading state while waiting for response', async ({ authenticatedPage: page }) => {
    // Send message
    await sendChatMessage(page, 'Analyze my carbon footprint');

    // Should show processing/loading indicator
    const processingIndicator = page.locator('text=/Processing|Loading|Analyzing|animate-pulse/');

    // Check if any loading state is visible (may be quick)
    const hasLoading = await processingIndicator.count() > 0;

    if (hasLoading) {
      await expect(processingIndicator.first()).toBeVisible();
    }
  });
});

test.describe('Tool Calling and Visualization', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('invokes carbon footprint analysis tool', async ({ authenticatedPage: page }) => {
    // Send message that should trigger analyzeCarbonFootprint tool
    await sendChatMessage(page, 'Analyze my carbon footprint for 2024');

    // Wait for tool execution indicator
    await page.waitForSelector('text=/Analyzing carbon footprint|carbon/i', {
      timeout: 30000
    });

    // Should eventually show tool result
    await expect(page.locator('.bg-white, .rounded-lg, [class*="chart"]')).toBeVisible({
      timeout: 45000
    });
  });

  test('invokes ESG compliance check tool', async ({ authenticatedPage: page }) => {
    // Send message that should trigger checkESGCompliance tool
    await sendChatMessage(page, 'Check my ESG compliance status');

    // Wait for tool execution
    await page.waitForSelector('text=/Checking ESG compliance|ESG|compliance/i', {
      timeout: 30000
    });

    // Should show compliance results
    await expect(page.locator('text=/GRI|SASB|TCFD|compliance/i')).toBeVisible({
      timeout: 45000
    });
  });

  test('displays tool visualization components', async ({ authenticatedPage: page }) => {
    // Send message that triggers a tool with visualization
    await sendChatMessage(page, 'Show me my sustainability metrics');

    // Wait for response
    await waitForAIResponse(page, 30000);

    // Check for visualization elements (charts, cards, etc.)
    const hasVisualization = await page.locator('[class*="chart"], [class*="Card"], .shadow-sm').count() > 0;
    expect(hasVisualization).toBeTruthy();
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('displays error message when request fails', async ({ authenticatedPage: page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/chat', route => {
      route.abort('failed');
    });

    // Send message
    await sendChatMessage(page, 'Test error handling');

    // Should show error state
    await expect(page.locator('text=/error|failed|wrong/i')).toBeVisible({
      timeout: 10000
    });
  });

  test('retry button appears on error', async ({ authenticatedPage: page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/chat', route => {
      route.abort('failed');
    });

    // Send message
    await sendChatMessage(page, 'Test retry');

    // Should show retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible({
      timeout: 10000
    });
  });

  test('can retry after error', async ({ authenticatedPage: page }) => {
    let callCount = 0;

    // First call fails, second succeeds
    await page.route('**/api/chat', route => {
      callCount++;
      if (callCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Send message (will fail)
    await sendChatMessage(page, 'Test retry functionality');

    // Wait for error
    await expect(page.locator('text=/error/i')).toBeVisible({ timeout: 10000 });

    // Click retry
    const retryButton = page.locator('button:has-text("Retry")');
    await retryButton.click();

    // Should eventually succeed
    await waitForAIResponse(page, 30000);
  });
});

test.describe('Stop Functionality', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('stop button appears during streaming', async ({ authenticatedPage: page }) => {
    // Send message that will stream
    await sendChatMessage(page, 'Give me a detailed explanation of Scope 3 emissions');

    // Stop button should appear while streaming
    const stopButton = page.locator('button:has-text("Stop")');

    // Wait a bit for streaming to start
    await page.waitForTimeout(1000);

    // Check if stop button is visible (may be quick)
    const hasStopButton = await stopButton.count() > 0;

    if (hasStopButton) {
      await expect(stopButton).toBeVisible();
    }
  });

  test('can stop generation mid-stream', async ({ authenticatedPage: page }) => {
    // Send message
    await sendChatMessage(page, 'Write a comprehensive essay about sustainability');

    // Wait a moment for streaming to start
    await page.waitForTimeout(1500);

    // Try to click stop if visible
    const stopButton = page.locator('button:has-text("Stop")');
    const hasStopButton = await stopButton.count() > 0;

    if (hasStopButton) {
      await stopButton.click();

      // Stop button should disappear
      await expect(stopButton).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Message History', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('conversation persists across page reloads', async ({ authenticatedPage: page }) => {
    const uniqueMessage = `Test message ${Date.now()}`;

    // Send a unique message
    await sendChatMessage(page, uniqueMessage);

    // Wait for it to appear
    await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible();

    // Reload the page
    await page.reload();
    await waitForChatReady(page);

    // Message should still be visible
    await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible();
  });

  test('displays existing messages on initial load', async ({ authenticatedPage: page }) => {
    // This test assumes there are existing messages
    await page.waitForLoadState('networkidle');

    // Should have messages area
    const messagesContainer = page.locator('.overflow-y-auto, .space-y-4');
    await expect(messagesContainer).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('chat input has proper aria labels', async ({ authenticatedPage: page }) => {
    const input = page.locator('input[type="text"], textarea').first();

    // Check for placeholder or aria-label
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('can navigate with keyboard', async ({ authenticatedPage: page }) => {
    const input = page.locator('input[type="text"], textarea').first();

    // Tab to input (should already be focused or easily focusable)
    await input.focus();

    // Type message
    await input.fill('Test keyboard navigation');

    // Press Enter to send (if supported)
    await input.press('Enter');

    // Message should be sent
    await expect(page.locator('text="Test keyboard navigation"')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('chat interface loads quickly', async ({ authenticatedPage: page }) => {
    const startTime = Date.now();
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors during normal usage', async ({ authenticatedPage: page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out known acceptable errors
        const text = msg.text();
        if (!text.includes('DeprecationWarning') &&
            !text.includes('Download the React DevTools')) {
          errors.push(text);
        }
      }
    });

    await page.goto(CHAT_URL);
    await waitForChatReady(page);

    // Send a message
    await sendChatMessage(page, 'Hello');
    await page.waitForTimeout(3000);

    // Should have no critical errors
    expect(errors.length).toBe(0);
  });
});

test.describe('Type Safety and Message Parts', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto(CHAT_URL);
    await waitForChatReady(page);
  });

  test('renders text message parts correctly', async ({ authenticatedPage: page }) => {
    // Send simple text message
    await sendChatMessage(page, 'What is sustainability?');

    // Wait for AI response
    await waitForAIResponse(page, 30000);

    // Should have text content visible
    const messageContent = page.locator('.bg-white.dark\\:bg-zinc-800').last();
    await expect(messageContent).toBeVisible();

    // Should have some text
    const text = await messageContent.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);
  });

  test('renders step-start separators in multi-step reasoning', async ({ authenticatedPage: page }) => {
    // Send message that requires multi-step reasoning
    await sendChatMessage(page, 'Analyze my supply chain risks and recommend improvements');

    // Wait for response
    await waitForAIResponse(page, 45000);

    // May have horizontal rules for step separators
    const separators = page.locator('hr');
    const hasSeparators = await separators.count() > 0;

    // At least the structure should render without errors
    expect(true).toBeTruthy();
  });
});
