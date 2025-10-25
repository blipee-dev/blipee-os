/**
 * Test: Conversation Continuity in SimpleChatInterface
 *
 * Verify that blipee maintains conversation context and responds appropriately
 * to follow-up messages like "yes, please"
 */

import { chromium } from '@playwright/test';

async function testConversationContinuity() {
  console.log('🧪 Starting conversation continuity test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('📍 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for any dynamic content to settle
    await page.waitForTimeout(2000);

    // Look for SimpleChatInterface elements
    console.log('🔍 Looking for chat interface...');

    // Look for chat input field
    const inputSelector = 'textarea[placeholder*="blipee"], textarea[placeholder*="Message"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    console.log('✅ Found chat input field');

    // === Message 1: Ask about top emission sources ===
    console.log('\n📝 Sending first message: "What are my top 3 emission sources?"');
    await page.fill(inputSelector, 'What are my top 3 emission sources?');

    // Find and click send button
    const sendButton = page.locator('button').filter({ hasText: /send/i }).or(
      page.locator('button[type="submit"]')
    ).first();
    await sendButton.click();

    console.log('⏳ Waiting for response...');
    await page.waitForTimeout(8000); // Wait for AI response

    // Capture first response
    const messages1 = await page.locator('[class*="message"], [role="article"]').allTextContents();
    const lastMessage1 = messages1[messages1.length - 1];
    console.log('\n📨 First Response:', lastMessage1.substring(0, 200) + '...');

    // Check if response mentions 2025 and emissions data
    const has2025 = lastMessage1.includes('2025');
    const hasEmissions = lastMessage1.toLowerCase().includes('emission') || lastMessage1.toLowerCase().includes('co2');
    const hasFollowUp = lastMessage1.includes('?'); // Usually asks a follow-up question

    console.log('\n✅ Response Analysis:');
    console.log('  - Mentions 2025:', has2025 ? '✅' : '❌');
    console.log('  - Contains emissions data:', hasEmissions ? '✅' : '❌');
    console.log('  - Includes follow-up question:', hasFollowUp ? '✅' : '❌');

    // === Message 2: Reply "yes, please" ===
    console.log('\n📝 Sending follow-up: "yes, please"');
    await page.fill(inputSelector, 'yes, please');
    await sendButton.click();

    console.log('⏳ Waiting for follow-up response...');
    await page.waitForTimeout(8000);

    // Capture second response
    const messages2 = await page.locator('[class*="message"], [role="article"]').allTextContents();
    const lastMessage2 = messages2[messages2.length - 1];
    console.log('\n📨 Follow-up Response:', lastMessage2.substring(0, 300) + '...');

    // Check if response maintains context
    const isGeneric = lastMessage2.toLowerCase().includes('how can i assist') ||
                      lastMessage2.toLowerCase().includes('hi there');
    const continuesContext = lastMessage2.toLowerCase().includes('emission') ||
                             lastMessage2.toLowerCase().includes('reduce') ||
                             lastMessage2.toLowerCase().includes('suggest') ||
                             lastMessage2.toLowerCase().includes('recommend');

    console.log('\n🎯 Conversation Continuity Test:');
    console.log('  - Generic greeting (BAD):', isGeneric ? '❌ FAILED' : '✅ PASSED');
    console.log('  - Continues context (GOOD):', continuesContext ? '✅ PASSED' : '❌ FAILED');

    if (isGeneric) {
      console.log('\n❌ TEST FAILED: Conversation context was lost!');
      console.log('Expected: Suggestions for reducing emissions');
      console.log('Got: Generic greeting');
    } else if (continuesContext) {
      console.log('\n✅ TEST PASSED: Conversation context maintained!');
      console.log('blipee successfully continued the conversation with relevant suggestions');
    } else {
      console.log('\n⚠️ TEST UNCLEAR: Response is not generic but may not be contextual');
    }

    // Take screenshots
    await page.screenshot({ path: '.playwright-mcp/conversation-continuity-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: .playwright-mcp/conversation-continuity-test.png');

    // Keep browser open for manual inspection
    console.log('\n⏸️ Browser will stay open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete!');
  }
}

// Run the test
testConversationContinuity().catch(console.error);
