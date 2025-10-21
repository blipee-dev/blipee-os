/**
 * Unified Sustainability Calculator
 *
 * Single source of truth for all sustainability calculations across domains.
 * Provides consistent baseline, target, projected, and progress calculations
 * for Energy, Water, Waste, and Emissions dashboards.
 *
 * Key Features:
 * - Dynamic baseline years (from sustainability_targets)
 * - Domain-specific reduction rates (org-customizable)
 * - Linear reduction formula (SBTi-compliant)
 * - Unified ML forecast with fallbacks
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateProgress } from '@/lib/utils/progress-calculation';
import {
  getPeriodEmissions,
  getEnergyTotal,
  getWaterTotal,
  getWasteTotal
} from './baseline-calculator';

export type Domain = 'energy' | 'water' | 'waste' | 'emissions';

export interface SustainabilityTarget {
  id: string;
  organization_id: string;
  baseline_year: number;
  baseline_emissions: number;
  target_year: number;
  target_emissions: number;
  energy_reduction_percent: number;
  water_reduction_percent: number;
  waste_reduction_percent: number;
  emissions_reduction_percent: number;
}

export interface BaselineResult {
  value: number;
  unit: string;
  year: number;
  breakdown?: Record<string, number>;
}

export interface TargetResult {
  value: number;
  unit: string;
  year: number;
  reductionPercent: number;
  formula: 'linear';
}

export interface ProjectedResult {
  value: number;
  unit: string;
  year: number;
  method: 'ml_forecast' | 'replanning' | 'linear_fallback';
  ytd: number;
  forecast: number;
}

export interface ProgressResult {
  baseline: number;
  target: number;
  projected: number;
  progressPercent: number;
  exceedancePercent: number;
  status: 'on-track' | 'at-risk' | 'off-track' | 'exceeded-baseline';
  reductionNeeded: number;
  reductionAchieved: number;
}

export class UnifiedSustainabilityCalculator {
  private organizationId: string;
  private currentYear: number;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.currentYear = new Date().getFullYear();
  }

  /**
   * Get sustainability target for organization
   */
  async getSustainabilityTarget(): Promise<SustainabilityTarget | null> {
    const { data, error } = await supabaseAdmin
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching sustainability target:', error);
      return null;
    }

    return data as SustainabilityTarget;
  }

  /**
   * Get baseline value for a specific domain and year
   *
   * ✅ FIXED: Now uses baseline-calculator paginated functions for ALL domains
   * to ensure proper handling of >1000 records and consistent calculations.
   */
  async getBaseline(domain: Domain, year?: number): Promise<BaselineResult | null> {
    const target = await this.getSustainabilityTarget();
    const baselineYear = year || target?.baseline_year || 2023;

    const startDate = `${baselineYear}-01-01`;
    const endDate = `${baselineYear}-12-31`;

    // Use baseline-calculator paginated functions for all domains
    switch (domain) {
      case 'emissions': {
        const emissions = await getPeriodEmissions(this.organizationId, startDate, endDate);
        return {
          value: emissions.total,
          unit: 'tCO2e',
          year: baselineYear,
        };
      }

      case 'energy': {
        const energy = await getEnergyTotal(this.organizationId, startDate, endDate);
        return {
          value: energy.value,
          unit: energy.unit,
          year: baselineYear,
        };
      }

      case 'water': {
        const water = await getWaterTotal(this.organizationId, startDate, endDate);
        return {
          value: water.value,
          unit: water.unit,
          year: baselineYear,
        };
      }

      case 'waste': {
        const waste = await getWasteTotal(this.organizationId, startDate, endDate);
        // Convert kg to tonnes for consistency
        return {
          value: Math.round(waste.value / 1000 * 10) / 10,
          unit: 'tonnes',
          year: baselineYear,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Get reduction rate for a specific domain
   */
  private getReductionRate(target: SustainabilityTarget, domain: Domain): number {
    switch (domain) {
      case 'energy':
        return target.energy_reduction_percent || 4.2;
      case 'water':
        return target.water_reduction_percent || 2.5;
      case 'waste':
        return target.waste_reduction_percent || 3.0;
      case 'emissions':
        return target.emissions_reduction_percent || target.target_reduction_percent || 4.2;
      default:
        return 4.2;
    }
  }

  /**
   * Calculate target using linear reduction formula
   * Formula: baseline × (1 - annualizedRate × yearsSinceBaseline)
   *
   * The reduction rate is TOTAL reduction by target year, annualized linearly.
   * Example: 42% reduction by 2030 (7 years) = 6% per year
   *
   * This is the SBTi-compliant method that's simpler to understand
   * and more conservative than compound reduction.
   */
  async getTarget(domain: Domain): Promise<TargetResult | null> {
    const target = await this.getSustainabilityTarget();
    if (!target) return null;

    const baseline = await this.getBaseline(domain, target.baseline_year);
    if (!baseline) return null;

    const reductionRate = this.getReductionRate(target, domain);
    const yearsSinceBaseline = this.currentYear - target.baseline_year;
    const totalYearsToTarget = target.target_year - target.baseline_year;

    // Annualize the reduction rate: totalReduction / totalYears
    // Example: 42% over 7 years = 6% per year
    const annualizedRate = reductionRate / totalYearsToTarget;

    // Linear reduction: baseline × (1 - annualizedRate × yearsSinceBaseline)
    const targetValue = baseline.value * (1 - (annualizedRate / 100) * yearsSinceBaseline);

    return {
      value: Math.round(targetValue * 10) / 10,
      unit: baseline.unit,
      year: this.currentYear,
      reductionPercent: annualizedRate, // Return the annualized rate
      formula: 'linear',
    };
  }

  /**
   * Get YTD actual value for current year
   *
   * ✅ FIXED: Now uses baseline-calculator paginated functions for ALL domains
   * to ensure proper handling of >1000 records and consistent calculations.
   */
  async getYTDActual(domain: Domain): Promise<number> {
    const currentMonth = new Date().getMonth() + 1;
    const startDate = `${this.currentYear}-01-01`;
    const endDate = `${this.currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;

    // Use baseline-calculator paginated functions for all domains
    switch (domain) {
      case 'emissions': {
        const emissions = await getPeriodEmissions(this.organizationId, startDate, endDate);
        return emissions.total;
      }

      case 'energy': {
        const energy = await getEnergyTotal(this.organizationId, startDate, endDate);
        return energy.value;
      }

      case 'water': {
        const water = await getWaterTotal(this.organizationId, startDate, endDate);
        return water.value;
      }

      case 'waste': {
        const waste = await getWasteTotal(this.organizationId, startDate, endDate);
        // Convert kg to tonnes for consistency
        return Math.round(waste.value / 1000 * 10) / 10;
      }

      default:
        return 0;
    }
  }

  /**
   * Get projected value using ML forecast
   * Fallback hierarchy:
   * 1. Replanning trajectory (emissions only)
   * 2. ML forecast (EnterpriseForecast)
   * 3. Simple linear projection
   */
  async getProjected(domain: Domain): Promise<ProjectedResult | null> {
    const ytd = await this.getYTDActual(domain);
    const currentMonth = new Date().getMonth() + 1;
    const remainingMonths = 12 - currentMonth;

    // Method 1: Try ML forecast (implemented in unified-forecast.ts)
    try {
      const forecastModule = await import('./unified-forecast');
      const forecast = await forecastModule.getUnifiedForecast({
        organizationId: this.organizationId,
        domain,
        startDate: `${this.currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`,
        endDate: `${this.currentYear}-12-31`,
      });

      if (forecast && forecast.total > 0) {
        return {
          value: Math.round((ytd + forecast.total) * 10) / 10,
          unit: this.getUnit(domain),
          year: this.currentYear,
          method: 'ml_forecast',
          ytd,
          forecast: forecast.total,
        };
      }
    } catch (error) {
      console.log('ML forecast not available, using linear fallback');
    }

    // Method 2: Simple linear projection (fallback)
    const monthlyAverage = ytd / currentMonth;
    const projectedAnnual = monthlyAverage * 12;

    return {
      value: Math.round(projectedAnnual * 10) / 10,
      unit: this.getUnit(domain),
      year: this.currentYear,
      method: 'linear_fallback',
      ytd,
      forecast: monthlyAverage * remainingMonths,
    };
  }

  /**
   * Calculate progress toward target
   */
  async calculateProgressToTarget(domain: Domain): Promise<ProgressResult | null> {
    const baseline = await this.getBaseline(domain);
    const target = await this.getTarget(domain);
    const projected = await this.getProjected(domain);

    if (!baseline || !target || !projected) {
      return null;
    }

    const progress = calculateProgress(
      baseline.value,
      target.value,
      projected.value
    );

    return {
      baseline: baseline.value,
      target: target.value,
      projected: projected.value,
      progressPercent: progress.progressPercent,
      exceedancePercent: progress.exceedancePercent,
      status: progress.status,
      reductionNeeded: progress.reductionNeeded,
      reductionAchieved: progress.reductionAchieved,
    };
  }

  /**
   * Helper: Get unit for domain
   */
  private getUnit(domain: Domain): string {
    switch (domain) {
      case 'energy':
        return 'tCO2e';
      case 'water':
        return 'ML';
      case 'waste':
        return 'tonnes';
      case 'emissions':
        return 'tCO2e';
    }
  }
}
