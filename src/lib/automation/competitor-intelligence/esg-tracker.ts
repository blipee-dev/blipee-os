/**
 * Competitor ESG Intelligence Tracker
 * Monitors competitor sustainability initiatives, claims, and reporting
 */

import { BaseScraper } from '../base-scraper';
import { ScraperResult, CompetitorESGData } from '../types';

export class CompetitorESGTracker extends BaseScraper<CompetitorESGData> {
  private companyName: string;
  private companyWebsite: string;
  private industry: string;

  constructor(
    config: any,
    companyName: string,
    companyWebsite: string,
    industry: string
  ) {
    super(config);
    this.companyName = companyName;
    this.companyWebsite = companyWebsite;
    this.industry = industry;
  }

  async scrape(): Promise<ScraperResult<CompetitorESGData>> {
    try {
      await this.logActivity('competitor_esg_tracking_started', {
        competitor: this.companyName,
      });

      const data: CompetitorESGData = {
        companyName: this.companyName,
        industry: this.industry,
        website: this.companyWebsite,
        lastUpdated: new Date(),
        metrics: {},
        publicClaims: [],
        reportsPublished: [],
      };

      // Scrape sustainability page
      const sustainabilityData = await this.scrapeSustainabilityPage();
      data.metrics = sustainabilityData.metrics;
      data.publicClaims = sustainabilityData.claims;

      // Find sustainability reports
      data.reportsPublished = await this.findSustainabilityReports();

      // Take screenshot for reference
      await this.takeScreenshot(`competitor_${this.sanitizeFilename(this.companyName)}`);

      await this.logActivity('competitor_esg_tracking_completed', {
        competitor: this.companyName,
        claimsFound: data.publicClaims.length,
        reportsFound: data.reportsPublished.length,
      });

      const result: ScraperResult<CompetitorESGData> = {
        success: true,
        data,
        timestamp: new Date(),
        source: 'competitor-intelligence',
      };

      await this.saveResult(result);
      return result;
    } catch (error) {
      const errorResult: ScraperResult<CompetitorESGData> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        source: 'competitor-intelligence',
      };

      await this.logActivity('competitor_esg_tracking_failed', {
        competitor: this.companyName,
        error: errorResult.error,
      });

      return errorResult;
    }
  }

  /**
   * Scrape competitor's sustainability/ESG page
   */
  private async scrapeSustainabilityPage(): Promise<{
    metrics: CompetitorESGData['metrics'];
    claims: string[];
  }> {
    const sustainabilityPaths = [
      '/sustainability',
      '/esg',
      '/corporate-responsibility',
      '/environmental',
      '/about/sustainability',
      '/impact',
    ];

    const metrics: CompetitorESGData['metrics'] = {};
    const claims: string[] = [];

    for (const path of sustainabilityPaths) {
      try {
        const url = this.companyWebsite + path;
        await this.navigateToUrl(url);
        await this.sleep(2000);

        // Extract key metrics and claims
        const pageData = await this.executeScript(`
          const data = {
            metrics: {},
            claims: []
          };

          const bodyText = document.body.textContent.toLowerCase();

          // Look for carbon neutral commitments
          if (bodyText.includes('carbon neutral') || bodyText.includes('net zero')) {
            const match = bodyText.match(/carbon neutral by (\\d{4})|net zero by (\\d{4})/i);
            if (match) {
              data.metrics.carbonNeutralCommitment = match[0];
            }
          }

          // Look for renewable energy targets
          if (bodyText.includes('renewable energy')) {
            const match = bodyText.match(/(\\d+)%?\\s*renewable energy/i);
            if (match) {
              data.metrics.renewableEnergyTarget = match[0];
            }
          }

          // Look for waste reduction
          if (bodyText.includes('waste') && bodyText.includes('reduction')) {
            const match = bodyText.match(/(\\d+)%?\\s*waste reduction/i);
            if (match) {
              data.metrics.wasteReduction = match[0];
            }
          }

          // Look for diversity metrics
          if (bodyText.includes('diversity') || bodyText.includes('inclusion')) {
            const match = bodyText.match(/(\\d+)%?\\s*(women|diverse|minority)/i);
            if (match) {
              data.metrics.diversityMetrics = match[0];
            }
          }

          // Extract prominent claims
          document.querySelectorAll('h1, h2, h3, .highlight, .claim').forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 10 && text.length < 200) {
              const lowerText = text.toLowerCase();
              if (
                lowerText.includes('sustainable') ||
                lowerText.includes('carbon') ||
                lowerText.includes('renewable') ||
                lowerText.includes('green') ||
                lowerText.includes('climate')
              ) {
                data.claims.push(text);
              }
            }
          });

          return data;
        `);

        if (pageData) {
          Object.assign(metrics, pageData.metrics);
          claims.push(...pageData.claims);
          break; // Found sustainability page, stop looking
        }
      } catch (error) {
        // Try next path
        continue;
      }
    }

    return { metrics, claims: Array.from(new Set(claims)) }; // Remove duplicates
  }

  /**
   * Find published sustainability reports
   */
  private async findSustainabilityReports(): Promise<CompetitorESGData['reportsPublished']> {
    try {
      // Common report page paths
      const reportPaths = [
        '/sustainability/reports',
        '/esg/reports',
        '/corporate-responsibility/reports',
        '/investors/sustainability',
      ];

      for (const path of reportPaths) {
        try {
          const url = this.companyWebsite + path;
          await this.navigateToUrl(url);
          await this.sleep(2000);

          const reports = await this.executeScript(`
            const reports = [];
            document.querySelectorAll('a[href*=".pdf"], a[href*="report"]').forEach(link => {
              const text = link.textContent;
              const href = link.href;

              // Extract year from link text or URL
              const yearMatch = text.match(/20(\\d{2})/);
              if (yearMatch) {
                reports.push({
                  year: parseInt('20' + yearMatch[1]),
                  url: href
                });
              }
            });

            return reports;
          `);

          if (reports && reports.length > 0) {
            return reports;
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error('[CompetitorTracker] Report finding failed:', error);
    }

    return [];
  }

  /**
   * Compare competitor ESG performance with our organization
   * Used by autonomous agents to generate benchmarking insights
   */
  async generateComparisonInsights(ourMetrics: {
    carbonNeutralTarget?: number; // year
    renewableEnergyPercent?: number;
    wasteReductionPercent?: number;
  }): Promise<string[]> {
    const result = await this.scrape();

    if (!result.success || !result.data) {
      throw new Error('Failed to fetch competitor data');
    }

    const competitor = result.data;
    const insights: string[] = [];

    // Carbon neutral comparison
    if (competitor.metrics.carbonNeutralCommitment) {
      const competitorTarget = competitor.metrics.carbonNeutralCommitment.match(/\d{4}/)?.[0];
      if (competitorTarget && ourMetrics.carbonNeutralTarget) {
        const ourYear = ourMetrics.carbonNeutralTarget;
        const theirYear = parseInt(competitorTarget);

        if (ourYear < theirYear) {
          insights.push(`✅ Advantage: Your carbon neutral target (${ourYear}) is ${theirYear - ourYear} years ahead of ${competitor.companyName}`);
        } else if (ourYear > theirYear) {
          insights.push(`⚠️ Gap: ${competitor.companyName}'s carbon neutral target (${theirYear}) is ${ourYear - theirYear} years ahead of yours`);
        }
      }
    }

    // Renewable energy comparison
    if (competitor.metrics.renewableEnergyTarget && ourMetrics.renewableEnergyPercent) {
      insights.push(`📊 ${competitor.companyName} renewable energy: ${competitor.metrics.renewableEnergyTarget}`);
      insights.push(`📊 Your renewable energy: ${ourMetrics.renewableEnergyPercent}%`);
    }

    // Report publishing comparison
    if (competitor.reportsPublished.length > 0) {
      const latestYear = Math.max(...competitor.reportsPublished.map(r => r.year));
      insights.push(`📄 ${competitor.companyName} published ${competitor.reportsPublished.length} sustainability reports, latest: ${latestYear}`);
    }

    return insights;
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  protected getJobType(): string {
    return 'competitor-intelligence';
  }
}

/**
 * Convenience function to track competitor ESG performance
 */
export async function trackCompetitorESG(
  organizationId: string,
  userId: string,
  companyName: string,
  companyWebsite: string,
  industry: string
): Promise<ScraperResult<CompetitorESGData>> {
  const tracker = new CompetitorESGTracker(
    { organizationId, userId },
    companyName,
    companyWebsite,
    industry
  );

  return await tracker.scrape();
}
