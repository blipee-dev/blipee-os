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
    }

    // Always use seasonal decomposition (Facebook Prophet-style)
    // This works well with 36 months of data and captures trend + seasonality
    if (debug) {
    }
    return this.seasonalDecompositionForecast(values, monthsToForecast, debug);
  }

  /**
   * Seasonal Decomposition: Trend + Seasonality + Residual
   * WITH OUTLIER DETECTION AND ROBUST STATISTICS
   */
  private static seasonalDecompositionForecast(
    data: number[],
    steps: number,
    debug: boolean
  ): ForecastResult {
    const n = data.length;
    const period = Math.min(36, n); // Use 36-month pattern if enough data, otherwise use available data length

    // Step 0: Detect and cap outliers (values > 2.5 std dev from median)
    const cleanedData = this.removeOutliers(data);
    const outliersRemoved = data.length - cleanedData.filter((v, i) => v === data[i]).length;

    if (debug && outliersRemoved > 0) {
      debug.log(`📊 Outlier detection: ${outliersRemoved} outliers capped/removed from ${n} data points`);
    }

    // Step 1: Extract trend using robust moving average
    const trend = this.extractTrend(cleanedData, period);

    if (debug) {
    }

    // Step 2: Detrend and extract seasonality (using cleaned data)
    const detrended = cleanedData.map((v, i) => v - trend[i]);
    const seasonal = this.extractSeasonality(detrended, period);

    if (debug) {
    }

    // Step 3: Calculate residuals (using cleaned data)
    const residuals = cleanedData.map((v, i) => v - trend[i] - seasonal[i % period]);
    const residualStd = Math.sqrt(this.calculateVariance(residuals));

    if (debug) {
    }

    // Step 4: Forecast trend WITH DAMPENING
    // Dampening prevents extreme trends from projecting too far
    const trendSlope = this.calculateRobustTrendSlope(trend);
    const lastTrend = trend[n - 1];
    const trendForecast: number[] = [];

    // Dampening factor: reduces trend impact over time
    // phi = 0.95 means trend effect reduces by 5% per step
    const phi = 0.95; // Dampening factor (0.9-0.98 range is typical)

    for (let i = 1; i <= steps; i++) {
      // Apply dampening: trend effect = trendSlope * phi^i
      const dampenedSlope = trendSlope * Math.pow(phi, i);
      trendForecast.push(lastTrend + dampenedSlope * i);
    }

    if (debug) {
    }

    // Step 5: Apply seasonality to forecast
    const forecasted: number[] = [];
    for (let i = 0; i < steps; i++) {
      const seasonalIndex = (n + i) % period;
      const forecast = Math.max(0, trendForecast[i] + seasonal[seasonalIndex]);
      forecasted.push(forecast);
    }

    if (debug) {
    }

    // Calculate confidence intervals (95%)
    const confidence = {
      lower: forecasted.map(v => Math.max(0, v - 1.96 * residualStd)),
      upper: forecasted.map(v => v + 1.96 * residualStd)
    };

    // Calculate R² for model quality (using cleaned data)
    const meanData = cleanedData.reduce((a, b) => a + b, 0) / n;
    const ssTot = cleanedData.reduce((sum, v) => sum + Math.pow(v - meanData, 2), 0);
    const ssRes = residuals.reduce((sum, v) => sum + Math.pow(v, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    const seasonalStrength = Math.sqrt(this.calculateVariance(seasonal)) / Math.sqrt(this.calculateVariance(cleanedData));

    return {
      forecasted,
      actualMonthlyAvg: cleanedData.reduce((a, b) => a + b, 0) / n,
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
   * Detect and cap outliers using robust statistics (MAD - Median Absolute Deviation)
   * Caps values that are > 2.5 MAD from the median (roughly equivalent to 2.5 std dev)
   */
  private static removeOutliers(data: number[]): number[] {
    const n = data.length;
    if (n < 12) return [...data]; // Need at least 12 months for outlier detection

    // Calculate median
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(n / 2)];

    // Calculate MAD (Median Absolute Deviation)
    const deviations = data.map(v => Math.abs(v - median));
    const sortedDevs = deviations.sort((a, b) => a - b);
    const mad = sortedDevs[Math.floor(n / 2)];

    // Cap outliers at 2.5 MAD from median (more robust than std dev)
    const threshold = 2.5 * mad * 1.4826; // 1.4826 is scaling factor to match std dev
    const upperBound = median + threshold;
    const lowerBound = Math.max(0, median - threshold);

    return data.map(v => {
      if (v > upperBound) return upperBound; // Cap high outliers
      if (v < lowerBound) return lowerBound; // Cap low outliers
      return v;
    });
  }

  /**
   * Calculate robust trend slope using weighted least squares
   * NOW USES 24-36 MONTHS (not just 12) for more stable long-term trends
   */
  private static calculateRobustTrendSlope(trend: number[]): number {
    const n = trend.length;
    // Use longer window: 24 months if available, or at least 18 months, minimum 12
    const recentWindow = n >= 24 ? 24 : n >= 18 ? 18 : Math.min(12, n);
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
