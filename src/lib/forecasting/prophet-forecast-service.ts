/**
 * Prophet Forecast Service
 *
 * Reads pre-computed Prophet forecasts from ml_predictions table
 * and transforms them into the format expected by the frontend.
 *
 * Benefits:
 * - Uses high-quality Prophet forecasts (better than seasonal decomposition)
 * - Instant response (pre-computed every 4 hours)
 * - Reduces API response time from 1-2s to <100ms
 * - Automatic fallback to EnterpriseForecast if no data available
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

interface ProphetPrediction {
  id: string;
  organization_id: string;
  site_id: string;
  prediction_type: string;
  prediction: number[]; // 12 months of forecasted values
  confidence_lower: number[];
  confidence_upper: number[];
  metadata: {
    metric_id: string;
    metric_code: string;
    category: string;
    subcategory: string;
    metric_name: string;
    site_name: string;
    method: string;
    trend: string;
    yearly: boolean;
    historical_mean: number;
    historical_std: number;
    data_points: number;
    forecast_horizon: number;
    generated_at: string;
  };
  created_at: string;
}

interface ForecastDataPoint {
  monthKey: string;
  month: string;
  total: number;
  renewable?: number;
  fossil?: number;
  isForecast: true;
  confidence: {
    totalLower: number;
    totalUpper: number;
    renewableLower?: number;
    renewableUpper?: number;
    fossilLower?: number;
    fossilUpper?: number;
  };
}

interface ProphetForecastResult {
  forecast: ForecastDataPoint[];
  model: 'prophet';
  confidence: number;
  metadata: {
    totalTrend: string;
    dataPoints: number;
    generatedAt: string;
    method: string;
    forecastHorizon: number;
  };
  hasProphetData: boolean;
}

export class ProphetForecastService {
  /**
   * Get Prophet forecasts for Energy (Electricity + Gas)
   */
  static async getEnergyForecast(
    organizationId: string,
    siteId: string,
    monthsToForecast?: number
  ): Promise<ProphetForecastResult | null> {
    try {
      const supabase = supabaseAdmin;

      // Fetch electricity and thermal energy (gas) forecasts
      // We need to query separately for each category since they're different
      // Always fetch most recent predictions regardless of timestamp
      console.log('[ProphetForecastService] Fetching energy forecasts:', {
        organizationId,
        siteId,
      });

      const { data: electricityData, error: elecError } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('site_id', siteId)
        .eq('prediction_type', 'forecast')
        .eq('metadata->>category', 'Electricity')
        .in('metadata->>subcategory', ['Purchased', 'EV Charging'])
        .is('model_id', null)
        .order('created_at', { ascending: false });

      console.log('[ProphetForecastService] Electricity query result:', {
        count: electricityData?.length || 0,
        error: elecError,
      });

      const { data: thermalData, error: thermalError } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('site_id', siteId)
        .eq('prediction_type', 'forecast')
        .eq('metadata->>category', 'Purchased Energy')
        .eq('metadata->>subcategory', 'Thermal')
        .is('model_id', null)
        .order('created_at', { ascending: false });

      console.log('[ProphetForecastService] Thermal query result:', {
        count: thermalData?.length || 0,
        error: thermalError,
      });

      const predictions = [...(electricityData || []), ...(thermalData || [])];
      const error = elecError || thermalError;

      if (error) {
        console.error('[ProphetForecastService] Error fetching energy forecasts:', error);
        return null;
      }

      console.log('[ProphetForecastService] Combined predictions:', {
        total: predictions.length,
        electricity: electricityData?.length || 0,
        thermal: thermalData?.length || 0,
      });

      if (!predictions || predictions.length === 0) {
        console.log('[ProphetForecastService] No Prophet energy forecasts found');
        return null;
      }

      // Deduplicate: keep only most recent prediction per metric_id
      const uniquePredictions = this.deduplicateByMetricId(predictions);

      // Group by category (Electricity vs Thermal Energy)
      const electricityForecasts = uniquePredictions.filter(
        (p: ProphetPrediction) => p.metadata.category === 'Electricity'
      );
      const thermalForecasts = uniquePredictions.filter(
        (p: ProphetPrediction) => p.metadata.category === 'Purchased Energy' && p.metadata.subcategory === 'Thermal'
      );

      if (electricityForecasts.length === 0 && thermalForecasts.length === 0) {
        console.log('[ProphetForecastService] No valid electricity or thermal forecasts');
        return null;
      }

      console.log('[ProphetForecastService] Found forecasts:', {
        electricity: electricityForecasts.length,
        thermal: thermalForecasts.length,
        electricitySubcategories: electricityForecasts.map(f => f.metadata.subcategory),
        thermalSubcategories: thermalForecasts.map(f => f.metadata.subcategory),
      });

      // Transform to frontend format
      const forecast = this.transformEnergyForecast(electricityForecasts, thermalForecasts, monthsToForecast);

      return {
        forecast,
        model: 'prophet',
        confidence: this.calculateConfidence([...electricityForecasts, ...thermalForecasts]),
        metadata: {
          totalTrend: electricityForecasts[0]?.metadata.trend || thermalForecasts[0]?.metadata.trend || 'stable',
          dataPoints: [...electricityForecasts, ...thermalForecasts].reduce((sum, f) => sum + (f.metadata.data_points || 0), 0),
          generatedAt: electricityForecasts[0]?.metadata.generated_at || thermalForecasts[0]?.metadata.generated_at || new Date().toISOString(),
          method: 'prophet',
          forecastHorizon: forecast.length,
        },
        hasProphetData: true,
      };
    } catch (error) {
      console.error('[ProphetForecastService] Error in getEnergyForecast:', error);
      return null;
    }
  }

  /**
   * Get Prophet forecasts for Water (Potable + Residual)
   */
  static async getWaterForecast(
    organizationId: string,
    siteId: string,
    monthsToForecast?: number
  ): Promise<ProphetForecastResult | null> {
    try {
      const supabase = supabaseAdmin;

      // Water forecasts are in "Purchased Goods & Services" category with "Water" subcategory
      // Always fetch most recent predictions regardless of timestamp
      console.log('[ProphetForecastService] Fetching water forecasts:', {
        organizationId,
        siteId,
      });

      const { data: predictions, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('site_id', siteId)
        .eq('prediction_type', 'forecast')
        .eq('metadata->>category', 'Purchased Goods & Services')
        .eq('metadata->>subcategory', 'Water')
        .is('model_id', null)
        .order('created_at', { ascending: false });

      console.log('[ProphetForecastService] Water query result:', {
        count: predictions?.length || 0,
        error,
      });

      if (error) {
        console.error('[ProphetForecastService] Error fetching water forecasts:', error);
        return null;
      }

      if (!predictions || predictions.length === 0) {
        console.log('[ProphetForecastService] No Prophet water forecasts found');
        return null;
      }

      // ✅ UPDATED: Use only withdrawal_total forecast (not sum of all metrics)
      // Find the withdrawal_total prediction (GRI 303-3)
      const withdrawalPrediction = predictions.find(
        (p: ProphetPrediction) => p.metadata.metric_code === 'gri_303_3_withdrawal_total'
      );

      if (!withdrawalPrediction) {
        console.log('[ProphetForecastService] No withdrawal_total forecast found, falling back to sum');
        // Fallback: use all predictions (old behavior)
        const uniquePredictions = this.deduplicateByMetricId(predictions);
        const forecast = this.transformWaterForecast(uniquePredictions, monthsToForecast);

        return {
          forecast,
          model: 'prophet',
          confidence: this.calculateConfidence(predictions),
          metadata: {
            totalTrend: predictions[0]?.metadata.trend || 'stable',
            dataPoints: predictions.reduce((sum: number, p: ProphetPrediction) => sum + (p.metadata.data_points || 0), 0),
            generatedAt: predictions[0]?.metadata.generated_at || new Date().toISOString(),
            method: 'prophet',
            forecastHorizon: forecast.length,
          },
          hasProphetData: true,
        };
      }

      console.log('[ProphetForecastService] Using withdrawal_total forecast:', {
        metric_code: withdrawalPrediction.metadata.metric_code,
        data_points: withdrawalPrediction.metadata.data_points,
      });

      // Transform only the withdrawal forecast
      const forecast = this.transformSingleWaterForecast(withdrawalPrediction, monthsToForecast);

      return {
        forecast,
        model: 'prophet',
        confidence: this.calculateConfidence(predictions),
        metadata: {
          totalTrend: predictions[0]?.metadata.trend || 'stable',
          dataPoints: predictions.reduce((sum: number, p: ProphetPrediction) => sum + (p.metadata.data_points || 0), 0),
          generatedAt: predictions[0]?.metadata.generated_at || new Date().toISOString(),
          method: 'prophet',
          forecastHorizon: forecast.length,
        },
        hasProphetData: true,
      };
    } catch (error) {
      console.error('[ProphetForecastService] Error in getWaterForecast:', error);
      return null;
    }
  }

  /**
   * Get Prophet forecasts for Waste (Recycling + Other)
   */
  static async getWasteForecast(
    organizationId: string,
    siteId: string,
    monthsToForecast?: number
  ): Promise<ProphetForecastResult | null> {
    try {
      const supabase = supabaseAdmin;

      // Get all waste forecasts (all subcategories)
      // Always fetch most recent predictions regardless of timestamp
      console.log('[ProphetForecastService] Fetching waste forecasts:', {
        organizationId,
        siteId,
      });

      const { data: predictions, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('site_id', siteId)
        .eq('prediction_type', 'forecast')
        .eq('metadata->>category', 'Waste')
        .in('metadata->>subcategory', ['Recycling', 'Composting', 'Disposal', 'E-Waste', 'Incineration'])
        .is('model_id', null)
        .order('created_at', { ascending: false });

      console.log('[ProphetForecastService] Waste query result:', {
        count: predictions?.length || 0,
        error,
      });

      if (error) {
        console.error('[ProphetForecastService] Error fetching waste forecasts:', error);
        return null;
      }

      if (!predictions || predictions.length === 0) {
        console.log('[ProphetForecastService] No Prophet waste forecasts found');
        return null;
      }

      // Deduplicate: keep only most recent prediction per metric_id
      const uniquePredictions = this.deduplicateByMetricId(predictions);

      console.log('[ProphetForecastService] Found waste forecasts:', {
        count: uniquePredictions.length,
        subcategories: uniquePredictions.map((p: ProphetPrediction) => p.metadata.subcategory),
      });

      const forecast = this.transformWasteForecast(uniquePredictions, monthsToForecast);

      return {
        forecast,
        model: 'prophet',
        confidence: this.calculateConfidence(predictions),
        metadata: {
          totalTrend: predictions[0]?.metadata.trend || 'stable',
          dataPoints: predictions.reduce((sum: number, p: ProphetPrediction) => sum + (p.metadata.data_points || 0), 0),
          generatedAt: predictions[0]?.metadata.generated_at || new Date().toISOString(),
          method: 'prophet',
          forecastHorizon: forecast.length,
        },
        hasProphetData: true,
      };
    } catch (error) {
      console.error('[ProphetForecastService] Error in getWasteForecast:', error);
      return null;
    }
  }

  /**
   * Transform electricity + thermal forecasts into frontend format
   * Sums all electricity subcategories (Purchased + EV Charging) as renewable
   * and thermal energy as fossil
   */
  private static transformEnergyForecast(
    electricityForecasts: ProphetPrediction[],
    thermalForecasts: ProphetPrediction[],
    monthsToForecast?: number
  ): ForecastDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11 (0=Jan, 9=Oct)
    const startMonth = currentMonthIndex + 2; // Next month as 1-12 (Oct=9, so next=10+1=11=Nov)
    const startYear = today.getFullYear();

    // Calculate months remaining until end of current year if not specified
    const monthsUntilYearEnd = 12 - currentMonthIndex - 1; // Remaining months after current
    const numMonths = monthsToForecast ?? monthsUntilYearEnd;

    console.log('[ProphetForecastService] Transform energy forecast:', {
      startMonth,
      startYear,
      monthsToForecast,
      monthsUntilYearEnd,
      numMonths,
    });

    const dataPoints: ForecastDataPoint[] = [];

    for (let i = 0; i < numMonths; i++) {
      const monthIndex = (startMonth + i - 1) % 12;
      const year = startYear + Math.floor((startMonth + i - 1) / 12);
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Sum all electricity subcategories (renewable energy)
      const renewable = electricityForecasts.reduce(
        (sum, forecast) => sum + (forecast.prediction[i] || 0),
        0
      );
      const renewableLower = electricityForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_lower[i] || 0),
        0
      ) || renewable * 0.9;
      const renewableUpper = electricityForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_upper[i] || 0),
        0
      ) || renewable * 1.1;

      // Sum all thermal forecasts (fossil energy)
      const fossil = thermalForecasts.reduce(
        (sum, forecast) => sum + (forecast.prediction[i] || 0),
        0
      );
      const fossilLower = thermalForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_lower[i] || 0),
        0
      ) || fossil * 0.9;
      const fossilUpper = thermalForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_upper[i] || 0),
        0
      ) || fossil * 1.1;

      const total = renewable + fossil;

      dataPoints.push({
        monthKey,
        month: `${months[monthIndex]} ${year}`,
        total,
        renewable,
        fossil,
        isForecast: true,
        confidence: {
          totalLower: renewableLower + fossilLower,
          totalUpper: renewableUpper + fossilUpper,
          renewableLower,
          renewableUpper,
          fossilLower,
          fossilUpper,
        },
      });
    }

    return dataPoints;
  }

  /**
   * Transform water forecasts (all water-related predictions summed together)
   */
  private static transformWaterForecast(
    waterForecasts: ProphetPrediction[],
    monthsToForecast?: number
  ): ForecastDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11 (0=Jan, 9=Oct)
    const startMonth = currentMonthIndex + 2; // Next month as 1-12 (Oct=9, so next=10+1=11=Nov)
    const startYear = today.getFullYear();

    // Calculate months remaining until end of current year if not specified
    const monthsUntilYearEnd = 12 - currentMonthIndex - 1; // Remaining months after current
    const numMonths = monthsToForecast ?? monthsUntilYearEnd;

    const dataPoints: ForecastDataPoint[] = [];

    for (let i = 0; i < numMonths; i++) {
      const monthIndex = (startMonth + i - 1) % 12;
      const year = startYear + Math.floor((startMonth + i - 1) / 12);
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Sum all water forecasts
      const total = waterForecasts.reduce(
        (sum, forecast) => sum + (forecast.prediction[i] || 0),
        0
      );
      const totalLower = waterForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_lower[i] || 0),
        0
      ) || total * 0.9;
      const totalUpper = waterForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_upper[i] || 0),
        0
      ) || total * 1.1;

      dataPoints.push({
        monthKey,
        month: `${months[monthIndex]} ${year}`,
        total,
        isForecast: true,
        confidence: {
          totalLower,
          totalUpper,
        },
      });
    }

    return dataPoints;
  }

  /**
   * Transform single water forecast (for withdrawal_total metric only)
   * This is the correct approach - use only the total metric, not sum of all
   */
  private static transformSingleWaterForecast(
    prediction: ProphetPrediction,
    monthsToForecast?: number
  ): ForecastDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11 (0=Jan, 9=Oct)
    const startMonth = currentMonthIndex + 2; // Next month as 1-12 (Oct=9, so next=10+1=11=Nov)
    const startYear = today.getFullYear();

    // Calculate months remaining until end of current year if not specified
    const monthsUntilYearEnd = 12 - currentMonthIndex - 1; // Remaining months after current
    const numMonths = monthsToForecast ?? monthsUntilYearEnd;

    console.log('[ProphetForecastService] Transform single water forecast:', {
      metric_code: prediction.metadata.metric_code,
      startMonth,
      startYear,
      monthsToForecast,
      numMonths,
      prediction_length: prediction.prediction.length,
    });

    const dataPoints: ForecastDataPoint[] = [];

    for (let i = 0; i < numMonths; i++) {
      const monthIndex = (startMonth + i - 1) % 12;
      const year = startYear + Math.floor((startMonth + i - 1) / 12);
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Use single prediction values (not sum)
      const total = prediction.prediction[i] || 0;
      const totalLower = prediction.confidence_lower[i] || total * 0.9;
      const totalUpper = prediction.confidence_upper[i] || total * 1.1;

      dataPoints.push({
        monthKey,
        month: `${months[monthIndex]} ${year}`,
        total,
        isForecast: true,
        confidence: {
          totalLower,
          totalUpper,
        },
      });
    }

    console.log('[ProphetForecastService] Generated forecast points:', {
      count: dataPoints.length,
      first_month: dataPoints[0]?.month,
      last_month: dataPoints[dataPoints.length - 1]?.month,
      sample_total: dataPoints[0]?.total,
    });

    return dataPoints;
  }

  /**
   * Transform waste forecasts (all waste subcategories summed together)
   */
  private static transformWasteForecast(
    wasteForecasts: ProphetPrediction[],
    monthsToForecast?: number
  ): ForecastDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11 (0=Jan, 9=Oct)
    const startMonth = currentMonthIndex + 2; // Next month as 1-12 (Oct=9, so next=10+1=11=Nov)
    const startYear = today.getFullYear();

    // Calculate months remaining until end of current year if not specified
    const monthsUntilYearEnd = 12 - currentMonthIndex - 1; // Remaining months after current
    const numMonths = monthsToForecast ?? monthsUntilYearEnd;

    const dataPoints: ForecastDataPoint[] = [];

    for (let i = 0; i < numMonths; i++) {
      const monthIndex = (startMonth + i - 1) % 12;
      const year = startYear + Math.floor((startMonth + i - 1) / 12);
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Sum all waste forecasts
      const total = wasteForecasts.reduce(
        (sum, forecast) => sum + (forecast.prediction[i] || 0),
        0
      );
      const totalLower = wasteForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_lower[i] || 0),
        0
      ) || total * 0.9;
      const totalUpper = wasteForecasts.reduce(
        (sum, forecast) => sum + (forecast.confidence_upper[i] || 0),
        0
      ) || total * 1.1;

      dataPoints.push({
        monthKey,
        month: `${months[monthIndex]} ${year}`,
        total,
        isForecast: true,
        confidence: {
          totalLower,
          totalUpper,
        },
      });
    }

    return dataPoints;
  }

  /**
   * Deduplicate predictions by metric_id, keeping only the most recent one
   */
  private static deduplicateByMetricId(predictions: ProphetPrediction[]): ProphetPrediction[] {
    const seenMetrics = new Map<string, ProphetPrediction>();

    // Predictions are already sorted by created_at DESC, so first occurrence is most recent
    for (const prediction of predictions) {
      const metricId = prediction.metadata.metric_id;
      if (metricId && !seenMetrics.has(metricId)) {
        seenMetrics.set(metricId, prediction);
      }
    }

    return Array.from(seenMetrics.values());
  }

  /**
   * Calculate overall confidence score from Prophet metadata
   */
  private static calculateConfidence(predictions: ProphetPrediction[]): number {
    if (predictions.length === 0) return 0.85; // Default confidence

    // Calculate confidence based on:
    // 1. Data points (more data = higher confidence)
    // 2. Standard deviation (lower std = higher confidence)
    // 3. Number of predictions available

    const avgDataPoints = predictions.reduce((sum, p) => sum + p.metadata.data_points, 0) / predictions.length;
    const avgStd = predictions.reduce((sum, p) => sum + p.metadata.historical_std, 0) / predictions.length;
    const avgMean = predictions.reduce((sum, p) => sum + p.metadata.historical_mean, 0) / predictions.length;

    // Coefficient of variation (std / mean)
    const cv = avgMean > 0 ? avgStd / avgMean : 0.2;

    // Data points confidence (more samples = higher confidence)
    const dataPointsScore = Math.min(avgDataPoints / 36, 1); // 36 months = 1.0

    // Variability confidence (lower CV = higher confidence)
    const variabilityScore = Math.max(0, 1 - cv);

    // Coverage score (having both subcategories = higher confidence)
    const coverageScore = predictions.length >= 2 ? 1.0 : 0.85;

    // Weighted average
    const confidence = (dataPointsScore * 0.3 + variabilityScore * 0.5 + coverageScore * 0.2);

    return Math.max(0.75, Math.min(0.95, confidence)); // Clamp between 0.75 and 0.95
  }
}
