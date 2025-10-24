/**
 * EPA Regulatory Intelligence Scraper
 * Monitors EPA website for new environmental regulations and updates
 */

import { BaseScraper } from '../base-scraper';
import { ScraperResult, RegulatoryUpdate } from '../types';

const EPA_REGULATIONS_URL = 'https://www.epa.gov/regulations-emissions-vehicles-and-engines';
const EPA_CLIMATE_URL = 'https://www.epa.gov/climate-change';
const EPA_NEWS_URL = 'https://www.epa.gov/newsreleases';

export class EPAScraper extends BaseScraper<RegulatoryUpdate[]> {
  constructor(config: any) {
    super(config);
  }

  async scrape(): Promise<ScraperResult<RegulatoryUpdate[]>> {
    try {
      await this.logActivity('epa_scrape_started');

      const updates: RegulatoryUpdate[] = [];

      // Scrape multiple EPA sections
      updates.push(...await this.scrapeRegulations());
      updates.push(...await this.scrapeClimateUpdates());
      updates.push(...await this.scrapeNewsReleases());

      await this.logActivity('epa_scrape_completed', { updatesFound: updates.length });

      const result: ScraperResult<RegulatoryUpdate[]> = {
        success: true,
        data: updates,
        timestamp: new Date(),
        source: 'epa',
      };

      await this.saveResult(result);
      return result;
    } catch (error) {
      const errorResult: ScraperResult<RegulatoryUpdate[]> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'epa',
      };

      await this.logActivity('epa_scrape_failed', { error: errorResult.error });
      return errorResult;
    }
  }

  private async scrapeRegulations(): Promise<RegulatoryUpdate[]> {
    await this.navigateToUrl(EPA_REGULATIONS_URL);
    await this.waitForElement('.view-content', 10000);
    await this.takeScreenshot('epa_regulations');

    const regulationsData = await this.executeScript(`
      const regulations = [];
      document.querySelectorAll('.views-row').forEach(row => {
        const title = row.querySelector('.field-title a')?.textContent?.trim();
        const url = row.querySelector('.field-title a')?.href;
        const description = row.querySelector('.field-description')?.textContent?.trim();
        const date = row.querySelector('.field-date')?.textContent?.trim();

        if (title && url) {
          regulations.push({ title, url, description, date });
        }
      });
      return regulations;
    `);

    return (regulationsData || []).map((reg: any) => ({
      source: 'epa' as const,
      title: reg.title,
      description: reg.description || '',
      url: reg.url,
      effectiveDate: reg.date ? new Date(reg.date) : undefined,
      relevantIndustries: this.determineRelevantIndustries(reg.title + ' ' + reg.description),
      severity: this.determineSeverity(reg.title),
    }));
  }

  private async scrapeClimateUpdates(): Promise<RegulatoryUpdate[]> {
    await this.navigateToUrl(EPA_CLIMATE_URL);
    await this.waitForElement('main', 10000);
    await this.takeScreenshot('epa_climate');

    const climateData = await this.executeScript(`
      const updates = [];
      document.querySelectorAll('.pane-content .view-content .views-row').forEach(row => {
        const title = row.querySelector('h3 a')?.textContent?.trim();
        const url = row.querySelector('h3 a')?.href;
        const summary = row.querySelector('.views-field-body')?.textContent?.trim();

        if (title && url) {
          updates.push({ title, url, summary });
        }
      });
      return updates;
    `);

    return (climateData || []).map((update: any) => ({
      source: 'epa' as const,
      title: update.title,
      description: update.summary || '',
      url: update.url,
      relevantIndustries: ['all'],
      severity: 'medium' as const,
    }));
  }

  private async scrapeNewsReleases(): Promise<RegulatoryUpdate[]> {
    await this.navigateToUrl(EPA_NEWS_URL);
    await this.waitForElement('.view-newsreleases', 10000);
    await this.takeScreenshot('epa_news');

    const newsData = await this.executeScript(`
      const news = [];
      document.querySelectorAll('.views-row').forEach(row => {
        const title = row.querySelector('.field-title a')?.textContent?.trim();
        const url = row.querySelector('.field-title a')?.href;
        const date = row.querySelector('.field-date time')?.getAttribute('datetime');
        const summary = row.querySelector('.field-description')?.textContent?.trim();

        if (title && url) {
          news.push({ title, url, date, summary });
        }
      });
      return news;
    `);

    return (newsData || []).map((news: any) => ({
      source: 'epa' as const,
      title: news.title,
      description: news.summary || '',
      url: news.url,
      effectiveDate: news.date ? new Date(news.date) : undefined,
      relevantIndustries: this.determineRelevantIndustries(news.title + ' ' + news.summary),
      severity: this.determineSeverity(news.title),
    }));
  }

  /**
   * Determine which industries this regulation affects
   * Maps keywords to GRI sector standards
   */
  private determineRelevantIndustries(text: string): string[] {
    const textLower = text.toLowerCase();
    const industries: string[] = [];

    const industryKeywords: Record<string, string[]> = {
      'GRI-11': ['oil', 'gas', 'petroleum', 'refinery', 'fossil fuel'],
      'GRI-12': ['mining', 'coal', 'mineral', 'extraction'],
      'GRI-13': ['agriculture', 'farming', 'livestock', 'crop'],
      'GRI-14': ['manufacturing', 'production', 'factory', 'industrial'],
      'GRI-15': ['chemical', 'pharmaceutical', 'biotech'],
      'GRI-16': ['construction', 'building', 'infrastructure'],
      'GRI-17': ['transportation', 'logistics', 'shipping', 'aviation'],
    };

    for (const [gri, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        industries.push(gri);
      }
    }

    return industries.length > 0 ? industries : ['all'];
  }

  /**
   * Determine severity based on title keywords
   */
  private determineSeverity(title: string): 'critical' | 'high' | 'medium' | 'low' {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('mandatory') || titleLower.includes('required') || titleLower.includes('enforcement')) {
      return 'critical';
    }
    if (titleLower.includes('new rule') || titleLower.includes('regulation')) {
      return 'high';
    }
    if (titleLower.includes('guidance') || titleLower.includes('update')) {
      return 'medium';
    }
    return 'low';
  }

  protected getJobType(): string {
    return 'regulatory';
  }
}

/**
 * Convenience function to scrape EPA regulatory updates
 */
export async function scrapeEPARegulations(
  organizationId: string,
  userId: string
): Promise<ScraperResult<RegulatoryUpdate[]>> {
  const scraper = new EPAScraper({ organizationId, userId });
  return await scraper.scrape();
}
