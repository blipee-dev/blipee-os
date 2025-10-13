/**
 * Enterprise-grade emissions forecasting using ARIMA-style time series analysis
 * Accounts for trend, seasonality, and variance
 */

interface MonthlyEmissions {
  month: string;
  emissions: number;
}

interface ForecastResult {
  forecasted: number[];
  confidence: {
    lower: number[];
    upper: number[];
  };
  method: 'arima' | 'seasonal-decomposition' | 'exponential-smoothing' | 'simple-average';
  metadata: {
    trend: number;
    seasonality: number[];
    volatility: number;
  };
}

export class EmissionsForecaster {
  /**
   * Forecast remaining months using ARIMA-style decomposition
   * This is enterprise-grade: accounts for trend, seasonality, and residuals
   */
  static forecast(
    monthlyData: MonthlyEmissions[],
    monthsToForecast: number
  ): ForecastResult {
    const values = monthlyData.map(d => d.emissions);
    const n = values.length;

    // Need at least 24 months for reliable seasonal decomposition
    if (n < 24) {
      return this.fallbackExponentialSmoothing(values, monthsToForecast);
    }

    // Step 1: Decompose into Trend + Seasonal + Residual
    const decomposition = this.seasonalDecomposition(values);

    // Step 2: Forecast trend using linear regression
    const trendForecast = this.forecastTrend(decomposition.trend, monthsToForecast);

    // Step 3: Apply seasonal pattern
    const seasonalForecast = this.applySeasonality(
      trendForecast,
      decomposition.seasonal,
      values.length
    );

    // Step 4: Calculate confidence intervals based on historical variance
    const residualVariance = this.calculateVariance(decomposition.residual);
    const stdDev = Math.sqrt(residualVariance);

    const confidence = {
      lower: seasonalForecast.map(v => Math.max(0, v - 1.96 * stdDev)), // 95% CI
      upper: seasonalForecast.map(v => v + 1.96 * stdDev)
    };

    return {
      forecasted: seasonalForecast,
      confidence,
      method: 'seasonal-decomposition',
      metadata: {
        trend: decomposition.trend[decomposition.trend.length - 1] || 0,
        seasonality: decomposition.seasonal,
        volatility: stdDev
      }
    };
  }

  /**
   * Seasonal decomposition using moving average
   * Separates data into: Trend + Seasonal + Residual
   */
  private static seasonalDecomposition(data: number[]): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const period = 12; // Monthly seasonality
    const n = data.length;

    // Calculate trend using centered moving average
    const trend: number[] = new Array(n).fill(0);
    for (let i = Math.floor(period / 2); i < n - Math.floor(period / 2); i++) {
      let sum = 0;
      for (let j = -Math.floor(period / 2); j <= Math.floor(period / 2); j++) {
        sum += data[i + j];
      }
      trend[i] = sum / period;
    }

    // Extrapolate trend to edges using linear regression
    const validTrend = trend.filter(v => v > 0);
    const trendSlope = this.calculateSlope(validTrend);
    for (let i = 0; i < Math.floor(period / 2); i++) {
      trend[i] = validTrend[0] + trendSlope * (i - Math.floor(period / 2));
    }
    for (let i = n - Math.floor(period / 2); i < n; i++) {
      trend[i] = validTrend[validTrend.length - 1] + trendSlope * (i - (n - Math.floor(period / 2)));
    }

    // Calculate detrended data
    const detrended = data.map((v, i) => v - trend[i]);

    // Calculate seasonal component (average for each month of year)
    const seasonal: number[] = new Array(period).fill(0);
    const seasonalCounts: number[] = new Array(period).fill(0);

    detrended.forEach((v, i) => {
      const seasonIndex = i % period;
      seasonal[seasonIndex] += v;
      seasonalCounts[seasonIndex]++;
    });

    seasonal.forEach((v, i) => {
      seasonal[i] = seasonalCounts[i] > 0 ? v / seasonalCounts[i] : 0;
    });

    // Ensure seasonal component sums to zero
    const seasonalMean = seasonal.reduce((a, b) => a + b, 0) / period;
    seasonal.forEach((v, i) => {
      seasonal[i] = v - seasonalMean;
    });

    // Calculate residual
    const residual = data.map((v, i) => v - trend[i] - seasonal[i % period]);

    return { trend, seasonal, residual };
  }

  /**
   * Forecast trend component using linear regression with weighted recent data
   */
  private static forecastTrend(trend: number[], steps: number): number[] {
    const n = trend.length;

    // Use weighted linear regression (more weight on recent observations)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumW = 0;

    for (let i = 0; i < n; i++) {
      const weight = Math.exp((i - n) / 10); // Exponential decay for older data
      const x = i;
      const y = trend[i];

      sumW += weight;
      sumX += weight * x;
      sumY += weight * y;
      sumXY += weight * x * y;
      sumX2 += weight * x * x;
    }

    const slope = (sumW * sumXY - sumX * sumY) / (sumW * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / sumW;

    // Forecast future trend
    const forecast: number[] = [];
    for (let i = 0; i < steps; i++) {
      forecast.push(intercept + slope * (n + i));
    }

    return forecast;
  }

  /**
   * Apply seasonal pattern to forecasted trend
   */
  private static applySeasonality(
    trendForecast: number[],
    seasonal: number[],
    currentMonth: number
  ): number[] {
    return trendForecast.map((trend, i) => {
      const seasonIndex = (currentMonth + i) % seasonal.length;
      return Math.max(0, trend + seasonal[seasonIndex]); // Don't allow negative emissions
    });
  }

  /**
   * Exponential smoothing fallback for sparse data
   */
  private static fallbackExponentialSmoothing(
    data: number[],
    steps: number
  ): ForecastResult {
    const alpha = 0.3; // Smoothing parameter
    const beta = 0.1;  // Trend parameter

    let level = data[0];
    let trend = data[1] - data[0];

    // Apply Holt's linear method
    for (let i = 1; i < data.length; i++) {
      const prevLevel = level;
      level = alpha * data[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Forecast
    const forecasted: number[] = [];
    for (let i = 1; i <= steps; i++) {
      forecasted.push(Math.max(0, level + i * trend));
    }

    const variance = this.calculateVariance(
      data.slice(1).map((v, i) => v - data[i])
    );
    const stdDev = Math.sqrt(variance);

    return {
      forecasted,
      confidence: {
        lower: forecasted.map(v => Math.max(0, v - 1.96 * stdDev)),
        upper: forecasted.map(v => v + 1.96 * stdDev)
      },
      method: 'exponential-smoothing',
      metadata: {
        trend,
        seasonality: [],
        volatility: stdDev
      }
    };
  }

  /**
   * Calculate slope using least squares
   */
  private static calculateSlope(data: number[]): number {
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Calculate variance of residuals
   */
  private static calculateVariance(data: number[]): number {
    const n = data.length;
    if (n === 0) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;

    return variance;
  }
}
