/**
 * Company Discovery Scraper
 * Automatically finds similar companies in the same sector
 * Sources: LinkedIn, Crunchbase, industry associations, stock exchanges
 */

import { BaseScraper } from '../base-scraper';
import { ScraperResult } from '../types';

export interface CompanyProfile {
  name: string;
  website: string;
  industry: string;
  sector: string; // GRI sector code (GRI-11 to GRI-17)
  size: 'small' | 'medium' | 'large' | 'enterprise'; // By employee count or revenue
  country: string;
  stockTicker?: string;
  sustainabilityReportUrl?: string;
}

export interface CompanyDiscoveryConfig {
  sector: string; // GRI sector code
  region?: string; // 'north-america', 'europe', 'asia', 'global'
  minCompanySize?: 'small' | 'medium' | 'large' | 'enterprise';
  maxResults?: number;
}

/**
 * Discovers companies in the same sector for benchmarking
 */
export class CompanyDiscoveryScraper extends BaseScraper<CompanyProfile[]> {
  private config: CompanyDiscoveryConfig;

  constructor(scraperConfig: any, discoveryConfig: CompanyDiscoveryConfig) {
    super(scraperConfig);
    this.config = {
      maxResults: 50,
      region: 'global',
      ...discoveryConfig,
    };
  }

  async scrape(): Promise<ScraperResult<CompanyProfile[]>> {
    try {
      await this.logActivity('company_discovery_started', { sector: this.config.sector });

      const companies: CompanyProfile[] = [];

      // Search multiple sources
      companies.push(...await this.searchStockExchanges());
      companies.push(...await this.searchIndustryAssociations());
      companies.push(...await this.searchCrunchbase());
      companies.push(...await this.searchLinkedIn());

      // Deduplicate by website
      const uniqueCompanies = this.deduplicateCompanies(companies);

      // Limit to max results
      const limitedCompanies = uniqueCompanies.slice(0, this.config.maxResults);

      await this.logActivity('company_discovery_completed', {
        sector: this.config.sector,
        companiesFound: limitedCompanies.length,
      });

      const result: ScraperResult<CompanyProfile[]> = {
        success: true,
        data: limitedCompanies,
        timestamp: new Date(),
        source: 'company-discovery',
      };

      await this.saveResult(result);
      return result;
    } catch (error) {
      const errorResult: ScraperResult<CompanyProfile[]> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'company-discovery',
      };

      await this.logActivity('company_discovery_failed', { error: errorResult.error });
      return errorResult;
    }
  }

  /**
   * Search stock exchanges for public companies
   * Sources: NYSE, NASDAQ, LSE, etc.
   */
  private async searchStockExchanges(): Promise<CompanyProfile[]> {
    const companies: CompanyProfile[] = [];

    try {
      // Example: Search Yahoo Finance for companies by sector
      const sectorKeywords = this.getSectorKeywords(this.config.sector);

      await this.navigateToUrl(`https://finance.yahoo.com/screener/new`);
      await this.waitForElement('.screener-container', 10000);

      // Add sector filter
      const searchResults = await this.executeScript(`
        const companies = [];
        document.querySelectorAll('.simpTblRow').forEach(row => {
          const ticker = row.querySelector('[data-test="symbol"]')?.textContent;
          const name = row.querySelector('[data-test="name"]')?.textContent;
          const sector = row.querySelector('[data-test="sector"]')?.textContent;

          if (ticker && name) {
            companies.push({ ticker, name, sector });
          }
        });
        return companies;
      `);

      for (const result of searchResults || []) {
        // Get company website from ticker
        const website = await this.getCompanyWebsiteFromTicker(result.ticker);

        if (website) {
          companies.push({
            name: result.name,
            website,
            industry: result.sector || '',
            sector: this.config.sector,
            size: 'large', // Public companies are typically large
            country: 'US', // Would parse from exchange
            stockTicker: result.ticker,
          });
        }
      }
    } catch (error) {
      console.error('[CompanyDiscovery] Stock exchange search failed:', error);
    }

    return companies;
  }

  /**
   * Search industry associations for member companies
   */
  private async searchIndustryAssociations(): Promise<CompanyProfile[]> {
    const companies: CompanyProfile[] = [];

    try {
      const associations = this.getIndustryAssociations(this.config.sector);

      for (const association of associations) {
        await this.navigateToUrl(association.membersUrl);
        await this.sleep(2000);

        const members = await this.executeScript(`
          const companies = [];
          document.querySelectorAll('.member-list .member, .company-directory .company').forEach(item => {
            const name = item.querySelector('.company-name, h3, h4')?.textContent?.trim();
            const website = item.querySelector('a[href*="http"]')?.href;

            if (name && website) {
              companies.push({ name, website });
            }
          });
          return companies;
        `);

        for (const member of members || []) {
          companies.push({
            name: member.name,
            website: member.website,
            industry: association.industry,
            sector: this.config.sector,
            size: 'medium', // Association members vary
            country: association.region,
          });
        }
      }
    } catch (error) {
      console.error('[CompanyDiscovery] Industry association search failed:', error);
    }

    return companies;
  }

  /**
   * Search Crunchbase for companies
   */
  private async searchCrunchbase(): Promise<CompanyProfile[]> {
    const companies: CompanyProfile[] = [];

    try {
      const keywords = this.getSectorKeywords(this.config.sector);

      await this.navigateToUrl(`https://www.crunchbase.com/discover/organization.companies`);
      await this.waitForElement('.search-results', 10000);

      // Search by keywords
      await this.fillField('input[name="query"]', keywords.join(' '));
      await this.sleep(3000);

      const results = await this.executeScript(`
        const companies = [];
        document.querySelectorAll('.search-results .grid-row').forEach(row => {
          const name = row.querySelector('.identifier-label')?.textContent?.trim();
          const website = row.querySelector('.website-link')?.href;
          const description = row.querySelector('.description')?.textContent?.trim();

          if (name && website) {
            companies.push({ name, website, description });
          }
        });
        return companies;
      `);

      for (const result of results || []) {
        companies.push({
          name: result.name,
          website: result.website,
          industry: result.description || '',
          sector: this.config.sector,
          size: 'medium',
          country: 'Unknown',
        });
      }
    } catch (error) {
      console.error('[CompanyDiscovery] Crunchbase search failed:', error);
    }

    return companies;
  }

  /**
   * Search LinkedIn for companies by industry
   */
  private async searchLinkedIn(): Promise<CompanyProfile[]> {
    const companies: CompanyProfile[] = [];

    try {
      const keywords = this.getSectorKeywords(this.config.sector);

      // LinkedIn company search
      await this.navigateToUrl(`https://www.linkedin.com/search/results/companies/?keywords=${keywords[0]}`);
      await this.sleep(3000);

      const results = await this.executeScript(`
        const companies = [];
        document.querySelectorAll('.entity-result').forEach(item => {
          const name = item.querySelector('.entity-result__title-text')?.textContent?.trim();
          const websiteLink = item.querySelector('.link-without-visited-state')?.href;

          if (name) {
            companies.push({ name, websiteLink });
          }
        });
        return companies;
      `);

      for (const result of results || []) {
        // Extract website from LinkedIn page
        if (result.websiteLink) {
          const website = await this.extractWebsiteFromLinkedIn(result.websiteLink);
          if (website) {
            companies.push({
              name: result.name,
              website,
              industry: keywords.join(', '),
              sector: this.config.sector,
              size: 'medium',
              country: 'Unknown',
            });
          }
        }
      }
    } catch (error) {
      console.error('[CompanyDiscovery] LinkedIn search failed:', error);
    }

    return companies;
  }

  /**
   * Get industry associations for a sector
   */
  private getIndustryAssociations(sector: string): Array<{
    name: string;
    membersUrl: string;
    industry: string;
    region: string;
  }> {
    const associations: Record<string, any[]> = {
      'GRI-11': [ // Oil & Gas
        {
          name: 'International Association of Oil & Gas Producers',
          membersUrl: 'https://www.iogp.org/members/',
          industry: 'Oil & Gas',
          region: 'Global',
        },
      ],
      'GRI-12': [ // Mining
        {
          name: 'International Council on Mining and Metals',
          membersUrl: 'https://www.icmm.com/en-gb/members',
          industry: 'Mining',
          region: 'Global',
        },
      ],
      'GRI-14': [ // Manufacturing
        {
          name: 'National Association of Manufacturers',
          membersUrl: 'https://www.nam.org/about/members/',
          industry: 'Manufacturing',
          region: 'US',
        },
      ],
      // Add more sectors...
    };

    return associations[sector] || [];
  }

  /**
   * Get search keywords for a sector
   */
  private getSectorKeywords(sector: string): string[] {
    const keywords: Record<string, string[]> = {
      'GRI-11': ['oil', 'gas', 'petroleum', 'energy', 'fossil fuel'],
      'GRI-12': ['mining', 'minerals', 'extraction', 'coal'],
      'GRI-13': ['agriculture', 'farming', 'food production'],
      'GRI-14': ['manufacturing', 'production', 'industrial'],
      'GRI-15': ['chemicals', 'pharmaceuticals', 'biotech'],
      'GRI-16': ['construction', 'real estate', 'infrastructure'],
      'GRI-17': ['transportation', 'logistics', 'shipping'],
    };

    return keywords[sector] || ['sustainability', 'ESG'];
  }

  /**
   * Get company website from stock ticker
   */
  private async getCompanyWebsiteFromTicker(ticker: string): Promise<string | null> {
    try {
      await this.navigateToUrl(`https://finance.yahoo.com/quote/${ticker}/profile`);
      await this.sleep(2000);

      const website = await this.executeScript(`
        const websiteElement = document.querySelector('[data-test="website"] a');
        return websiteElement?.href || null;
      `);

      return website;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract website from LinkedIn company page
   */
  private async extractWebsiteFromLinkedIn(linkedInUrl: string): Promise<string | null> {
    try {
      await this.navigateToUrl(linkedInUrl);
      await this.sleep(2000);

      const website = await this.executeScript(`
        const websiteElement = document.querySelector('.org-top-card-summary-info-list__info-item a[href^="http"]');
        return websiteElement?.href || null;
      `);

      return website;
    } catch (error) {
      return null;
    }
  }

  /**
   * Deduplicate companies by website
   */
  private deduplicateCompanies(companies: CompanyProfile[]): CompanyProfile[] {
    const seen = new Set<string>();
    const unique: CompanyProfile[] = [];

    for (const company of companies) {
      const key = company.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(company);
      }
    }

    return unique;
  }

  protected getJobType(): string {
    return 'company-discovery';
  }
}

/**
 * Convenience function to discover companies in a sector
 */
export async function discoverCompaniesInSector(
  organizationId: string,
  userId: string,
  config: CompanyDiscoveryConfig
): Promise<ScraperResult<CompanyProfile[]>> {
  const scraper = new CompanyDiscoveryScraper(
    { organizationId, userId },
    config
  );

  return await scraper.scrape();
}
