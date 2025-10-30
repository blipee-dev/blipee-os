/**
 * Forecast Service - Universal Abstraction Layer
 *
 * Handles forecast retrieval with automatic fallback:
 * 1. Try Prophet forecast first (pre-computed, high quality)
 * 2. Fall back to EnterpriseForecast if no Prophet data
 *
 * Works for all domains: Energy, Water, Waste, Transport
 */

import { ProphetForecastService } from '@/lib/forecasting/prophet-forecast-service';
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';
import { DomainConfig, ForecastDataPoint, ForecastResult } from './types';

export class ForecastService {
  /**
   * Get forecast for any domain with automatic fallback
   *
   * @param organizationId - Organization ID
   * @param siteId - Site ID (null = organization-wide)
   * @param config - Domain configuration (energy, water, waste)
   * @param calculator - Unified sustainability calculator
   * @returns Forecast data with confidence and metadata
   */
  static async getForecast(
    organizationId: string,
    siteId: string | null,
    config: DomainConfig,
    calculator: UnifiedSustainabilityCalculator
  ): Promise<ForecastResult | null> {
    try {
      // If no site selected, use EnterpriseForecast
      if (!siteId) {
        console.log(`[ForecastService] No site selected for ${config.domain} - using EnterpriseForecast`);
        return this.getEnterpriseForecast(calculator, config);
      }

      // If Prophet is not enabled for this domain, use EnterpriseForecast
      if (!config.prophetConfig.enabled) {
        console.log(`[ForecastService] Prophet disabled for ${config.domain} - using EnterpriseForecast`);
        return this.getEnterpriseForecast(calculator, config);
      }

      // 1. Try Prophet forecast first (higher quality, pre-computed)
      const prophetForecast = await this.getProphetForecast(
        organizationId,
        siteId,
        config
      );

      if (prophetForecast && prophetForecast.hasProphetData) {
        console.log(`✅ [ForecastService] Using Prophet forecast for ${config.domain}!`);
        return prophetForecast;
      }

      console.log(`⚠️ [ForecastService] No Prophet data for ${config.domain} - falling back to EnterpriseForecast`);

      // 2. Fallback to EnterpriseForecast
      return this.getEnterpriseForecast(calculator, config);
    } catch (error) {
      console.error(`❌ [ForecastService] Error getting ${config.domain} forecast:`, error);
      // Final fallback to EnterpriseForecast on any error
      return this.getEnterpriseForecast(calculator, config);
    }
  }

  /**
   * Get Prophet forecast for a specific domain
   */
  private static async getProphetForecast(
    organizationId: string,
    siteId: string,
    config: DomainConfig
  ): Promise<ForecastResult | null> {
    try {
      let prophetResult = null;

      // Route to appropriate Prophet method based on domain
      switch (config.domain) {
        case 'energy':
          prophetResult = await ProphetForecastService.getEnergyForecast(
            organizationId,
            siteId
          );
          break;

        case 'water':
          prophetResult = await ProphetForecastService.getWaterForecast(
            organizationId,
            siteId
          );
          break;

        case 'waste':
          prophetResult = await ProphetForecastService.getWasteForecast(
            organizationId,
            siteId
          );
          break;

        default:
          console.log(`[ForecastService] Domain ${config.domain} not supported by Prophet`);
          return null;
      }

      if (!prophetResult) {
        return null;
      }

      // Return Prophet forecast in standardized format
      return {
        forecast: prophetResult.forecast,
        model: 'prophet',
        confidence: prophetResult.confidence,
        metadata: prophetResult.metadata,
        hasProphetData: true,
      };
    } catch (error) {
      console.error(`[ForecastService] Error fetching Prophet ${config.domain} forecast:`, error);
      return null;
    }
  }

  /**
   * Get EnterpriseForecast (fallback method)
   */
  private static async getEnterpriseForecast(
    calculator: UnifiedSustainabilityCalculator,
    config: DomainConfig
  ): Promise<ForecastResult | null> {
    try {
      const projected = await calculator.getProjected(config.calculatorConfig.domain);

      if (!projected || !projected.forecast) {
        return null;
      }

      // Transform EnterpriseForecast format to unified ForecastResult format
      return {
        forecast: projected.forecast as ForecastDataPoint[],
        model: 'enterprise',
        confidence: 0.75, // Default confidence for EnterpriseForecast
        metadata: {
          totalTrend: 'stable',
          dataPoints: projected.forecast.length,
          generatedAt: new Date().toISOString(),
          method: projected.method || 'seasonal_decomposition',
          forecastHorizon: projected.forecast.length,
        },
        hasProphetData: false,
      };
    } catch (error) {
      console.error(`[ForecastService] Error with EnterpriseForecast for ${config.domain}:`, error);
      return null;
    }
  }

  /**
   * Calculate projected value from forecast
   */
  static calculateProjectedValue(forecast: ForecastDataPoint[]): number {
    if (!forecast || forecast.length === 0) return 0;

    // Sum all forecasted values
    return forecast.reduce((sum, point) => sum + point.total, 0);
  }

  /**
   * Calculate YTD value from forecast (up to current month)
   */
  static calculateYTD(forecast: ForecastDataPoint[]): number {
    if (!forecast || forecast.length === 0) return 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Sum only up to current month
    return forecast
      .filter((point) => {
        const [year, month] = point.monthKey.split('-').map(Number);
        return year < currentYear || (year === currentYear && month <= currentMonth);
      })
      .reduce((sum, point) => sum + point.total, 0);
  }
}
