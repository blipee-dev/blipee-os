/**
 * Pacific Gas & Electric (PG&E) Utility Bill Automation
 * Automatically logs in, downloads bills, and extracts energy usage data
 */

import { BaseScraper } from '../base-scraper';
import { ScraperResult, UtilityBillData, UtilityCredentials } from '../types';

const PGE_LOGIN_URL = 'https://m.pge.com/#login';
const PGE_BILLS_URL = 'https://m.pge.com/mypge/s/billpayment';

export class PGEScraper extends BaseScraper<UtilityBillData[]> {
  private credentials: UtilityCredentials;

  constructor(config: any, credentials: UtilityCredentials) {
    super(config);
    this.credentials = credentials;
  }

  async scrape(): Promise<ScraperResult<UtilityBillData[]>> {
    try {
      await this.logActivity('pge_scrape_started');

      // Step 1: Navigate to PG&E login page
      await this.navigateToUrl(PGE_LOGIN_URL);
      await this.takeScreenshot('pge_login_page');

      // Step 2: Login
      await this.login();
      await this.takeScreenshot('pge_after_login');

      // Step 3: Navigate to bills section
      await this.navigateToUrl(PGE_BILLS_URL);
      await this.waitForElement('.bill-list', 10000);
      await this.takeScreenshot('pge_bills_page');

      // Step 4: Extract bill data
      const bills = await this.extractBillData();

      // Step 5: Download PDFs for each bill
      for (const bill of bills) {
        await this.downloadBillPdf(bill);
      }

      await this.logActivity('pge_scrape_completed', { billsFound: bills.length });

      const result: ScraperResult<UtilityBillData[]> = {
        success: true,
        data: bills,
        timestamp: new Date(),
        source: 'pge',
      };

      await this.saveResult(result);
      return result;
    } catch (error) {
      const errorResult: ScraperResult<UtilityBillData[]> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'pge',
      };

      await this.logActivity('pge_scrape_failed', { error: errorResult.error });
      await this.saveResult(errorResult);
      return errorResult;
    }
  }

  private async login(): Promise<void> {
    await this.withRetry(async () => {
      // Fill login form
      await this.fillField('#username', this.credentials.username);
      await this.fillField('#password', this.credentials.password);

      // Click login button
      await this.clickElement('#login-button');

      // Wait for dashboard to load
      await this.waitForElement('.dashboard', 15000);
    });
  }

  private async extractBillData(): Promise<UtilityBillData[]> {
    // Extract bill data from the page
    // This would use Puppeteer's evaluate function to run JS in the page
    const billsData = await this.executeScript(`
      const bills = [];
      document.querySelectorAll('.bill-item').forEach(item => {
        bills.push({
          accountNumber: item.querySelector('.account-number')?.textContent,
          billingPeriod: item.querySelector('.billing-period')?.textContent,
          electricityUsage: parseFloat(item.querySelector('.electricity-kwh')?.textContent),
          gasUsage: parseFloat(item.querySelector('.gas-therms')?.textContent),
          totalCost: parseFloat(item.querySelector('.total-cost')?.textContent.replace('$', '')),
          billUrl: item.querySelector('.download-link')?.href,
        });
      });
      return bills;
    `);

    // Transform to our data structure
    return this.transformBillData(billsData || []);
  }

  private transformBillData(rawBills: any[]): UtilityBillData[] {
    return rawBills.map(raw => {
      // Parse billing period (e.g., "Dec 15, 2024 - Jan 14, 2025")
      const [startStr, endStr] = raw.billingPeriod?.split(' - ') || [];

      // Calculate emissions (PG&E's emission factor: ~0.4 kg CO2e per kWh in California)
      const emissionFactor = 0.4; // kg CO2e per kWh
      const carbonEmissions = raw.electricityUsage * emissionFactor;

      return {
        provider: 'pge',
        accountNumber: raw.accountNumber || this.credentials.accountNumber || '',
        billingPeriod: {
          start: startStr ? new Date(startStr) : new Date(),
          end: endStr ? new Date(endStr) : new Date(),
        },
        energyUsage: {
          electricity: raw.electricityUsage || 0,
          gas: raw.gasUsage,
        },
        cost: raw.totalCost || 0,
        carbonEmissions,
        rawBillUrl: raw.billUrl,
      };
    });
  }

  private async downloadBillPdf(bill: UtilityBillData): Promise<void> {
    if (!bill.rawBillUrl) return;

    try {
      // Navigate to PDF URL and download
      await this.navigateToUrl(bill.rawBillUrl);
      await this.sleep(2000); // Wait for download to trigger

      // In production, you'd want to:
      // 1. Catch the download
      // 2. Upload to Supabase Storage
      // 3. Store the URL in the database

      console.log(`[PGEScraper] Downloaded bill for period ${bill.billingPeriod.start}`);
    } catch (error) {
      console.error('[PGEScraper] Failed to download PDF:', error);
    }
  }

  protected getJobType(): string {
    return 'utility-bill';
  }
}

/**
 * Convenience function to scrape PG&E bills
 */
export async function scrapePGEBills(
  organizationId: string,
  userId: string,
  credentials: UtilityCredentials
): Promise<ScraperResult<UtilityBillData[]>> {
  const scraper = new PGEScraper(
    { organizationId, userId },
    credentials
  );

  return await scraper.scrape();
}
