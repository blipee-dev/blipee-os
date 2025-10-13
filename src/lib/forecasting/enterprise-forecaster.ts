/**
 * Enterprise-grade emissions forecasting using Facebook Prophet-style decomposition
 * Implements additive model: y(t) = trend(t) + seasonality(t) + residual(t)
 */

interface MonthlyEmissions {
  month: string;
  emissions: number;
}

interface ForecastResult {
  forecasted: number[];
  actualMonthlyAvg: number;
  forecastMonthlyAvg: number;
  confidence: {
    lower: number[];
    upper: number[];
  };
  method: string;
  metadata: {
    trendSlope: number;
    seasonalStrength: number;
    volatility: number;
    r2: number;
  };
}

export class EnterpriseForecast {
  /**
   * Main forecasting method - uses additive decomposition model
   */
  static forecast(
    monthlyData: MonthlyEmissions[],
    monthsToForecast: number,
    debug = true
  ): ForecastResult {
    const values = monthlyData.map(d => d.emissions);
    const n = values.length;

    if (debug) {
      console.log(`📊 Forecasting with ${n} months of historical data`);
      console.log(`📈 Last 6 months: ${values.slice(-6).map(v => v.toFixed(1)).join(', ')}`);
    }

    // For sparse data (< 36 months), use weighted exponential smoothing
    if (n < 36) {
      if (debug) {
        console.log(`⚠️  Using exponential smoothing (only ${n} months of data, need 36 for full seasonal decomposition)`);
      }
      return this.exponentialSmoothingWithTrend(values, monthsToForecast, debug);
    }

    // Use full seasonal decomposition for 36+ months (3 years of data)
    if (debug) {
      console.log(`✅ Using 36-month seasonal decomposition (${n} months available)`);
    }
    return this.seasonalDecompositionForecast(values, monthsToForecast, debug);
  }

  /**
   * Seasonal Decomposition: Trend + Seasonality + Residual
   */
  private static seasonalDecompositionForecast(
    data: number[],
    steps: number,
    debug: boolean
  ): ForecastResult {
    const n = data.length;
    const period = Math.min(36, n); // Use 36-month pattern if enough data, otherwise use available data length

    // Step 1: Extract trend using robust moving average
    const trend = this.extractTrend(data, period);

    if (debug) {
      console.log(`📉 Trend (last 6): ${trend.slice(-6).map(v => v.toFixed(1)).join(', ')}`);
    }

    // Step 2: Detrend and extract seasonality
    const detrended = data.map((v, i) => v - trend[i]);
    const seasonal = this.extractSeasonality(detrended, period);

    if (debug) {
      console.log(`🔄 Seasonal pattern: ${seasonal.map(v => v.toFixed(1)).join(', ')}`);
    }

    // Step 3: Calculate residuals
    const residuals = data.map((v, i) => v - trend[i] - seasonal[i % period]);
    const residualStd = Math.sqrt(this.calculateVariance(residuals));

    if (debug) {
      console.log(`📊 Residual std dev: ${residualStd.toFixed(2)}`);
    }

    // Step 4: Forecast trend
    const trendSlope = this.calculateRobustTrendSlope(trend);
    const lastTrend = trend[n - 1];
    const trendForecast: number[] = [];

    for (let i = 1; i <= steps; i++) {
      trendForecast.push(lastTrend + trendSlope * i);
    }

    if (debug) {
      console.log(`📈 Trend slope: ${trendSlope.toFixed(3)} tCO2e/month`);
      console.log(`🔮 Trend forecast (next ${steps}): ${trendForecast.map(v => v.toFixed(1)).join(', ')}`);
    }

    // Step 5: Apply seasonality to forecast
    const forecasted: number[] = [];
    for (let i = 0; i < steps; i++) {
      const seasonalIndex = (n + i) % period;
      const forecast = Math.max(0, trendForecast[i] + seasonal[seasonalIndex]);
      forecasted.push(forecast);
    }

    if (debug) {
      console.log(`✨ Final forecast: ${forecasted.map(v => v.toFixed(1)).join(', ')}`);
      console.log(`💰 Total forecasted: ${forecasted.reduce((a,b)=>a+b,0).toFixed(1)} tCO2e`);
    }

    // Calculate confidence intervals (95%)
    const confidence = {
      lower: forecasted.map(v => Math.max(0, v - 1.96 * residualStd)),
      upper: forecasted.map(v => v + 1.96 * residualStd)
    };

    // Calculate R² for model quality
    const meanData = data.reduce((a, b) => a + b, 0) / n;
    const ssTot = data.reduce((sum, v) => sum + Math.pow(v - meanData, 2), 0);
    const ssRes = residuals.reduce((sum, v) => sum + Math.pow(v, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    const seasonalStrength = Math.sqrt(this.calculateVariance(seasonal)) / Math.sqrt(this.calculateVariance(data));

    return {
      forecasted,
      actualMonthlyAvg: data.reduce((a, b) => a + b, 0) / n,
      forecastMonthlyAvg: forecasted.reduce((a, b) => a + b, 0) / steps,
      confidence,
      method: 'seasonal-decomposition',
      metadata: {
        trendSlope,
        seasonalStrength,
        volatility: residualStd,
        r2
      }
    };
  }

  /**
   * Extract trend using centered moving average
   */
  private static extractTrend(data: number[], period: number): number[] {
    const n = data.length;
    const trend: number[] = [];

    for (let i = 0; i < n; i++) {
      if (i < Math.floor(period / 2) || i >= n - Math.floor(period / 2)) {
        // Use simple MA for edges
        const start = Math.max(0, i - Math.floor(period / 2));
        const end = Math.min(n, i + Math.floor(period / 2) + 1);
        const windowSum = data.slice(start, end).reduce((a, b) => a + b, 0);
        trend.push(windowSum / (end - start));
      } else {
        // Centered moving average for interior points
        let sum = 0;
        for (let j = -Math.floor(period / 2); j <= Math.floor(period / 2); j++) {
          sum += data[i + j];
        }
        trend.push(sum / period);
      }
    }

    return trend;
  }

  /**
   * Extract seasonal component by averaging same-month detrended values
   */
  private static extractSeasonality(detrended: number[], period: number): number[] {
    const seasonal: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);

    detrended.forEach((v, i) => {
      const seasonIndex = i % period;
      seasonal[seasonIndex] += v;
      counts[seasonIndex]++;
    });

    // Average and center
    seasonal.forEach((_, i) => {
      seasonal[i] = counts[i] > 0 ? seasonal[i] / counts[i] : 0;
    });

    // Center to mean zero
    const seasonalMean = seasonal.reduce((a, b) => a + b, 0) / period;
    seasonal.forEach((_, i) => {
      seasonal[i] -= seasonalMean;
    });

    return seasonal;
  }

  /**
   * Calculate robust trend slope using weighted least squares
   */
  private static calculateRobustTrendSlope(trend: number[]): number {
    const n = trend.length;
    const recentWindow = Math.min(12, n); // Use last 12 months
    const recentTrend = trend.slice(-recentWindow);

    // Weighted least squares (more weight on recent data)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumW = 0;

    recentTrend.forEach((y, i) => {
      const weight = i + 1; // Linear weight (recent months more important)
      const x = i;

      sumW += weight;
      sumX += weight * x;
      sumY += weight * y;
      sumXY += weight * x * y;
      sumX2 += weight * x * x;
    });

    return (sumW * sumXY - sumX * sumY) / (sumW * sumX2 - sumX * sumX);
  }

  /**
   * Exponential smoothing with trend (Holt's method) - for sparse data
   */
  private static exponentialSmoothingWithTrend(
    data: number[],
    steps: number,
    debug: boolean
  ): ForecastResult {
    const n = data.length;
    const alpha = 0.3; // Level smoothing
    const beta = 0.1;  // Trend smoothing

    let level = data[0];
    let trend = n > 1 ? data[1] - data[0] : 0;

    // Apply Holt's linear method
    for (let i = 1; i < n; i++) {
      const prevLevel = level;
      level = alpha * data[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    if (debug) {
      console.log(`📊 Holt's method - Level: ${level.toFixed(1)}, Trend: ${trend.toFixed(3)}`);
    }

    // Forecast
    const forecasted: number[] = [];
    for (let i = 1; i <= steps; i++) {
      forecasted.push(Math.max(0, level + i * trend));
    }

    // Calculate prediction intervals
    const residuals = data.slice(1).map((v, i) => v - (data[i] + trend));
    const residualStd = Math.sqrt(this.calculateVariance(residuals));

    const confidence = {
      lower: forecasted.map(v => Math.max(0, v - 1.96 * residualStd)),
      upper: forecasted.map(v => v + 1.96 * residualStd)
    };

    return {
      forecasted,
      actualMonthlyAvg: data.reduce((a, b) => a + b, 0) / n,
      forecastMonthlyAvg: forecasted.reduce((a, b) => a + b, 0) / steps,
      confidence,
      method: 'exponential-smoothing',
      metadata: {
        trendSlope: trend,
        seasonalStrength: 0,
        volatility: residualStd,
        r2: 0
      }
    };
  }

  /**
   * Calculate variance
   */
  private static calculateVariance(data: number[]): number {
    const n = data.length;
    if (n === 0) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / n;
    return data.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  }
}
