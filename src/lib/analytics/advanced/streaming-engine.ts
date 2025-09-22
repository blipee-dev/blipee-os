/**
 * Phase 7: Real-time Streaming Analytics Engine
 * Apache Kafka-like streaming with advanced event processing
 */

interface StreamingEvent {
  id: string;
  timestamp: number;
  source: string;
  type: 'sensor' | 'emission' | 'energy' | 'waste' | 'water' | 'carbon' | 'alert';
  data: Record<string, any>;
  metadata: {
    facility?: string;
    building?: string;
    device?: string;
    quality: 'high' | 'medium' | 'low';
    confidence: number;
  };
}

interface StreamProcessor {
  id: string;
  name: string;
  process: (event: StreamingEvent) => Promise<StreamingEvent[]>;
  windowing?: {
    type: 'tumbling' | 'sliding' | 'session';
    size: number;
    slide?: number;
  };
}

class AdvancedStreamingEngine {
  private processors = new Map<string, StreamProcessor>();
  private eventBuffer: StreamingEvent[] = [];
  private windows = new Map<string, StreamingEvent[]>();
  private alertHandlers: ((alert: any) => void)[] = [];
  private isProcessing = false;

  /**
   * Real-time stream processing with windowing
   */
  async processStream(events: StreamingEvent[]): Promise<void> {
    this.eventBuffer.push(...events);

    if (!this.isProcessing) {
      this.isProcessing = true;
      await this.processEventBuffer();
      this.isProcessing = false;
    }
  }

  /**
   * Advanced event processing with temporal windows
   */
  private async processEventBuffer(): Promise<void> {
    while (this.eventBuffer.length > 0) {
      const event = this.eventBuffer.shift()!;

      // Apply all registered processors
      for (const [processorId, processor] of this.processors) {
        try {
          if (processor.windowing) {
            await this.processWithWindowing(event, processor);
          } else {
            const results = await processor.process(event);
            await this.handleProcessorResults(results);
          }
        } catch (error) {
          console.error(`Processor ${processorId} failed:`, error);
        }
      }
    }
  }

  /**
   * Windowed processing for time-series analytics
   */
  private async processWithWindowing(
    event: StreamingEvent,
    processor: StreamProcessor
  ): Promise<void> {
    const windowKey = `${processor.id}-${this.getWindowKey(event, processor.windowing!)}`;

    if (!this.windows.has(windowKey)) {
      this.windows.set(windowKey, []);
    }

    const window = this.windows.get(windowKey)!;
    window.push(event);

    // Check if window is complete
    if (this.isWindowComplete(window, processor.windowing!)) {
      const results = await processor.process(event);
      await this.handleProcessorResults(results);
      this.windows.delete(windowKey);
    }
  }

  /**
   * Register advanced stream processors
   */
  registerProcessor(processor: StreamProcessor): void {
    this.processors.set(processor.id, processor);
  }

  /**
   * Advanced anomaly detection processor
   */
  createAnomalyDetector(): StreamProcessor {
    const historicalData = new Map<string, number[]>();

    return {
      id: 'anomaly-detector',
      name: 'Real-time Anomaly Detection',
      process: async (event: StreamingEvent) => {
        const key = `${event.source}-${event.type}`;
        const value = this.extractNumericValue(event.data);

        if (value === null) return [];

        // Get historical data
        if (!historicalData.has(key)) {
          historicalData.set(key, []);
        }

        const history = historicalData.get(key)!;
        history.push(value);

        // Keep only last 100 points
        if (history.length > 100) {
          history.shift();
        }

        // Statistical anomaly detection
        if (history.length >= 10) {
          const { mean, stdDev } = this.calculateStats(history);
          const zScore = Math.abs((value - mean) / stdDev);

          if (zScore > 3) { // 3-sigma rule
            return [{
              id: `anomaly-${Date.now()}`,
              timestamp: Date.now(),
              source: 'anomaly-detector',
              type: 'alert',
              data: {
                anomalyType: 'statistical',
                severity: zScore > 4 ? 'critical' : 'warning',
                value,
                expected: mean,
                deviation: zScore,
                originalEvent: event
              },
              metadata: {
                quality: 'high',
                confidence: Math.min(zScore / 4, 1)
              }
            }];
          }
        }

        return [];
      }
    };
  }

  /**
   * Real-time carbon footprint calculator
   */
  createCarbonCalculator(): StreamProcessor {
    return {
      id: 'carbon-calculator',
      name: 'Real-time Carbon Footprint Calculator',
      windowing: {
        type: 'tumbling',
        size: 60000 // 1 minute windows
      },
      process: async (event: StreamingEvent) => {
        if (event.type === 'energy') {
          const energyKwh = event.data.value || 0;
          const carbonFactor = this.getCarbonFactor(event.metadata.facility);
          const carbonEmissions = energyKwh * carbonFactor;

          return [{
            id: `carbon-${event.id}`,
            timestamp: event.timestamp,
            source: 'carbon-calculator',
            type: 'carbon',
            data: {
              emissions: carbonEmissions,
              energyConsumed: energyKwh,
              carbonFactor,
              calculationMethod: 'real-time-grid-factor'
            },
            metadata: {
              facility: event.metadata.facility,
              quality: 'high',
              confidence: 0.95
            }
          }];
        }

        return [];
      }
    };
  }

  /**
   * Predictive maintenance processor
   */
  createPredictiveMaintenanceProcessor(): StreamProcessor {
    const deviceHealth = new Map<string, any>();

    return {
      id: 'predictive-maintenance',
      name: 'Predictive Maintenance AI',
      process: async (event: StreamingEvent) => {
        if (event.type === 'sensor' && event.metadata.device) {
          const deviceId = event.metadata.device;
          const currentHealth = deviceHealth.get(deviceId) || {
            vibration: [],
            temperature: [],
            efficiency: [],
            lastMaintenance: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
          };

          // Update health metrics
          if (event.data.vibration) currentHealth.vibration.push(event.data.vibration);
          if (event.data.temperature) currentHealth.temperature.push(event.data.temperature);
          if (event.data.efficiency) currentHealth.efficiency.push(event.data.efficiency);

          // Keep only last 50 readings
          Object.keys(currentHealth).forEach(key => {
            if (Array.isArray(currentHealth[key]) && currentHealth[key].length > 50) {
              currentHealth[key] = currentHealth[key].slice(-50);
            }
          });

          deviceHealth.set(deviceId, currentHealth);

          // Predict maintenance needs
          const maintenanceScore = this.calculateMaintenanceScore(currentHealth);

          if (maintenanceScore > 0.8) {
            return [{
              id: `maintenance-${deviceId}-${Date.now()}`,
              timestamp: Date.now(),
              source: 'predictive-maintenance',
              type: 'alert',
              data: {
                deviceId,
                maintenanceScore,
                predictedFailureTime: this.predictFailureTime(currentHealth),
                recommendedActions: this.getMaintenanceRecommendations(currentHealth),
                healthMetrics: {
                  vibration: this.calculateTrend(currentHealth.vibration),
                  temperature: this.calculateTrend(currentHealth.temperature),
                  efficiency: this.calculateTrend(currentHealth.efficiency)
                }
              },
              metadata: {
                device: deviceId,
                quality: 'high',
                confidence: maintenanceScore
              }
            }];
          }
        }

        return [];
      }
    };
  }

  /**
   * ESG compliance processor
   */
  createESGComplianceProcessor(): StreamProcessor {
    return {
      id: 'esg-compliance',
      name: 'Real-time ESG Compliance Monitor',
      process: async (event: StreamingEvent) => {
        const complianceChecks = [];

        // Carbon emissions compliance
        if (event.type === 'carbon' && event.data.emissions) {
          const monthlyLimit = this.getMonthlyEmissionLimit(event.metadata.facility);
          const currentMonthEmissions = await this.getCurrentMonthEmissions(event.metadata.facility);

          if (currentMonthEmissions + event.data.emissions > monthlyLimit * 0.9) {
            complianceChecks.push({
              id: `compliance-carbon-${Date.now()}`,
              timestamp: Date.now(),
              source: 'esg-compliance',
              type: 'alert',
              data: {
                complianceType: 'carbon-emissions',
                severity: currentMonthEmissions > monthlyLimit ? 'violation' : 'warning',
                currentEmissions: currentMonthEmissions,
                limit: monthlyLimit,
                utilizationPercent: ((currentMonthEmissions / monthlyLimit) * 100).toFixed(1),
                projectedMonthEnd: this.projectMonthEndEmissions(currentMonthEmissions),
                regulations: ['EU-ETS', 'GHG-Protocol', 'SBTi']
              },
              metadata: {
                facility: event.metadata.facility,
                quality: 'high',
                confidence: 0.9
              }
            });
          }
        }

        return complianceChecks;
      }
    };
  }

  // Utility methods
  private extractNumericValue(data: any): number | null {
    if (typeof data.value === 'number') return data.value;
    if (typeof data.amount === 'number') return data.amount;
    if (typeof data.consumption === 'number') return data.consumption;
    return null;
  }

  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return { mean, stdDev: Math.sqrt(variance) };
  }

  private getCarbonFactor(facility?: string): number {
    // Real-time grid carbon factors (kg CO2/kWh)
    const factors: Record<string, number> = {
      'us-east': 0.5,
      'us-west': 0.3,
      'eu-central': 0.4,
      'default': 0.45
    };
    return factors[facility || 'default'];
  }

  private calculateMaintenanceScore(health: any): number {
    let score = 0;
    let factors = 0;

    if (health.vibration.length > 0) {
      const trend = this.calculateTrend(health.vibration);
      score += trend > 0.1 ? 0.4 : 0;
      factors++;
    }

    if (health.temperature.length > 0) {
      const avgTemp = health.temperature.reduce((a: number, b: number) => a + b, 0) / health.temperature.length;
      score += avgTemp > 75 ? 0.3 : 0; // Celsius
      factors++;
    }

    if (health.efficiency.length > 0) {
      const trend = this.calculateTrend(health.efficiency);
      score += trend < -0.05 ? 0.3 : 0; // Declining efficiency
      factors++;
    }

    // Time since last maintenance
    const daysSinceLastMaintenance = (Date.now() - health.lastMaintenance) / (24 * 60 * 60 * 1000);
    if (daysSinceLastMaintenance > 90) score += 0.2;

    return factors > 0 ? score : 0;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private predictFailureTime(health: any): number {
    // Simple linear extrapolation - in production, use ML models
    const trends = [];

    if (health.vibration.length > 0) {
      const trend = this.calculateTrend(health.vibration);
      if (trend > 0) trends.push(30 / trend); // Days until critical vibration
    }

    if (health.efficiency.length > 0) {
      const trend = this.calculateTrend(health.efficiency);
      if (trend < 0) trends.push(60 / Math.abs(trend)); // Days until efficiency drops below threshold
    }

    return trends.length > 0 ? Math.min(...trends) : 365;
  }

  private getMaintenanceRecommendations(health: any): string[] {
    const recommendations = [];

    if (health.vibration.length > 0 && this.calculateTrend(health.vibration) > 0.1) {
      recommendations.push('Check bearing alignment and lubrication');
    }

    if (health.temperature.length > 0) {
      const avgTemp = health.temperature.reduce((a: number, b: number) => a + b, 0) / health.temperature.length;
      if (avgTemp > 75) {
        recommendations.push('Inspect cooling system and clean heat exchangers');
      }
    }

    if (health.efficiency.length > 0 && this.calculateTrend(health.efficiency) < -0.05) {
      recommendations.push('Performance tuning and calibration recommended');
    }

    return recommendations;
  }

  private getWindowKey(event: StreamingEvent, windowing: any): string {
    const windowSize = windowing.size;
    return Math.floor(event.timestamp / windowSize).toString();
  }

  private isWindowComplete(window: StreamingEvent[], windowing: any): boolean {
    if (window.length === 0) return false;

    const firstEvent = window[0];
    const lastEvent = window[window.length - 1];

    return (lastEvent.timestamp - firstEvent.timestamp) >= windowing.size;
  }

  private async handleProcessorResults(results: StreamingEvent[]): Promise<void> {
    for (const result of results) {
      if (result.type === 'alert') {
        // Trigger alert handlers
        this.alertHandlers.forEach(handler => handler(result));
      }

      // Store results for further processing
      await this.storeProcessedEvent(result);
    }
  }

  private async storeProcessedEvent(event: StreamingEvent): Promise<void> {
    // In production, store to time-series database
    console.log('Processed event:', event);
  }

  private async getCurrentMonthEmissions(facility?: string): Promise<number> {
    // Mock implementation - in production, query from database
    return Math.random() * 1000;
  }

  private getMonthlyEmissionLimit(facility?: string): number {
    // Mock implementation - in production, fetch from compliance database
    return 1200; // tonnes CO2
  }

  private projectMonthEndEmissions(current: number): number {
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    return (current / dayOfMonth) * daysInMonth;
  }

  /**
   * Add alert handler
   */
  onAlert(handler: (alert: any) => void): void {
    this.alertHandlers.push(handler);
  }
}

// Export singleton instance
export const streamingEngine = new AdvancedStreamingEngine();

// Pre-register advanced processors
streamingEngine.registerProcessor(streamingEngine.createAnomalyDetector());
streamingEngine.registerProcessor(streamingEngine.createCarbonCalculator());
streamingEngine.registerProcessor(streamingEngine.createPredictiveMaintenanceProcessor());
streamingEngine.registerProcessor(streamingEngine.createESGComplianceProcessor());