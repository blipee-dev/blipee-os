/**
 * AI Conversation Journey E2E Tests
 * Phase 5, Task 5.1: Complete AI conversation and intelligence flow
 */

import { test, expect } from '@playwright/test';
import { E2ETestFramework, TestUser } from '../e2e-test-framework';

const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 45000, // Longer timeout for AI responses
  retries: 2,
  parallel: false,
  headless: process.env.CI === 'true',
  video: true,
  screenshot: 'only-on-failure' as const
};

const testUser: TestUser = {
  email: 'ai.user@blipee-test.com',
  password: 'TestPassword123!',
  role: 'sustainability_manager',
  organizationId: 'test-org-ai',
  firstName: 'Alex',
  lastName: 'AIUser'
};

test.describe('AI Conversation Journey', () => {
  let framework: E2ETestFramework;

  test.beforeEach(async () => {
    framework = new E2ETestFramework(config);
    await framework.initialize();
    
    // Sign in as AI user
    await framework.signIn(testUser);
  });

  test.afterEach(async () => {
    await framework.cleanup();
  });

  test('User can start a new AI conversation', async () => {
    await framework.navigateTo('/chat');
    
    // Verify chat interface is loaded
    const chatInput = await framework.page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();
    
    const sendButton = await framework.page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();
    
    // Start conversation
    await framework.startConversation('Hello! I need help with our sustainability data.');
    
    // Verify AI response
    const aiResponse = await framework.page.locator('[data-testid="ai-response"]').last();
    await expect(aiResponse).toBeVisible();
    await expect(aiResponse).toContainText('sustainability');
    
    // Check for conversation context indicators
    const contextIndicator = await framework.page.locator('[data-testid="context-indicator"]');
    await expect(contextIndicator).toBeVisible();
  });

  test('AI can analyze emissions data and provide insights', async () => {
    await framework.startConversation('Can you analyze our carbon footprint for this year?');
    
    // AI should ask for clarification or provide analysis
    let response = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
    expect(response).toMatch(/(analyze|carbon|emissions|footprint|data)/i);
    
    // Follow up with more specific question
    const followUpResponse = await framework.sendMessage('Show me our Scope 1 and Scope 2 emissions breakdown');
    
    // AI should provide emissions breakdown
    expect(followUpResponse).toMatch(/(scope 1|scope 2|emissions|breakdown)/i);
    
    // Check if visualization is generated
    const chart = await framework.page.locator('[data-testid="generated-chart"]');
    if (await chart.isVisible()) {
      await expect(chart).toContainText('Emissions');
    }
  });

  test('AI can provide sustainability recommendations', async () => {
    await framework.startConversation('What are some ways we can reduce our carbon emissions?');
    
    const response = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
    
    // AI should provide specific recommendations
    expect(response).toMatch(/(reduce|energy|efficiency|renewable|sustainable)/i);
    
    // Check for actionable recommendations
    const actionItems = await framework.page.locator('[data-testid="action-items"]');
    if (await actionItems.isVisible()) {
      await expect(actionItems).toContainText('recommendation');
    }
    
    // Test follow-up question
    const detailResponse = await framework.sendMessage('Tell me more about energy efficiency improvements');
    expect(detailResponse).toMatch(/(energy|efficiency|lighting|hvac|insulation)/i);
  });

  test('AI can help with regulatory compliance questions', async () => {
    await framework.startConversation('What are the requirements for GRI 305 emissions reporting?');
    
    const response = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
    
    // AI should provide GRI 305 information
    expect(response).toMatch(/(GRI 305|emissions|reporting|scope|disclosure)/i);
    
    // Ask for specific guidance
    const guidanceResponse = await framework.sendMessage('How should we structure our Scope 3 emissions disclosure?');
    expect(guidanceResponse).toMatch(/(scope 3|categories|upstream|downstream)/i);
  });

  test('AI can generate dynamic charts and visualizations', async () => {
    await framework.startConversation('Create a chart showing our monthly electricity usage trend');
    
    // Wait for AI to process and generate chart
    await framework.waitForAIResponse(60000); // Longer timeout for chart generation
    
    // Check if chart is generated
    const chartContainer = await framework.page.locator('[data-testid="generated-visualization"]');
    await expect(chartContainer).toBeVisible();
    
    // Verify chart contains expected elements
    const chartElement = await framework.page.locator('canvas, svg').first();
    await expect(chartElement).toBeVisible();
    
    // Check for chart controls
    const chartControls = await framework.page.locator('[data-testid="chart-controls"]');
    if (await chartControls.isVisible()) {
      // Test chart interaction
      await framework.page.click('[data-testid="chart-period-selector"]');
      await framework.page.selectOption('[data-testid="chart-period-selector"]', 'quarterly');
      
      // Chart should update
      await framework.page.waitForTimeout(2000); // Wait for chart update
    }
  });

  test('AI maintains conversation context across multiple messages', async () => {
    // Start conversation about specific topic
    await framework.startConversation('I want to set up emissions tracking for our new office building');
    
    // Follow up without re-explaining context
    const response1 = await framework.sendMessage('What data do I need to collect?');
    expect(response1).toMatch(/(energy|water|waste|transportation)/i);
    
    // Another follow-up
    const response2 = await framework.sendMessage('How often should I update this data?');
    expect(response2).toMatch(/(monthly|quarterly|frequency|update)/i);
    
    // AI should still remember the context
    const response3 = await framework.sendMessage('What about the building address and square footage?');
    expect(response3).toMatch(/(building|address|area|square|meters)/i);
  });

  test('AI can process and analyze uploaded documents', async () => {
    await framework.startConversation('I have an energy bill I need help analyzing');
    
    // Check if file upload is available
    const fileUpload = await framework.page.locator('[data-testid="file-upload"]');
    if (await fileUpload.isVisible()) {
      // Create mock energy bill data
      const mockBillContent = `
        ENERGY BILL
        Account: 12345
        Period: Jan 2024
        Electricity Usage: 5,200 kWh
        Cost: $780.00
        Demand Charges: $120.00
      `;
      
      // Upload mock document
      await fileUpload.setInputFiles({
        name: 'energy-bill-jan-2024.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(mockBillContent)
      });
      
      // Wait for processing
      await framework.waitForAIResponse(45000);
      
      // AI should extract and analyze data
      const response = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
      expect(response).toMatch(/(5,200|kwh|electricity|usage|cost)/i);
      
      // Check if data extraction results are shown
      const extractedData = await framework.page.locator('[data-testid="extracted-data"]');
      if (await extractedData.isVisible()) {
        await expect(extractedData).toContainText('5,200');
        await expect(extractedData).toContainText('kWh');
      }
    }
  });

  test('AI can provide multi-language support', async () => {
    // Skip if multi-language is not enabled
    if (!process.env.TEST_MULTILANG_ENABLED) {
      test.skip();
      return;
    }
    
    await framework.startConversation('¿Puedes ayudarme con datos de sostenibilidad?');
    
    const response = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
    
    // AI should respond in Spanish
    expect(response).toMatch(/(sostenibilidad|datos|emisiones|ayudar)/i);
    
    // Switch back to English
    const englishResponse = await framework.sendMessage('Please continue in English');
    expect(englishResponse).toMatch(/(sustainability|data|emissions|help)/i);
  });

  test('AI conversation can export and save insights', async () => {
    await framework.startConversation('Analyze our Q1 2024 sustainability performance');
    
    // Wait for comprehensive analysis
    await framework.waitForAIResponse(60000);
    
    // Look for export options
    const exportButton = await framework.page.locator('[data-testid="export-conversation"]');
    if (await exportButton.isVisible()) {
      const downloadPromise = framework.page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/(conversation|analysis|report)/i);
    }
    
    // Look for save insights option
    const saveInsightsButton = await framework.page.locator('[data-testid="save-insights"]');
    if (await saveInsightsButton.isVisible()) {
      await saveInsightsButton.click();
      
      // Fill save form
      await framework.page.fill('[data-testid="insight-title"]', 'Q1 2024 Sustainability Analysis');
      await framework.page.selectOption('[data-testid="insight-category"]', 'performance');
      await framework.page.click('[data-testid="save-insight-button"]');
      
      // Verify insight is saved
      const successMessage = await framework.page.locator('[data-testid="insight-saved"]');
      await expect(successMessage).toContainText('saved successfully');
    }
  });

  test('AI can handle conversation errors gracefully', async () => {
    // Test with invalid/complex query
    await framework.startConversation('Analyze the quantum sustainability metrics for interdimensional carbon offsets');
    
    const response = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
    
    // AI should respond appropriately to unclear requests
    expect(response).toMatch(/(clarify|specific|understand|help|rephrase)/i);
    
    // Test with very long input
    const longMessage = 'a'.repeat(5000); // Very long message
    const longResponse = await framework.sendMessage(longMessage);
    
    // Should handle long input gracefully
    expect(longResponse).toBeDefined();
    expect(longResponse.length).toBeGreaterThan(0);
    
    // Test with empty message
    await framework.page.fill('[data-testid="chat-input"]', '   '); // Whitespace only
    await framework.page.click('[data-testid="send-button"]');
    
    // Should not send empty message or show appropriate message
    await framework.page.waitForTimeout(2000);
    const emptyResponse = await framework.page.locator('[data-testid="ai-response"]').last().textContent();
    expect(emptyResponse).not.toBe('   ');
  });

  test('AI conversation history persists across sessions', async () => {
    // Start conversation
    await framework.startConversation('Remember: our main sustainability goal is to reduce emissions by 50% by 2030');
    
    // Navigate away
    await framework.navigateTo('/dashboard');
    
    // Come back to chat
    await framework.navigateTo('/chat');
    
    // Check if conversation history is preserved
    const conversationHistory = await framework.page.locator('[data-testid="conversation-history"]');
    await expect(conversationHistory).toContainText('reduce emissions by 50%');
    
    // Continue conversation
    const contextualResponse = await framework.sendMessage('Based on our goal, what should we prioritize?');
    
    // AI should reference the previous context
    expect(contextualResponse).toMatch(/(50%|2030|emissions|goal|prioritize)/i);
  });
});