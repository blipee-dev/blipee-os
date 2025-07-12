#!/usr/bin/env node

/**
 * Test the AI System Core - The Heart of blipee OS
 */

const fs = require('fs').promises;
const path = require('path');

const aiSystemTests = [
  // Context Engine Tests
  {
    file: 'src/lib/ai/__tests__/context-engine-complete.test.ts',
    name: 'AI Context Engine',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ContextEngine } from '../context-engine';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/data/weather-service');
jest.mock('@/lib/data/carbon-service');

describe('AI Context Engine - Complete Tests', () => {
  let contextEngine: ContextEngine;
  let mockSupabase: any;

  beforeEach(() => {
    contextEngine = new ContextEngine();
    mockSupabase = createClient();
  });

  describe('Context Building', () => {
    it('should build comprehensive context from multiple sources', async () => {
      // Mock building data
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'building123',
                name: 'Main Office',
                size: 50000,
                type: 'office',
                location: { lat: 37.7749, lng: -122.4194 }
              }
            }))
          }))
        }))
      }));

      // Mock weather data
      const { WeatherService } = require('@/lib/data/weather-service');
      WeatherService.prototype.getCurrentWeather = jest.fn().mockResolvedValue({
        temp: 72,
        humidity: 65,
        conditions: 'sunny'
      });

      // Mock carbon data
      const { CarbonService } = require('@/lib/data/carbon-service');
      CarbonService.prototype.getGridEmissions = jest.fn().mockResolvedValue({
        carbonIntensity: 150,
        energyMix: { renewable: 45, fossil: 55 }
      });

      const context = await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'building123',
        includeWeather: true,
        includeCarbon: true,
        includeHistory: true
      });

      expect(context).toHaveProperty('building');
      expect(context).toHaveProperty('weather');
      expect(context).toHaveProperty('carbon');
      expect(context).toHaveProperty('userPreferences');
      expect(context.building.name).toBe('Main Office');
      expect(context.weather.temp).toBe(72);
      expect(context.carbon.carbonIntensity).toBe(150);
    });

    it('should handle missing data gracefully', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Not found' }
            }))
          }))
        }))
      }));

      const context = await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'invalid'
      });

      expect(context).toHaveProperty('error');
      expect(context.fallbackContext).toBeDefined();
    });

    it('should cache context for performance', async () => {
      const spy = jest.spyOn(mockSupabase, 'from');

      // First call
      await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'building123'
      });

      // Second call should use cache
      await contextEngine.buildContext({
        userId: 'user123',
        buildingId: 'building123'
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Enhancement', () => {
    it('should enhance context with historical patterns', async () => {
      const baseContext = {
        building: { id: 'building123' },
        timeRange: '30d'
      };

      const enhanced = await contextEngine.enhanceWithHistory(baseContext);

      expect(enhanced).toHaveProperty('patterns');
      expect(enhanced).toHaveProperty('anomalies');
      expect(enhanced).toHaveProperty('predictions');
    });

    it('should add regulatory context', async () => {
      const context = await contextEngine.addRegulatoryContext({
        building: { location: { country: 'US', state: 'CA' } }
      });

      expect(context.regulations).toContain('Title 24');
      expect(context.regulations).toContain('AB 32');
      expect(context.incentives).toBeDefined();
    });
  });

  describe('Real-time Context Updates', () => {
    it('should update context on real-time events', async () => {
      const callback = jest.fn();
      
      contextEngine.subscribeToUpdates('building123', callback);

      // Simulate real-time event
      await contextEngine.handleRealtimeEvent({
        type: 'building.updated',
        buildingId: 'building123',
        changes: { energyUsage: 1500 }
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          updated: true,
          changes: expect.any(Object)
        })
      );
    });
  });
});`
  },

  // Action Planner Tests
  {
    file: 'src/lib/ai/__tests__/action-planner-complete.test.ts',
    name: 'AI Action Planner',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ActionPlanner } from '../action-planner';
import { SustainabilityIntelligence } from '../sustainability-intelligence';

jest.mock('../sustainability-intelligence');

describe('AI Action Planner - Complete Tests', () => {
  let actionPlanner: ActionPlanner;
  let mockIntelligence: jest.Mocked<SustainabilityIntelligence>;

  beforeEach(() => {
    actionPlanner = new ActionPlanner();
    mockIntelligence = new SustainabilityIntelligence() as jest.Mocked<SustainabilityIntelligence>;
  });

  describe('Goal-based Planning', () => {
    it('should create action plan for emission reduction goal', async () => {
      const goal = {
        type: 'emission_reduction',
        target: 30, // 30% reduction
        timeframe: '12m',
        baseline: 1000 // tons CO2
      };

      const context = {
        building: {
          currentEmissions: 1000,
          energySources: { grid: 70, solar: 30 },
          equipment: ['hvac', 'lighting', 'servers']
        }
      };

      const plan = await actionPlanner.createPlan(goal, context);

      expect(plan.steps).toBeInstanceOf(Array);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.estimatedReduction).toBeGreaterThanOrEqual(300);
      expect(plan.timeline).toBeDefined();
      expect(plan.priority).toBe('high');

      // Verify specific actions
      const actions = plan.steps.map(s => s.action);
      expect(actions).toContain('optimize_hvac_schedule');
      expect(actions).toContain('increase_solar_capacity');
      expect(actions).toContain('upgrade_lighting_to_led');
    });

    it('should prioritize cost-effective actions', async () => {
      const goal = {
        type: 'cost_reduction',
        target: 20,
        constraints: { budget: 50000 }
      };

      const plan = await actionPlanner.createPlan(goal, {});

      // Should be sorted by ROI
      expect(plan.steps[0].roi).toBeGreaterThan(plan.steps[1].roi);
      
      // Total cost should be within budget
      const totalCost = plan.steps.reduce((sum, step) => sum + step.cost, 0);
      expect(totalCost).toBeLessThanOrEqual(50000);
    });

    it('should handle multi-objective optimization', async () => {
      const goals = [
        { type: 'emission_reduction', target: 25, weight: 0.6 },
        { type: 'cost_reduction', target: 15, weight: 0.4 }
      ];

      const plan = await actionPlanner.createMultiObjectivePlan(goals, {});

      expect(plan.tradeoffs).toBeDefined();
      expect(plan.paretoOptimal).toBe(true);
      expect(plan.scores.emission).toBeGreaterThan(0);
      expect(plan.scores.cost).toBeGreaterThan(0);
    });
  });

  describe('Adaptive Planning', () => {
    it('should adapt plan based on progress', async () => {
      const originalPlan = {
        id: 'plan123',
        steps: [
          { id: 'step1', status: 'completed' },
          { id: 'step2', status: 'in_progress' },
          { id: 'step3', status: 'pending' }
        ],
        target: 30
      };

      const progress = {
        achieved: 10, // Only 10% reduction so far
        daysElapsed: 60,
        totalDays: 365
      };

      const adaptedPlan = await actionPlanner.adaptPlan(originalPlan, progress);

      expect(adaptedPlan.adjusted).toBe(true);
      expect(adaptedPlan.newSteps.length).toBeGreaterThan(0);
      expect(adaptedPlan.urgency).toBe('high');
    });

    it('should suggest alternative approaches when blocked', async () => {
      const blockedStep = {
        action: 'install_solar_panels',
        reason: 'regulatory_approval_denied'
      };

      const alternatives = await actionPlanner.getAlternatives(blockedStep);

      expect(alternatives).toContainEqual(
        expect.objectContaining({
          action: 'purchase_renewable_energy_credits'
        })
      );
      expect(alternatives).toContainEqual(
        expect.objectContaining({
          action: 'join_community_solar_program'
        })
      );
    });
  });

  describe('Scenario Analysis', () => {
    it('should simulate plan outcomes', async () => {
      const plan = {
        steps: [
          { action: 'upgrade_hvac', impact: 15 },
          { action: 'solar_installation', impact: 25 }
        ]
      };

      const scenarios = await actionPlanner.runScenarios(plan, {
        monteCarloRuns: 1000,
        variables: ['energy_prices', 'weather', 'occupancy']
      });

      expect(scenarios.bestCase.reduction).toBeGreaterThan(40);
      expect(scenarios.worstCase.reduction).toBeLessThan(30);
      expect(scenarios.mostLikely.reduction).toBeCloseTo(38, 1);
      expect(scenarios.confidence).toBeGreaterThan(0.8);
    });
  });
});`
  },

  // Sustainability Intelligence Tests
  {
    file: 'src/lib/ai/__tests__/sustainability-intelligence-complete.test.ts',
    name: 'Sustainability Intelligence',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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
});`
  },

  // Multi-Provider Orchestration Tests
  {
    file: 'src/lib/ai/__tests__/multi-provider-orchestration.test.ts',
    name: 'Multi-Provider AI Orchestration',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AIService } from '../service';
import { DeepSeekProvider } from '../providers/deepseek';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';

jest.mock('../providers/deepseek');
jest.mock('../providers/openai');
jest.mock('../providers/anthropic');

describe('Multi-Provider AI Orchestration', () => {
  let aiService: AIService;
  let mockDeepSeek: jest.Mocked<DeepSeekProvider>;
  let mockOpenAI: jest.Mocked<OpenAIProvider>;
  let mockAnthropic: jest.Mocked<AnthropicProvider>;

  beforeEach(() => {
    aiService = new AIService();
    mockDeepSeek = new DeepSeekProvider() as jest.Mocked<DeepSeekProvider>;
    mockOpenAI = new OpenAIProvider() as jest.Mocked<OpenAIProvider>;
    mockAnthropic = new AnthropicProvider() as jest.Mocked<AnthropicProvider>;
  });

  describe('Provider Fallback', () => {
    it('should fallback to OpenAI when DeepSeek fails', async () => {
      mockDeepSeek.chat.mockRejectedValue(new Error('DeepSeek unavailable'));
      mockOpenAI.chat.mockResolvedValue({
        content: 'Response from OpenAI',
        model: 'gpt-4'
      });

      const response = await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.content).toBe('Response from OpenAI');
      expect(mockDeepSeek.chat).toHaveBeenCalled();
      expect(mockOpenAI.chat).toHaveBeenCalled();
      expect(mockAnthropic.chat).not.toHaveBeenCalled();
    });

    it('should fallback to Anthropic when both DeepSeek and OpenAI fail', async () => {
      mockDeepSeek.chat.mockRejectedValue(new Error('DeepSeek unavailable'));
      mockOpenAI.chat.mockRejectedValue(new Error('OpenAI unavailable'));
      mockAnthropic.chat.mockResolvedValue({
        content: 'Response from Anthropic',
        model: 'claude-3'
      });

      const response = await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.content).toBe('Response from Anthropic');
      expect(mockAnthropic.chat).toHaveBeenCalled();
    });

    it('should throw error when all providers fail', async () => {
      mockDeepSeek.chat.mockRejectedValue(new Error('Failed'));
      mockOpenAI.chat.mockRejectedValue(new Error('Failed'));
      mockAnthropic.chat.mockRejectedValue(new Error('Failed'));

      await expect(aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow('All AI providers failed');
    });
  });

  describe('Provider Selection', () => {
    it('should select provider based on task type', async () => {
      // Code generation should prefer DeepSeek
      await aiService.chat({
        messages: [{ role: 'user', content: 'Write a Python function' }],
        metadata: { taskType: 'code_generation' }
      });

      expect(mockDeepSeek.chat).toHaveBeenCalled();

      // Creative writing should prefer Anthropic
      await aiService.chat({
        messages: [{ role: 'user', content: 'Write a story' }],
        metadata: { taskType: 'creative_writing' }
      });

      expect(mockAnthropic.chat).toHaveBeenCalled();
    });

    it('should handle streaming responses', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { delta: 'Hello' };
          yield { delta: ' world' };
        }
      };

      mockDeepSeek.streamChat.mockResolvedValue(mockStream);

      const stream = await aiService.streamChat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk.delta);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });
  });

  describe('Cost Optimization', () => {
    it('should track token usage across providers', async () => {
      mockDeepSeek.chat.mockResolvedValue({
        content: 'Response',
        usage: { prompt_tokens: 10, completion_tokens: 20 }
      });

      await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const usage = aiService.getTokenUsage();
      expect(usage.deepseek.total).toBe(30);
      expect(usage.totalCost).toBeGreaterThan(0);
    });

    it('should switch providers based on rate limits', async () => {
      // Simulate rate limit on DeepSeek
      aiService.setRateLimit('deepseek', { remaining: 0 });

      await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(mockDeepSeek.chat).not.toHaveBeenCalled();
      expect(mockOpenAI.chat).toHaveBeenCalled();
    });
  });
});`
  },

  // Document Parser Tests
  {
    file: 'src/lib/data/__tests__/document-parser-complete.test.ts',
    name: 'Document Parser',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DocumentParser } from '../document-parser';
import { OCRService } from '../ocr-service';
import { AIService } from '@/lib/ai/service';

jest.mock('../ocr-service');
jest.mock('@/lib/ai/service');

describe('Document Parser - Complete Tests', () => {
  let parser: DocumentParser;
  let mockOCR: jest.Mocked<OCRService>;
  let mockAI: jest.Mocked<AIService>;

  beforeEach(() => {
    parser = new DocumentParser();
    mockOCR = new OCRService() as jest.Mocked<OCRService>;
    mockAI = new AIService() as jest.Mocked<AIService>;
  });

  describe('PDF Parsing', () => {
    it('should extract emissions data from utility bills', async () => {
      const pdfBuffer = Buffer.from('mock pdf');
      
      mockOCR.extractText.mockResolvedValue({
        text: 'Electricity Usage: 5,000 kWh\\nNatural Gas: 200 therms\\nTotal: $850.00',
        confidence: 0.95
      });

      mockAI.extractStructuredData.mockResolvedValue({
        electricity: { value: 5000, unit: 'kWh' },
        gas: { value: 200, unit: 'therms' },
        cost: 850,
        emissions: 2.5 // tons CO2
      });

      const result = await parser.parseUtilityBill(pdfBuffer);

      expect(result.electricity).toBe(5000);
      expect(result.gas).toBe(200);
      expect(result.emissions).toBe(2.5);
      expect(result.documentType).toBe('utility_bill');
    });

    it('should parse sustainability reports', async () => {
      const reportPDF = Buffer.from('sustainability report');

      mockAI.extractStructuredData.mockResolvedValue({
        scope1: 1000,
        scope2: 2000,
        scope3: 5000,
        targets: [
          { year: 2030, reduction: 50 },
          { year: 2050, reduction: 100 }
        ],
        initiatives: ['Solar installation', 'Fleet electrification']
      });

      const result = await parser.parseSustainabilityReport(reportPDF);

      expect(result.totalEmissions).toBe(8000);
      expect(result.targets).toHaveLength(2);
      expect(result.initiatives).toContain('Solar installation');
    });
  });

  describe('Image Processing', () => {
    it('should extract data from receipt images', async () => {
      const imageBuffer = Buffer.from('receipt image');

      mockOCR.extractFromImage.mockResolvedValue({
        text: 'UBER\\nTrip: Airport to Office\\nDistance: 25 miles\\nTotal: $45.00',
        regions: [{ text: 'UBER', confidence: 0.98 }]
      });

      const result = await parser.parseTransportReceipt(imageBuffer);

      expect(result.type).toBe('rideshare');
      expect(result.distance).toBe(25);
      expect(result.emissions).toBeGreaterThan(0);
    });

    it('should handle handwritten notes', async () => {
      mockOCR.extractHandwriting.mockResolvedValue({
        text: 'Meeting notes: Reduce energy by 20%',
        confidence: 0.7
      });

      const result = await parser.parseHandwrittenNote(Buffer.from('image'));

      expect(result.extracted).toContain('Reduce energy by 20%');
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('Spreadsheet Processing', () => {
    it('should parse Excel emissions data', async () => {
      const excelData = {
        sheets: [{
          name: 'Emissions',
          data: [
            ['Month', 'Electricity (kWh)', 'Gas (therms)', 'Emissions (tCO2)'],
            ['Jan', 5000, 200, 2.5],
            ['Feb', 4800, 180, 2.3]
          ]
        }]
      };

      const result = await parser.parseExcel(excelData);

      expect(result.months).toHaveLength(2);
      expect(result.totals.electricity).toBe(9800);
      expect(result.totals.emissions).toBe(4.8);
    });

    it('should validate data quality', async () => {
      const invalidData = {
        sheets: [{
          data: [
            ['Month', 'Usage'],
            ['Jan', 'invalid'],
            ['Feb', -100] // Negative value
          ]
        }]
      };

      const result = await parser.parseExcel(invalidData);

      expect(result.errors).toContainEqual(
        expect.objectContaining({
          row: 2,
          issue: 'Invalid number format'
        })
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          row: 3,
          issue: 'Negative value'
        })
      );
    });
  });

  describe('Multi-Document Correlation', () => {
    it('should correlate data across multiple documents', async () => {
      const documents = [
        { type: 'utility_bill', month: 'Jan', electricity: 5000 },
        { type: 'receipt', month: 'Jan', travel: 500 },
        { type: 'invoice', month: 'Jan', supplies: 1000 }
      ];

      const correlated = await parser.correlateDocuments(documents);

      expect(correlated.january.total_emissions).toBe(
        expect.any(Number)
      );
      expect(correlated.january.breakdown).toHaveProperty('electricity');
      expect(correlated.january.breakdown).toHaveProperty('travel');
    });
  });
});`
  }
];

async function generateAISystemTests() {
  console.log('🚀 Generating AI System Core tests...\n');
  
  for (const test of aiSystemTests) {
    try {
      const dir = path.dirname(test.file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(test.file, test.content);
      console.log(`✅ ${test.name}`);
    } catch (error) {
      console.error(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n✨ AI System Core tests generated!');
  console.log('\nCoverage added:');
  console.log('- Context Engine (building rich context)');
  console.log('- Action Planner (sustainability goal planning)');
  console.log('- Sustainability Intelligence (12 capabilities)');
  console.log('- Multi-Provider Orchestration (DeepSeek → OpenAI → Anthropic)');
  console.log('- Document Parser (OCR, AI extraction, multi-format)');
}

generateAISystemTests().catch(console.error);