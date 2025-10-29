/**
 * Forecast Pre-Computation Service
 *
 * Runs Prophet forecasts 6 times per day (every 4 hours) to keep predictions fresh.
 * Schedule: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
 *
 * Benefits:
 * - Fresh forecasts every 4 hours
 * - Only ~8 minutes of CPU per day
 * - Instant dashboard loading (pre-computed)
 * - Automatic updates when new data arrives
 */

import { createClient } from '@supabase/supabase-js';
import { prophetClient } from '@/lib/forecasting/prophet-client';

interface ForecastStats {
  generated: number;
  skipped: number;
  errors: number;
  duration: number;
}

export class ForecastPrecomputeService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration for forecast service');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Main entry point - runs all forecast generation
   */
  async run(): Promise<ForecastStats> {
    const startTime = Date.now();
    const stats: ForecastStats = {
      generated: 0,
      skipped: 0,
      errors: 0,
      duration: 0,
    };

    console.log('🔮 Starting forecast pre-computation...');

    try {
      // 1. Check Prophet service health
      const isHealthy = await prophetClient.healthCheck();
      if (!isHealthy) {
        console.error('❌ Prophet service is not healthy - skipping forecasts');
        stats.errors++;
        stats.duration = Date.now() - startTime;
        return stats;
      }

      console.log('✅ Prophet service is healthy');

      // 2. Get all organizations
      const { data: organizations, error: orgError } = await this.supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null);

      if (orgError || !organizations) {
        console.error('❌ Failed to fetch organizations:', orgError);
        stats.errors++;
        stats.duration = Date.now() - startTime;
        return stats;
      }

      console.log(`📊 Processing ${organizations.length} organizations`);

      // 3. Generate forecasts for each organization and domain
      const domains = ['energy', 'water', 'waste', 'emissions'] as const;

      for (const org of organizations) {
        for (const domain of domains) {
          try {
            await this.generateForecast(org.id, org.name, domain, stats);
          } catch (error) {
            console.error(`❌ Failed to generate ${domain} forecast for ${org.name}:`, error);
            stats.errors++;
          }
        }
      }

      stats.duration = Date.now() - startTime;

      console.log('\n📈 Forecast Generation Summary:');
      console.log(`   Generated: ${stats.generated}`);
      console.log(`   Skipped:   ${stats.skipped}`);
      console.log(`   Errors:    ${stats.errors}`);
      console.log(`   Duration:  ${(stats.duration / 1000).toFixed(2)}s`);

      return stats;
    } catch (error) {
      stats.duration = Date.now() - startTime;
      console.error('❌ Forecast pre-computation failed:', error);
      throw error;
    }
  }

  /**
   * Generate forecast for a specific organization and domain
   */
  private async generateForecast(
    organizationId: string,
    organizationName: string,
    domain: 'energy' | 'water' | 'waste' | 'emissions',
    stats: ForecastStats
  ): Promise<void> {
    // 1. Check if recent forecast exists (< 4 hours old)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const { data: existingForecast } = await this.supabase
      .from('ml_predictions')
      .select('id, created_at')
      .eq('organization_id', organizationId)
      .eq('metadata->>domain', domain)
      .eq('prediction_type', 'forecast')
      .gte('created_at', fourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingForecast) {
      console.log(`⏭️  Skipping ${domain} for ${organizationName} (recent forecast exists)`);
      stats.skipped++;
      return;
    }

    // 2. Fetch historical data (last 24 months)
    const historicalData = await this.fetchHistoricalData(organizationId, domain);

    if (historicalData.length < 12) {
      console.log(`⏭️  Skipping ${domain} for ${organizationName} (insufficient data: ${historicalData.length} months)`);
      stats.skipped++;
      return;
    }

    // 3. Call Prophet service
    console.log(`🔮 Generating ${domain} forecast for ${organizationName} (${historicalData.length} months of data)`);

    const prophetResponse = await prophetClient.forecast({
      domain,
      organizationId,
      historicalData: historicalData.map(d => ({
        date: d.date,
        value: d.value,
      })),
      monthsToForecast: 12,
    });

    // 4. Store forecast in ml_predictions table
    const { error: insertError } = await this.supabase
      .from('ml_predictions')
      .insert({
        model_id: null, // Not using specific model ID for Prophet
        organization_id: organizationId,
        prediction_type: 'forecast',
        predicted_values: prophetResponse.forecasted,
        confidence_lower: prophetResponse.confidence.lower,
        confidence_upper: prophetResponse.confidence.upper,
        metadata: {
          domain,
          method: prophetResponse.method,
          trend: prophetResponse.metadata.trend,
          yearly: prophetResponse.metadata.yearly,
          historical_mean: prophetResponse.metadata.historical_mean,
          historical_std: prophetResponse.metadata.historical_std,
          data_points: prophetResponse.metadata.data_points,
          forecast_horizon: prophetResponse.metadata.forecast_horizon,
          generated_at: prophetResponse.metadata.generated_at,
        },
      });

    if (insertError) {
      console.error(`❌ Failed to store ${domain} forecast for ${organizationName}:`, insertError);
      stats.errors++;
      return;
    }

    console.log(`✅ ${domain} forecast generated for ${organizationName}`);
    stats.generated++;
  }

  /**
   * Fetch historical data for forecasting
   */
  private async fetchHistoricalData(
    organizationId: string,
    domain: string
  ): Promise<Array<{ date: string; value: number }>> {
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

    // Map domain to metric types
    const metricTypeMap: Record<string, string[]> = {
      energy: ['electricity_consumption', 'natural_gas_consumption'],
      water: ['water_consumption'],
      waste: ['waste_generated'],
      emissions: ['scope_1_emissions', 'scope_2_emissions'],
    };

    const metricTypes = metricTypeMap[domain] || [];

    const { data, error } = await this.supabase
      .from('metrics_data')
      .select('period_start, value')
      .eq('organization_id', organizationId)
      .in('metric_type', metricTypes)
      .gte('period_start', twentyFourMonthsAgo.toISOString())
      .order('period_start', { ascending: true });

    if (error || !data) {
      console.error(`Failed to fetch historical data for ${domain}:`, error);
      return [];
    }

    // Aggregate by month (sum all values for the same month)
    const monthlyData = new Map<string, number>();

    for (const row of data) {
      const monthKey = row.period_start.substring(0, 7); // "2024-01"
      const currentValue = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, currentValue + (row.value || 0));
    }

    // Convert to array and format for Prophet
    return Array.from(monthlyData.entries())
      .map(([month, value]) => ({
        date: `${month}-01`, // "2024-01-01"
        value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get stats about stored forecasts
   */
  async getStats(): Promise<{
    totalForecasts: number;
    forecastsByDomain: Record<string, number>;
    oldestForecast: string | null;
    newestForecast: string | null;
  }> {
    const { data: forecasts } = await this.supabase
      .from('ml_predictions')
      .select('metadata, created_at')
      .eq('prediction_type', 'forecast')
      .order('created_at', { ascending: false });

    if (!forecasts || forecasts.length === 0) {
      return {
        totalForecasts: 0,
        forecastsByDomain: {},
        oldestForecast: null,
        newestForecast: null,
      };
    }

    const forecastsByDomain: Record<string, number> = {};
    for (const forecast of forecasts) {
      const domain = forecast.metadata?.domain || 'unknown';
      forecastsByDomain[domain] = (forecastsByDomain[domain] || 0) + 1;
    }

    return {
      totalForecasts: forecasts.length,
      forecastsByDomain,
      oldestForecast: forecasts[forecasts.length - 1]?.created_at || null,
      newestForecast: forecasts[0]?.created_at || null,
    };
  }

  /**
   * Get service health status
   */
  getHealth(): { status: string; message: string } {
    return {
      status: 'operational',
      message: 'Prophet forecasting service running (6x/day)',
    };
  }
}
