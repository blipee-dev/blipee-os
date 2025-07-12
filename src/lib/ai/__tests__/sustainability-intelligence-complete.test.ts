import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SustainabilityIntelligence } from '../sustainability-intelligence';
import { ReportIntelligence } from '../report-intelligence';
import { PredictiveIntelligence } from '../predictive-intelligence';

describe('Sustainability Intelligence - Complete Tests', () => {
  let intelligence: SustainabilityIntelligence;

  beforeEach(() => {
    intelligence = new SustainabilityIntelligence();
  });

  describe('12 Capability Interfaces', () => {
    it('should analyze emissions across all scopes', async () => {
      const emissionsData = {
        scope1: { fuel: 500, refrigerants: 50 },
        scope2: { electricity: 800, steam: 100 },
        scope3: { travel: 200, supply_chain: 1500 }
      };

      const analysis = await intelligence.analyzeEmissions(emissionsData);

      expect(analysis.total).toBe(3150);
      expect(analysis.breakdown).toHaveProperty('scope1');
      expect(analysis.recommendations).toContain('reduce_supply_chain_emissions');
      expect(analysis.hotspots).toContain('scope3.supply_chain');
    });

    it('should track sustainability goals', async () => {
      const goals = [
        { id: 'net_zero_2030', target: 0, deadline: '2030-12-31' },
        { id: 'renewable_80', target: 80, metric: 'renewable_percentage' }
      ];

      const tracking = await intelligence.trackGoals(goals, {
        currentEmissions: 5000,
        renewablePercentage: 45
      });

      expect(tracking.netZero2030.onTrack).toBe(false);
      expect(tracking.netZero2030.requiredReduction).toBe(5000);
      expect(tracking.renewable80.progress).toBe(56.25); // 45/80 * 100
    });

    it('should provide regulatory compliance insights', async () => {
      const compliance = await intelligence.checkCompliance({
        location: { country: 'US', state: 'CA', city: 'San Francisco' },
        buildingType: 'commercial',
        size: 50000
      });

      expect(compliance.requirements).toContainEqual(
        expect.objectContaining({
          regulation: 'SF Building Performance Ordinance',
          status: 'action_required'
        })
      );
      expect(compliance.deadlines).toBeDefined();
      expect(compliance.penalties).toBeDefined();
    });

    it('should generate actionable insights', async () => {
      const data = {
        energyUsage: { trend: 'increasing', rate: 5 },
        emissions: { current: 1000, target: 700 },
        costs: { energy: 50000, maintenance: 20000 }
      };

      const insights = await intelligence.generateInsights(data);

      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'alert',
          message: expect.stringContaining('energy usage increasing')
        })
      );
      expect(insights).toContainEqual(
        expect.objectContaining({
          type: 'opportunity',
          savings: expect.any(Number)
        })
      );
    });
  });

  describe('Document Intelligence', () => {
    it('should extract data from sustainability reports', async () => {
      const mockPDF = Buffer.from('mock pdf content');
      
      const extracted = await intelligence.extractFromDocument(mockPDF, 'pdf');

      expect(extracted).toHaveProperty('emissions');
      expect(extracted).toHaveProperty('energy');
      expect(extracted).toHaveProperty('water');
      expect(extracted).toHaveProperty('waste');
      expect(extracted.confidence).toBeGreaterThan(0.8);
    });

    it('should handle various document formats', async () => {
      const formats = ['pdf', 'xlsx', 'csv', 'image'];
      
      for (const format of formats) {
        const result = await intelligence.extractFromDocument(
          Buffer.from('test'),
          format
        );
        expect(result).toBeDefined();
        expect(result.format).toBe(format);
      }
    });
  });

  describe('Predictive Analytics', () => {
    it('should predict future emissions', async () => {
      const historicalData = [
        { date: '2023-01', emissions: 100 },
        { date: '2023-02', emissions: 95 },
        { date: '2023-03', emissions: 92 },
        // ... more data
      ];

      const prediction = await intelligence.predictEmissions({
        historical: historicalData,
        horizon: 12, // months
        factors: ['seasonality', 'growth', 'efficiency_improvements']
      });

      expect(prediction.forecast).toHaveLength(12);
      expect(prediction.confidence_interval).toBeDefined();
      expect(prediction.trend).toBe('decreasing');
    });

    it('should identify anomalies', async () => {
      const data = {
        energy: [100, 102, 98, 250, 101, 99], // 250 is anomaly
        dates: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
      };

      const anomalies = await intelligence.detectAnomalies(data);

      expect(anomalies).toContainEqual(
        expect.objectContaining({
          date: '2024-04',
          value: 250,
          severity: 'high'
        })
      );
    });
  });
});