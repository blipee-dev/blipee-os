/**
 * Sector Intelligence System
 * Orchestrates company discovery, report parsing, and benchmark generation
 */

export * from './company-discovery';
export * from './report-parser';
export * from './benchmark-aggregator';

import { createClient } from '@/lib/supabase/server';
import { CompanyDiscoveryScraper, CompanyDiscoveryConfig, CompanyProfile } from './company-discovery';
import { SustainabilityReportParser, SustainabilityReportData } from './report-parser';
import { SectorBenchmarkAggregator, SectorBenchmark, CompanyBenchmarkPosition } from './benchmark-aggregator';

/**
 * Sector Intelligence Orchestrator
 * Main class for building sector benchmarking databases
 */
export class SectorIntelligenceOrchestrator {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Build complete sector benchmark database
   * This is the main workflow that:
   * 1. Discovers companies in the sector
   * 2. Finds their sustainability reports
   * 3. Parses the reports
   * 4. Generates sector benchmarks
   */
  async buildSectorBenchmark(sector: string): Promise<{
    companiesDiscovered: number;
    reportsParses: number;
    benchmarkGenerated: SectorBenchmark;
  }> {
    console.log(`[SectorIntelligence] Building benchmark for sector: ${sector}`);

    // Step 1: Discover companies in the sector
    const companies = await this.discoverCompanies(sector);
    console.log(`[SectorIntelligence] Discovered ${companies.length} companies`);

    // Step 2: Find and parse sustainability reports
    let reportsParsed = 0;
    for (const company of companies) {
      try {
        const reportUrl = await this.findSustainabilityReport(company);
        if (reportUrl) {
          await this.parseReport(company.name, reportUrl);
          reportsParsed++;
          console.log(`[SectorIntelligence] Parsed report for ${company.name}`);
        }
      } catch (error) {
        console.error(`[SectorIntelligence] Failed to parse report for ${company.name}:`, error);
      }

      // Rate limiting: Wait between companies
      await this.sleep(2000);
    }

    // Step 3: Generate sector benchmark
    const benchmark = await this.generateBenchmark(sector);
    console.log(`[SectorIntelligence] Generated benchmark with ${benchmark.companyCount} companies`);

    return {
      companiesDiscovered: companies.length,
      reportsParses: reportsParsed,
      benchmarkGenerated: benchmark,
    };
  }

  /**
   * Discover companies in a sector
   */
  async discoverCompanies(sector: string, maxResults: number = 50): Promise<CompanyProfile[]> {
    const config: CompanyDiscoveryConfig = {
      sector,
      maxResults,
      region: 'global',
    };

    const scraper = new CompanyDiscoveryScraper(
      { organizationId: this.organizationId, userId: this.userId },
      config
    );

    const result = await scraper.scrape();

    if (!result.success || !result.data) {
      throw new Error(`Company discovery failed: ${result.error}`);
    }

    // Save to database
    await this.saveCompaniesToDatabase(result.data);

    return result.data;
  }

  /**
   * Find sustainability report for a company
   */
  private async findSustainabilityReport(company: CompanyProfile): Promise<string | null> {
    const supabase = await createClient();

    // Check if we already have the report URL
    const { data: existingReport } = await supabase
      .from('sector_company_reports')
      .select('report_url')
      .eq('company_name', company.name)
      .order('report_year', { ascending: false })
      .limit(1)
      .single();

    if (existingReport) {
      return existingReport.report_url;
    }

    // If company profile has report URL, use it
    if (company.sustainabilityReportUrl) {
      return company.sustainabilityReportUrl;
    }

    // Otherwise, search company website for sustainability report
    return await this.searchForReport(company.website);
  }

  /**
   * Search company website for sustainability report
   */
  private async searchForReport(website: string): Promise<string | null> {
    // Common paths for sustainability reports
    const paths = [
      '/sustainability/report',
      '/sustainability/reports',
      '/esg/report',
      '/corporate-responsibility/report',
      '/investors/sustainability',
      '/about/sustainability',
    ];

    for (const path of paths) {
      try {
        const url = `${website}${path}`;
        // Would use Puppeteer to check if page exists and has PDF links
        // For now, return null
        // const reportUrl = await this.findPDFLink(url);
        // if (reportUrl) return reportUrl;
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Parse sustainability report
   */
  async parseReport(companyName: string, reportUrl: string): Promise<SustainabilityReportData> {
    const parser = new SustainabilityReportParser(
      { organizationId: this.organizationId, userId: this.userId },
      companyName,
      reportUrl
    );

    const result = await parser.scrape();

    if (!result.success || !result.data) {
      throw new Error(`Report parsing failed: ${result.error}`);
    }

    // Save to database
    await this.saveReportToDatabase(result.data);

    return result.data;
  }

  /**
   * Generate sector benchmark
   */
  async generateBenchmark(sector: string, year?: number): Promise<SectorBenchmark> {
    const aggregator = new SectorBenchmarkAggregator(sector, year);
    return await aggregator.generateBenchmark();
  }

  /**
   * Get company's position within sector benchmarks
   */
  async getCompanyPosition(companyName: string, sector: string): Promise<CompanyBenchmarkPosition> {
    const aggregator = new SectorBenchmarkAggregator(sector);
    return await aggregator.getCompanyPosition(companyName);
  }

  /**
   * Get existing sector benchmark
   */
  async getSectorBenchmark(sector: string, year?: number): Promise<SectorBenchmark | null> {
    const supabase = await createClient();

    const targetYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('sector_benchmarks')
      .select('*')
      .eq('sector', sector)
      .eq('report_year', targetYear)
      .single();

    if (error || !data) {
      return null;
    }

    return data.benchmark_data as SectorBenchmark;
  }

  /**
   * List all available sectors with benchmarks
   */
  async listAvailableSectors(): Promise<Array<{ sector: string; companyCount: number; lastUpdated: Date }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sector_benchmarks')
      .select('sector, company_count, last_updated')
      .order('sector');

    if (error || !data) {
      return [];
    }

    return data.map(d => ({
      sector: d.sector,
      companyCount: d.company_count,
      lastUpdated: new Date(d.last_updated),
    }));
  }

  /**
   * Save discovered companies to database
   */
  private async saveCompaniesToDatabase(companies: CompanyProfile[]): Promise<void> {
    const supabase = await createClient();

    for (const company of companies) {
      await supabase.from('sector_companies').upsert({
        company_name: company.name,
        website: company.website,
        sector: company.sector,
        industry: company.industry,
        company_size: company.size,
        country: company.country,
        stock_ticker: company.stockTicker,
        has_sustainability_report: !!company.sustainabilityReportUrl,
        discovered_at: new Date().toISOString(),
      }, {
        onConflict: 'company_name,sector',
      });
    }
  }

  /**
   * Save parsed report to database
   */
  private async saveReportToDatabase(report: SustainabilityReportData): Promise<void> {
    const supabase = await createClient();

    // First, get or create company
    const { data: company } = await supabase
      .from('sector_companies')
      .select('id')
      .eq('company_name', report.companyName)
      .single();

    await supabase.from('sector_company_reports').upsert({
      company_id: company?.id,
      company_name: report.companyName,
      sector: 'Unknown', // Would need to be passed in
      report_year: report.reportYear,
      report_url: report.reportUrl,
      report_type: report.reportType,
      scope1_emissions: report.scope1Emissions,
      scope2_emissions: report.scope2Emissions,
      scope3_emissions: report.scope3Emissions,
      total_emissions: report.totalEmissions,
      carbon_neutral_target: report.carbonNeutralTarget,
      net_zero_target: report.netZeroTarget,
      emission_reduction_target: report.emissionReductionTarget,
      renewable_energy_percent: report.renewableEnergyPercent,
      renewable_energy_target: report.renewableEnergyTarget,
      water_withdrawal: report.waterWithdrawal,
      water_discharge: report.waterDischarge,
      waste_generated: report.wasteGenerated,
      waste_recycled: report.wasteRecycled,
      waste_recycling_rate: report.wasteRecyclingRate,
      employee_count: report.employeeCount,
      women_in_leadership: report.womenInLeadership,
      diversity_metrics: report.diversityMetrics,
      board_independence: report.boardIndependence,
      esg_linked_compensation: report.esgLinkedCompensation,
      externally_assured: report.externallyAssured,
      assurance_provider: report.assuranceProvider,
      reporting_standards: report.reportingStandards,
      raw_text: report.rawText,
      parsed_at: new Date().toISOString(),
      parsed_by: this.userId,
    }, {
      onConflict: 'company_name,sector,report_year',
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Convenience functions
 */

export async function buildSectorBenchmark(
  organizationId: string,
  userId: string,
  sector: string
) {
  const orchestrator = new SectorIntelligenceOrchestrator(organizationId, userId);
  return await orchestrator.buildSectorBenchmark(sector);
}

export async function getSectorBenchmark(sector: string, year?: number) {
  const orchestrator = new SectorIntelligenceOrchestrator('system', 'system');
  return await orchestrator.getSectorBenchmark(sector, year);
}

export async function getCompanyBenchmarkPosition(
  companyName: string,
  sector: string
) {
  const orchestrator = new SectorIntelligenceOrchestrator('system', 'system');
  return await orchestrator.getCompanyPosition(companyName, sector);
}
