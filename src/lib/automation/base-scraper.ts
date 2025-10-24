/**
 * Base scraper class for all web automation features
 * Uses Puppeteer MCP for browser automation
 */

import { ScraperConfig, ScraperResult } from './types';
import { createClient } from '@/lib/supabase/server';

export abstract class BaseScraper<T = any> {
  protected config: ScraperConfig;
  protected startTime: Date;

  constructor(config: ScraperConfig) {
    this.config = {
      retryAttempts: 3,
      timeout: 30000, // 30 seconds
      headless: true,
      ...config,
    };
    this.startTime = new Date();
  }

  /**
   * Main scraping method - must be implemented by subclasses
   */
  abstract scrape(): Promise<ScraperResult<T>>;

  /**
   * Navigate to a URL using Puppeteer MCP
   * This will be replaced with actual MCP calls in implementation
   */
  protected async navigateToUrl(url: string): Promise<void> {
    // TODO: Replace with actual Puppeteer MCP call
    // Example: await puppeteer.navigate({ url });
    console.log(`[BaseScraper] Navigating to: ${url}`);
  }

  /**
   * Take a screenshot for audit trails
   */
  protected async takeScreenshot(name: string): Promise<string> {
    // TODO: Replace with actual Puppeteer MCP call
    // Example: const screenshot = await puppeteer.screenshot({ fullPage: true });
    console.log(`[BaseScraper] Taking screenshot: ${name}`);
    return `screenshot_${name}_${Date.now()}.png`;
  }

  /**
   * Execute JavaScript in the page
   */
  protected async executeScript(script: string): Promise<any> {
    // TODO: Replace with actual Puppeteer MCP call
    // Example: return await puppeteer.evaluate({ script });
    console.log(`[BaseScraper] Executing script`);
    return null;
  }

  /**
   * Fill a form field
   */
  protected async fillField(selector: string, value: string): Promise<void> {
    // TODO: Replace with actual Puppeteer MCP call
    console.log(`[BaseScraper] Filling field ${selector}`);
  }

  /**
   * Click an element
   */
  protected async clickElement(selector: string): Promise<void> {
    // TODO: Replace with actual Puppeteer MCP call
    console.log(`[BaseScraper] Clicking element ${selector}`);
  }

  /**
   * Wait for an element to appear
   */
  protected async waitForElement(selector: string, timeout?: number): Promise<void> {
    // TODO: Replace with actual Puppeteer MCP call
    console.log(`[BaseScraper] Waiting for element ${selector}`);
  }

  /**
   * Save result to database
   */
  protected async saveResult(result: ScraperResult<T>): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('automation_jobs').insert({
        organization_id: this.config.organizationId,
        job_type: this.getJobType(),
        status: result.success ? 'completed' : 'failed',
        result: result.data,
        error: result.error,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[BaseScraper] Failed to save result:', error);
    }
  }

  /**
   * Log scraping activity for audit
   */
  protected async logActivity(action: string, details?: any): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('automation_logs').insert({
        organization_id: this.config.organizationId,
        user_id: this.config.userId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[BaseScraper] Failed to log activity:', error);
    }
  }

  /**
   * Retry logic for failed operations
   */
  protected async withRetry<R>(
    operation: () => Promise<R>,
    attempts: number = this.config.retryAttempts || 3
  ): Promise<R> {
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[BaseScraper] Attempt ${i + 1} failed:`, error);

        // Exponential backoff
        if (i < attempts - 1) {
          await this.sleep(Math.pow(2, i) * 1000);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the job type for database storage
   */
  protected abstract getJobType(): string;

  /**
   * Calculate execution time
   */
  protected getExecutionTime(): number {
    return Date.now() - this.startTime.getTime();
  }
}
