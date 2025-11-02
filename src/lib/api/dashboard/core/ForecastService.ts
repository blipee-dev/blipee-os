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
        return this.getEnterpriseForecast(calculator, config, null);
      }

      // If Prophet is not enabled for this domain, use EnterpriseForecast
      if (!config.prophetConfig.enabled) {
        console.log(`[ForecastService] Prophet disabled for ${config.domain} - using EnterpriseForecast`);
        return this.getEnterpriseForecast(calculator, config, siteId);
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

      console.log(`⚠️ [ForecastService] No Prophet data for ${config.domain} - falling back to EnterpriseForecast (site: ${siteId})`);

      // 2. Fallback to EnterpriseForecast (with siteId)
      return this.getEnterpriseForecast(calculator, config, siteId);
    } catch (error) {
      console.error(`❌ [ForecastService] Error getting ${config.domain} forecast:`, error);
      // Final fallback to EnterpriseForecast on any error
      return this.getEnterpriseForecast(calculator, config, siteId);
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
      // Calculate months remaining until end of current year
      const today = new Date();
      const currentMonthIndex = today.getMonth(); // 0-11 (0=Jan, 9=Oct)
      const monthsRemainingThisYear = 12 - currentMonthIndex - 1; // Months after current (Nov-Dec = 2)

      console.log('[ForecastService] Forecast period:', {
        currentMonth: currentMonthIndex + 1,
        monthsRemaining: monthsRemainingThisYear,
      });

      let prophetResult = null;

      // Route to appropriate Prophet method based on domain
      switch (config.domain) {
        case 'energy':
          prophetResult = await ProphetForecastService.getEnergyForecast(
            organizationId,
            siteId,
            monthsRemainingThisYear
          );
          break;

        case 'water':
          prophetResult = await ProphetForecastService.getWaterForecast(
            organizationId,
            siteId,
            monthsRemainingThisYear
          );
          break;

        case 'waste':
          prophetResult = await ProphetForecastService.getWasteForecast(
            organizationId,
            siteId,
            monthsRemainingThisYear
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
    config: DomainConfig,
    siteId: string | null
  ): Promise<ForecastResult | null> {
    try {
      const projected = await calculator.getProjected(config.calculatorConfig.domain, siteId);

      if (!projected || !projected.forecast) {
        console.log(`[ForecastService] No projected data for ${config.domain}`);
        return null;
      }

      // Check if forecast is an array
      if (!Array.isArray(projected.forecast)) {
        console.error(`[ForecastService] projected.forecast is not an array for ${config.domain}:`, typeof projected.forecast);
        return null;
      }

      // Transform EnterpriseForecast format to unified ForecastResult format
      // EnterpriseForecast returns: { month: string, total: number, renewable: number, fossil: number }
      // We need: ForecastDataPoint with monthKey, month, total, isForecast, confidence
      const transformedForecast: ForecastDataPoint[] = projected.forecast.map((item: any) => {
        // Generate confidence intervals (±10% for Enterprise forecasts)
        const totalLower = item.total * 0.9;
        const totalUpper = item.total * 1.1;
        const renewableLower = (item.renewable || 0) * 0.9;
        const renewableUpper = (item.renewable || 0) * 1.1;
        const fossilLower = (item.fossil || 0) * 0.9;
        const fossilUpper = (item.fossil || 0) * 1.1;

        return {
          monthKey: item.month || item.monthKey, // Support both formats
          month: this.formatMonthLabel(item.month || item.monthKey),
          total: item.total,
          renewable: item.renewable,
          fossil: item.fossil,
          isForecast: true,
          confidence: {
            totalLower,
            totalUpper,
            renewableLower,
            renewableUpper,
            fossilLower,
            fossilUpper,
          },
        };
      });

      return {
        forecast: transformedForecast,
        model: 'enterprise',
        confidence: 0.75, // Default confidence for EnterpriseForecast
        metadata: {
          totalTrend: 'stable',
          dataPoints: transformedForecast.length,
          generatedAt: new Date().toISOString(),
          method: projected.method || 'seasonal_decomposition',
          forecastHorizon: transformedForecast.length,
        },
        hasProphetData: false,
      };
    } catch (error) {
      console.error(`[ForecastService] Error with EnterpriseForecast for ${config.domain}:`, error);
      return null;
    }
  }

  /**
   * Format month label from monthKey (e.g., "2025-11" -> "Nov")
   */
  private static formatMonthLabel(monthKey: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month] = monthKey.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return months[monthIndex] || monthKey;
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
