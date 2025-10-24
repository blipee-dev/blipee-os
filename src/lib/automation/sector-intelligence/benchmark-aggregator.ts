/**
 * Sector Benchmark Aggregator
 * Aggregates sustainability data across companies in a sector
 * Creates industry benchmarks for comparison
 */

import { createClient } from '@/lib/supabase/server';
import { SustainabilityReportData } from './report-parser';

export interface SectorBenchmark {
  sector: string; // GRI sector code
  reportYear: number;
  companyCount: number;
  lastUpdated: Date;

  // Emissions benchmarks
  emissions: {
    scope1: BenchmarkStats;
    scope2: BenchmarkStats;
    scope3: BenchmarkStats;
    total: BenchmarkStats;
    intensity?: BenchmarkStats; // Per revenue or per employee
  };

  // Targets benchmarks
  targets: {
    carbonNeutralTargetYear: BenchmarkStats;
    netZeroTargetYear: BenchmarkStats;
    emissionReductionPercentage: BenchmarkStats;
  };

  // Renewable energy benchmarks
  renewableEnergy: {
    currentPercent: BenchmarkStats;
    targetPercent: BenchmarkStats;
    targetYear: BenchmarkStats;
  };

  // Waste benchmarks
  waste: {
    recyclingRate: BenchmarkStats;
    totalGenerated: BenchmarkStats;
  };

  // Social benchmarks
  social: {
    womenInLeadership: BenchmarkStats;
    employeeCount: BenchmarkStats;
  };

  // Reporting practices
  reporting: {
    externallyAssuredPercent: number; // % of companies with external assurance
    commonStandards: Array<{ standard: string; percentage: number }>; // % using GRI, SASB, etc.
  };

  // Leaders & laggards
  leaders: Array<{ companyName: string; score: number }>; // Top 10%
  laggards: Array<{ companyName: string; score: number }>; // Bottom 10%
}

export interface BenchmarkStats {
  min: number;
  max: number;
  median: number;
  average: number;
  p25: number; // 25th percentile
  p75: number; // 75th percentile
  p90: number; // 90th percentile
}

export interface CompanyBenchmarkPosition {
  companyName: string;
  sector: string;
  overallScore: number; // 0-100
  percentileRank: number; // 0-100 (higher is better)

  // Specific metric comparisons
  emissions: {
    value: number;
    percentile: number;
    vsMedian: string; // "+25% above median" or "-15% below median"
    vsAverage: string;
  };

  targets: {
    carbonNeutralTarget?: number;
    percentile: number;
    vsMedian: string;
  };

  renewableEnergy: {
    percent: number;
    percentile: number;
    vsMedian: string;
  };

  insights: string[]; // AI-generated insights
  recommendations: string[]; // AI-generated recommendations
}

/**
 * Aggregates sector data and calculates benchmarks
 */
export class SectorBenchmarkAggregator {
  private sector: string;
  private reportYear: number;

  constructor(sector: string, reportYear: number = new Date().getFullYear()) {
    this.sector = sector;
    this.reportYear = reportYear;
  }

  /**
   * Generate sector benchmark from all collected reports
   */
  async generateBenchmark(): Promise<SectorBenchmark> {
    const supabase = await createClient();

    // Fetch all company reports for this sector
    const { data: reports, error } = await supabase
      .from('sector_company_reports')
      .select('*')
      .eq('sector', this.sector)
      .gte('report_year', this.reportYear - 2) // Last 2 years
      .lte('report_year', this.reportYear);

    if (error || !reports || reports.length === 0) {
      throw new Error(`No reports found for sector ${this.sector}`);
    }

    const benchmark: SectorBenchmark = {
      sector: this.sector,
      reportYear: this.reportYear,
      companyCount: reports.length,
      lastUpdated: new Date(),
      emissions: {
        scope1: this.calculateStats(reports.map(r => r.scope1_emissions).filter(Boolean)),
        scope2: this.calculateStats(reports.map(r => r.scope2_emissions).filter(Boolean)),
        scope3: this.calculateStats(reports.map(r => r.scope3_emissions).filter(Boolean)),
        total: this.calculateStats(reports.map(r => r.total_emissions).filter(Boolean)),
      },
      targets: {
        carbonNeutralTargetYear: this.calculateStats(reports.map(r => r.carbon_neutral_target).filter(Boolean)),
        netZeroTargetYear: this.calculateStats(reports.map(r => r.net_zero_target).filter(Boolean)),
        emissionReductionPercentage: this.calculateStats(
          reports
            .map(r => r.emission_reduction_target?.percentage)
            .filter(Boolean)
        ),
      },
      renewableEnergy: {
        currentPercent: this.calculateStats(reports.map(r => r.renewable_energy_percent).filter(Boolean)),
        targetPercent: this.calculateStats(
          reports
            .map(r => r.renewable_energy_target?.percentage)
            .filter(Boolean)
        ),
        targetYear: this.calculateStats(
          reports
            .map(r => r.renewable_energy_target?.targetYear)
            .filter(Boolean)
        ),
      },
      waste: {
        recyclingRate: this.calculateStats(reports.map(r => r.waste_recycling_rate).filter(Boolean)),
        totalGenerated: this.calculateStats(reports.map(r => r.waste_generated).filter(Boolean)),
      },
      social: {
        womenInLeadership: this.calculateStats(reports.map(r => r.women_in_leadership).filter(Boolean)),
        employeeCount: this.calculateStats(reports.map(r => r.employee_count).filter(Boolean)),
      },
      reporting: {
        externallyAssuredPercent: this.calculatePercentage(reports, r => r.externally_assured === true),
        commonStandards: this.calculateStandardsUsage(reports),
      },
      leaders: this.identifyLeaders(reports),
      laggards: this.identifyLaggards(reports),
    };

    // Save benchmark to database
    await this.saveBenchmark(benchmark);

    return benchmark;
  }

  /**
   * Calculate statistics for a set of values
   */
  private calculateStats(values: number[]): BenchmarkStats {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        median: 0,
        average: 0,
        p25: 0,
        p75: 0,
        p90: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: this.percentile(sorted, 50),
      average: sum / sorted.length,
      p25: this.percentile(sorted, 25),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
    };
  }

  /**
   * Calculate percentile value
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate percentage of companies meeting a criteria
   */
  private calculatePercentage(reports: any[], predicate: (r: any) => boolean): number {
    const count = reports.filter(predicate).length;
    return (count / reports.length) * 100;
  }

  /**
   * Calculate which reporting standards are most commonly used
   */
  private calculateStandardsUsage(reports: any[]): Array<{ standard: string; percentage: number }> {
    const standardCounts: Record<string, number> = {};

    for (const report of reports) {
      const standards = report.reporting_standards || [];
      for (const standard of standards) {
        standardCounts[standard] = (standardCounts[standard] || 0) + 1;
      }
    }

    return Object.entries(standardCounts)
      .map(([standard, count]) => ({
        standard,
        percentage: (count / reports.length) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Identify industry leaders (top 10% overall score)
   */
  private identifyLeaders(reports: any[]): Array<{ companyName: string; score: number }> {
    const scored = reports.map(r => ({
      companyName: r.company_name,
      score: this.calculateOverallScore(r),
    }));

    scored.sort((a, b) => b.score - a.score);

    const top10PercentCount = Math.ceil(scored.length * 0.1);
    return scored.slice(0, top10PercentCount);
  }

  /**
   * Identify laggards (bottom 10%)
   */
  private identifyLaggards(reports: any[]): Array<{ companyName: string; score: number }> {
    const scored = reports.map(r => ({
      companyName: r.company_name,
      score: this.calculateOverallScore(r),
    }));

    scored.sort((a, b) => a.score - b.score); // Ascending

    const bottom10PercentCount = Math.ceil(scored.length * 0.1);
    return scored.slice(0, bottom10PercentCount);
  }

  /**
   * Calculate overall sustainability score (0-100)
   */
  private calculateOverallScore(report: any): number {
    let score = 0;
    let maxScore = 0;

    // Emissions reporting (20 points)
    maxScore += 20;
    if (report.scope1_emissions) score += 7;
    if (report.scope2_emissions) score += 7;
    if (report.scope3_emissions) score += 6;

    // Targets (20 points)
    maxScore += 20;
    if (report.carbon_neutral_target) score += 10;
    if (report.net_zero_target) score += 10;

    // Renewable energy (15 points)
    maxScore += 15;
    if (report.renewable_energy_percent) {
      score += (report.renewable_energy_percent / 100) * 15;
    }

    // External assurance (10 points)
    maxScore += 10;
    if (report.externally_assured) score += 10;

    // Reporting standards (15 points)
    maxScore += 15;
    const standards = report.reporting_standards || [];
    score += Math.min(standards.length * 5, 15);

    // Emission reduction target (20 points)
    maxScore += 20;
    if (report.emission_reduction_target) {
      const targetPercentage = report.emission_reduction_target.percentage || 0;
      score += Math.min(targetPercentage / 5, 20); // Max 20 points for 100% reduction
    }

    return (score / maxScore) * 100;
  }

  /**
   * Get a specific company's position within sector benchmarks
   */
  async getCompanyPosition(companyName: string): Promise<CompanyBenchmarkPosition> {
    const supabase = await createClient();

    // Get company report
    const { data: companyReport } = await supabase
      .from('sector_company_reports')
      .select('*')
      .eq('company_name', companyName)
      .eq('sector', this.sector)
      .order('report_year', { ascending: false })
      .limit(1)
      .single();

    if (!companyReport) {
      throw new Error(`No report found for ${companyName}`);
    }

    // Get sector benchmark
    const benchmark = await this.generateBenchmark();

    // Calculate company's percentile rankings
    const emissionsPercentile = this.calculatePercentileRank(
      companyReport.total_emissions,
      benchmark.emissions.total,
      'lower-is-better'
    );

    const renewablePercentile = this.calculatePercentileRank(
      companyReport.renewable_energy_percent,
      benchmark.renewableEnergy.currentPercent,
      'higher-is-better'
    );

    const overallScore = this.calculateOverallScore(companyReport);
    const overallPercentile = this.calculateOverallPercentile(overallScore, benchmark);

    return {
      companyName,
      sector: this.sector,
      overallScore,
      percentileRank: overallPercentile,
      emissions: {
        value: companyReport.total_emissions,
        percentile: emissionsPercentile,
        vsMedian: this.formatVsMedian(companyReport.total_emissions, benchmark.emissions.total.median),
        vsAverage: this.formatVsMedian(companyReport.total_emissions, benchmark.emissions.total.average),
      },
      targets: {
        carbonNeutralTarget: companyReport.carbon_neutral_target,
        percentile: this.calculatePercentileRank(
          companyReport.carbon_neutral_target,
          benchmark.targets.carbonNeutralTargetYear,
          'lower-is-better'
        ),
        vsMedian: this.formatVsMedian(
          companyReport.carbon_neutral_target,
          benchmark.targets.carbonNeutralTargetYear.median
        ),
      },
      renewableEnergy: {
        percent: companyReport.renewable_energy_percent,
        percentile: renewablePercentile,
        vsMedian: this.formatVsMedian(
          companyReport.renewable_energy_percent,
          benchmark.renewableEnergy.currentPercent.median
        ),
      },
      insights: this.generateInsights(companyReport, benchmark),
      recommendations: this.generateRecommendations(companyReport, benchmark),
    };
  }

  /**
   * Calculate percentile rank for a value within a benchmark
   */
  private calculatePercentileRank(
    value: number,
    stats: BenchmarkStats,
    direction: 'higher-is-better' | 'lower-is-better'
  ): number {
    if (!value) return 0;

    const range = stats.max - stats.min;
    if (range === 0) return 50;

    let percentile: number;

    if (direction === 'higher-is-better') {
      percentile = ((value - stats.min) / range) * 100;
    } else {
      percentile = ((stats.max - value) / range) * 100;
    }

    return Math.max(0, Math.min(100, percentile));
  }

  /**
   * Calculate overall percentile based on score
   */
  private calculateOverallPercentile(score: number, benchmark: SectorBenchmark): number {
    const allScores = [
      ...benchmark.leaders.map(l => l.score),
      ...benchmark.laggards.map(l => l.score),
    ].sort((a, b) => a - b);

    const rank = allScores.filter(s => s <= score).length;
    return (rank / allScores.length) * 100;
  }

  /**
   * Format comparison vs median/average
   */
  private formatVsMedian(value: number, benchmark: number): string {
    if (!value || !benchmark) return 'N/A';

    const diff = ((value - benchmark) / benchmark) * 100;
    const sign = diff > 0 ? '+' : '';

    return `${sign}${diff.toFixed(1)}% vs benchmark`;
  }

  /**
   * Generate insights for a company
   */
  private generateInsights(report: any, benchmark: SectorBenchmark): string[] {
    const insights: string[] = [];

    // Emissions insight
    if (report.total_emissions && report.total_emissions < benchmark.emissions.total.median) {
      insights.push(`Your total emissions (${report.total_emissions.toLocaleString()} tCO2e) are below the sector median - great job!`);
    } else if (report.total_emissions > benchmark.emissions.total.p75) {
      insights.push(`Your emissions are in the top 25% highest in your sector. Consider emission reduction initiatives.`);
    }

    // Renewable energy insight
    if (report.renewable_energy_percent > benchmark.renewableEnergy.currentPercent.p75) {
      insights.push(`You're a renewable energy leader with ${report.renewable_energy_percent}% renewable energy.`);
    }

    // Target insight
    if (report.carbon_neutral_target && report.carbon_neutral_target < benchmark.targets.carbonNeutralTargetYear.median) {
      insights.push(`Your carbon neutral target (${report.carbon_neutral_target}) is ahead of the sector median.`);
    }

    return insights;
  }

  /**
   * Generate recommendations for a company
   */
  private generateRecommendations(report: any, benchmark: SectorBenchmark): string[] {
    const recommendations: string[] = [];

    // Missing Scope 3
    if (!report.scope3_emissions && benchmark.reporting.externallyAssuredPercent > 50) {
      recommendations.push('Consider measuring Scope 3 emissions - over 50% of your peers already report this.');
    }

    // No renewable energy target
    if (!report.renewable_energy_target && benchmark.renewableEnergy.currentPercent.median > 20) {
      recommendations.push('Set a renewable energy target - the sector median is already at 20%+.');
    }

    // No external assurance
    if (!report.externally_assured && benchmark.reporting.externallyAssuredPercent > 60) {
      recommendations.push('Consider getting external assurance for your sustainability report - 60%+ of peers do this.');
    }

    return recommendations;
  }

  /**
   * Save benchmark to database
   */
  private async saveBenchmark(benchmark: SectorBenchmark): Promise<void> {
    const supabase = await createClient();

    await supabase.from('sector_benchmarks').upsert({
      sector: benchmark.sector,
      report_year: benchmark.reportYear,
      company_count: benchmark.companyCount,
      benchmark_data: benchmark,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'sector,report_year',
    });
  }
}

/**
 * Convenience function to generate sector benchmark
 */
export async function generateSectorBenchmark(
  sector: string,
  year?: number
): Promise<SectorBenchmark> {
  const aggregator = new SectorBenchmarkAggregator(sector, year);
  return await aggregator.generateBenchmark();
}

/**
 * Convenience function to get company position
 */
export async function getCompanyBenchmarkPosition(
  companyName: string,
  sector: string
): Promise<CompanyBenchmarkPosition> {
  const aggregator = new SectorBenchmarkAggregator(sector);
  return await aggregator.getCompanyPosition(companyName);
}
