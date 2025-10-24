/**
 * Web Automation with Puppeteer MCP
 * Main exports for all automation features
 */

// Types
export * from './types';

// Base scraper
export { BaseScraper } from './base-scraper';

// Feature 1: Utility Bill Automation
export { PGEScraper, scrapePGEBills } from './utility-providers/pge-scraper';

// Feature 2: Regulatory Intelligence
export { EPAScraper, scrapeEPARegulations } from './regulatory/epa-scraper';

// Feature 3: Carbon Market Prices
export { CarbonCreditScraper, scrapeCarbonMarkets } from './carbon-markets/carbon-credit-scraper';

// Feature 4: Supplier Verification
export {
  SupplierCertificationChecker,
  verifySupplierSustainability,
} from './supplier-verification/certification-checker';

// Feature 5: Competitor Intelligence
export {
  CompetitorESGTracker,
  trackCompetitorESG,
} from './competitor-intelligence/esg-tracker';

// Feature 6: Sector Intelligence & Benchmarking 🌟
export {
  SectorIntelligenceOrchestrator,
  CompanyDiscoveryScraper,
  SustainabilityReportParser,
  SectorBenchmarkAggregator,
  buildSectorBenchmark,
  getSectorBenchmark,
  getCompanyBenchmarkPosition,
} from './sector-intelligence';

export type {
  CompanyProfile,
  CompanyDiscoveryConfig,
  SustainabilityReportData,
  SectorBenchmark,
  CompanyBenchmarkPosition,
  BenchmarkStats,
} from './sector-intelligence';

/**
 * Automation Manager
 * Orchestrates all automation jobs
 */
export class AutomationManager {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Schedule automated utility bill collection
   */
  async scheduleUtilityBillCollection(
    provider: string,
    credentials: any,
    frequency: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ) {
    // TODO: Integrate with your scheduling system (cron, Bull queue, etc.)
    console.log(`[AutomationManager] Scheduling utility bill collection for ${provider}`);

    // For now, run immediately
    const { scrapePGEBills } = await import('./utility-providers/pge-scraper');
    return await scrapePGEBills(this.organizationId, this.userId, credentials);
  }

  /**
   * Schedule regulatory monitoring
   */
  async scheduleRegulatoryMonitoring(frequency: 'daily' | 'weekly' = 'daily') {
    console.log(`[AutomationManager] Scheduling regulatory monitoring`);

    const { scrapeEPARegulations } = await import('./regulatory/epa-scraper');
    return await scrapeEPARegulations(this.organizationId, this.userId);
  }

  /**
   * Schedule carbon market price tracking
   */
  async scheduleCarbonMarketTracking(frequency: 'hourly' | 'daily' = 'daily') {
    console.log(`[AutomationManager] Scheduling carbon market tracking`);

    const { scrapeCarbonMarkets } = await import('./carbon-markets/carbon-credit-scraper');
    return await scrapeCarbonMarkets(this.organizationId, this.userId);
  }

  /**
   * Verify supplier sustainability (on-demand)
   */
  async verifySupplier(supplierName: string, supplierWebsite: string) {
    console.log(`[AutomationManager] Verifying supplier: ${supplierName}`);

    const { verifySupplierSustainability } = await import('./supplier-verification/certification-checker');
    return await verifySupplierSustainability(
      this.organizationId,
      this.userId,
      supplierName,
      supplierWebsite
    );
  }

  /**
   * Track competitor ESG performance (on-demand or scheduled)
   */
  async trackCompetitor(
    companyName: string,
    companyWebsite: string,
    industry: string
  ) {
    console.log(`[AutomationManager] Tracking competitor: ${companyName}`);

    const { trackCompetitorESG } = await import('./competitor-intelligence/esg-tracker');
    return await trackCompetitorESG(
      this.organizationId,
      this.userId,
      companyName,
      companyWebsite,
      industry
    );
  }

  /**
   * Build sector benchmark database (on-demand)
   * This is a powerful feature that creates industry-wide benchmarking data
   */
  async buildSectorBenchmark(sector: string) {
    console.log(`[AutomationManager] Building sector benchmark for: ${sector}`);

    const { SectorIntelligenceOrchestrator } = await import('./sector-intelligence');
    const orchestrator = new SectorIntelligenceOrchestrator(this.organizationId, this.userId);

    return await orchestrator.buildSectorBenchmark(sector);
  }

  /**
   * Get company's position within sector benchmarks
   */
  async getCompanyBenchmarkPosition(companyName: string, sector: string) {
    console.log(`[AutomationManager] Getting benchmark position for: ${companyName}`);

    const { getCompanyBenchmarkPosition } = await import('./sector-intelligence');
    return await getCompanyBenchmarkPosition(companyName, sector);
  }

  /**
   * Get sector benchmark data
   */
  async getSectorBenchmark(sector: string, year?: number) {
    console.log(`[AutomationManager] Getting benchmark for sector: ${sector}`);

    const { getSectorBenchmark } = await import('./sector-intelligence');
    return await getSectorBenchmark(sector, year);
  }

  /**
   * List all available sector benchmarks
   */
  async listAvailableSectorBenchmarks() {
    console.log(`[AutomationManager] Listing available sector benchmarks`);

    const { SectorIntelligenceOrchestrator } = await import('./sector-intelligence');
    const orchestrator = new SectorIntelligenceOrchestrator(this.organizationId, this.userId);

    return await orchestrator.listAvailableSectors();
  }

  /**
   * Run all automation jobs
   * Useful for testing or manual execution
   */
  async runAllAutomations() {
    console.log(`[AutomationManager] Running all automation jobs...`);

    const results = {
      regulatory: await this.scheduleRegulatoryMonitoring(),
      carbonMarkets: await this.scheduleCarbonMarketTracking(),
    };

    return results;
  }
}
