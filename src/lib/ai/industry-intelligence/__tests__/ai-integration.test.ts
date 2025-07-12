/**
 * Tests for AI Integration
 * Validates integration between industry intelligence and AI chat system
 */

import { AIIntegration } from '../ai-integration';
import { IndustryClassification, GRISectorStandard } from '../types';

// Mock the IndustryOrchestrator
jest.mock('../industry-orchestrator', () => ({
  IndustryOrchestrator: jest.fn().mockImplementation(() => ({
    analyzeOrganization: jest.fn().mockResolvedValue({
      organizationId: 'test-org',
      industry: { naicsCode: '211110', confidence: 0.9 },
      applicableGRIStandards: ['GRI 11'],
      materialTopics: [
        {
          id: 'climate',
          name: 'Climate adaptation',
          relevance: 'high',
          impactAreas: ['Environment'],
          metrics: ['ghg_intensity'],
          disclosures: ['GRI 305-1']
        }
      ],
      requiredDisclosures: [
        {
          code: 'GRI 305-1',
          title: 'Direct (Scope 1) GHG emissions',
          requirements: ['Report emissions in CO2 equivalent']
        }
      ],
      benchmarks: [
        {
          metricId: 'ghg_intensity',
          average: 25.0,
          percentiles: { p50: 22.0, p75: 18.0, p90: 15.0 }
        }
      ],
      recommendations: [
        {
          type: 'performance',
          priority: 'high',
          title: 'Reduce methane emissions',
          description: 'Implement leak detection and repair program'
        }
      ]
    }),
    getMaterialTopics: jest.fn().mockResolvedValue([
      {
        id: 'climate',
        name: 'Climate adaptation',
        relevance: 'high'
      }
    ]),
    getRecommendations: jest.fn().mockResolvedValue([
      {
        type: 'performance',
        priority: 'high',
        title: 'Reduce emissions'
      }
    ]),
    classifyIndustry: jest.fn().mockResolvedValue({
      naicsCode: '211110',
      confidence: 0.9
    })
  }))
}));

describe('AIIntegration', () => {
  let integration: AIIntegration;

  beforeEach(() => {
    integration = new AIIntegration();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(integration).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        enableAutoTriggers: false,
        enableContextEnhancement: true,
        maxRecommendations: 5
      };

      const customIntegration = new AIIntegration(customConfig);
      expect(customIntegration).toBeDefined();
    });
  });

  describe('Context Enhancement', () => {
    test('should enhance context with industry intelligence', async () => {
      const originalContext = {
        organizationId: 'test-org',
        userId: 'user-123',
        conversationHistory: [
          {
            role: 'user',
            content: 'What are our emissions compared to industry average?'
          }
        ],
        organizationData: {
          naicsCode: '211110',
          scope1_emissions: 100000,
          scope2_emissions: 25000
        }
      };

      const enhancedContext = await integration.enhanceContext(originalContext);

      expect(enhancedContext).toBeDefined();
      expect(enhancedContext.industryIntelligence).toBeDefined();
      expect(enhancedContext.industryIntelligence.classification).toBeDefined();
      expect(enhancedContext.industryIntelligence.materialTopics).toBeDefined();
      expect(enhancedContext.industryIntelligence.benchmarks).toBeDefined();
      expect(enhancedContext.industryIntelligence.recommendations).toBeDefined();

      // Original context should be preserved
      expect(enhancedContext.organizationId).toBe('test-org');
      expect(enhancedContext.userId).toBe('user-123');
      expect(enhancedContext.conversationHistory).toEqual(originalContext.conversationHistory);
    });

    test('should handle missing organization data gracefully', async () => {
      const contextWithoutOrgData = {
        organizationId: 'test-org',
        userId: 'user-123',
        conversationHistory: []
      };

      const enhancedContext = await integration.enhanceContext(contextWithoutOrgData);

      expect(enhancedContext).toBeDefined();
      expect(enhancedContext.industryIntelligence).toBeDefined();
    });
  });

  describe('Trigger Detection', () => {
    test('should detect industry-related queries', () => {
      const queries = [
        'What are our Scope 1 emissions compared to peers?',
        'How do we compare to industry benchmarks?',
        'What GRI standards apply to us?',
        'Show me our ESG performance vs competitors',
        'What are the material topics for our industry?'
      ];

      queries.forEach(query => {
        const shouldTrigger = integration.shouldTriggerIndustryAnalysis(query);
        expect(shouldTrigger).toBe(true);
      });
    });

    test('should not trigger for non-industry queries', () => {
      const queries = [
        'What is the weather today?',
        'How do I reset my password?',
        'Schedule a meeting for tomorrow',
        'What is our company address?'
      ];

      queries.forEach(query => {
        const shouldTrigger = integration.shouldTriggerIndustryAnalysis(query);
        expect(shouldTrigger).toBe(false);
      });
    });

    test('should detect regulatory queries', () => {
      const queries = [
        'What regulations apply to our industry?',
        'Are we compliant with EPA requirements?',
        'What GRI disclosures do we need to report?',
        'When is the next regulatory deadline?'
      ];

      queries.forEach(query => {
        const shouldTrigger = integration.shouldTriggerRegulatoryAnalysis(query);
        expect(shouldTrigger).toBe(true);
      });
    });

    test('should detect benchmarking queries', () => {
      const queries = [
        'How do we compare to industry peers?',
        'What is the industry average for emissions?',
        'Who are the top performers in our sector?',
        'Where do we rank in ESG performance?'
      ];

      queries.forEach(query => {
        const shouldTrigger = integration.shouldTriggerBenchmarkAnalysis(query);
        expect(shouldTrigger).toBe(true);
      });
    });
  });

  describe('Prompt Enhancement', () => {
    test('should enhance prompts with industry context', async () => {
      const originalPrompt = 'What are our emissions compared to industry average?';
      const context = {
        organizationId: 'test-org',
        organizationData: {
          naicsCode: '211110',
          scope1_emissions: 100000
        }
      };

      const enhancedPrompt = await integration.enhancePrompt(originalPrompt, context);

      expect(enhancedPrompt).toBeDefined();
      expect(enhancedPrompt.length).toBeGreaterThan(originalPrompt.length);
      expect(enhancedPrompt).toContain('Oil and Gas');
      expect(enhancedPrompt).toContain('GRI 11');
      expect(enhancedPrompt).toContain('industry average');
      expect(enhancedPrompt).toContain('material topics');
    });

    test('should include relevant benchmarks in prompt', async () => {
      const originalPrompt = 'How do we compare to peers?';
      const context = {
        organizationId: 'test-org',
        organizationData: {
          naicsCode: '211110',
          ghg_intensity: 30.0
        }
      };

      const enhancedPrompt = await integration.enhancePrompt(originalPrompt, context);

      expect(enhancedPrompt).toContain('industry benchmark');
      expect(enhancedPrompt).toContain('percentile');
      expect(enhancedPrompt).toContain('average');
    });

    test('should include regulatory context when relevant', async () => {
      const originalPrompt = 'What compliance requirements do we have?';
      const context = {
        organizationId: 'test-org',
        organizationData: {
          naicsCode: '211110',
          jurisdiction: 'US'
        }
      };

      const enhancedPrompt = await integration.enhancePrompt(originalPrompt, context);

      expect(enhancedPrompt).toContain('regulatory');
      expect(enhancedPrompt).toContain('compliance');
      expect(enhancedPrompt).toContain('US');
    });
  });

  describe('Response Processing', () => {
    test('should process AI responses and add industry insights', async () => {
      const aiResponse = {
        content: 'Your emissions are higher than the industry average.',
        recommendations: []
      };

      const context = {
        organizationId: 'test-org',
        organizationData: {
          naicsCode: '211110',
          ghg_intensity: 35.0
        }
      };

      const processedResponse = await integration.processResponse(aiResponse, context);

      expect(processedResponse).toBeDefined();
      expect(processedResponse.content).toContain(aiResponse.content);
      expect(processedResponse.industryInsights).toBeDefined();
      expect(processedResponse.industryInsights.materialTopics).toBeDefined();
      expect(processedResponse.industryInsights.benchmarkComparison).toBeDefined();
      expect(processedResponse.industryInsights.recommendations).toBeDefined();
    });

    test('should add visualizations when appropriate', async () => {
      const aiResponse = {
        content: 'Here is your performance comparison.',
        visualizations: []
      };

      const context = {
        organizationId: 'test-org',
        organizationData: {
          naicsCode: '211110',
          ghg_intensity: 25.0
        }
      };

      const processedResponse = await integration.processResponse(aiResponse, context);

      expect(processedResponse.visualizations).toBeDefined();
      expect(processedResponse.visualizations.length).toBeGreaterThan(0);
      
      const benchmarkChart = processedResponse.visualizations.find(v => 
        v.type === 'benchmark-comparison'
      );
      expect(benchmarkChart).toBeDefined();
    });
  });

  describe('Automatic Insights', () => {
    test('should generate proactive insights', async () => {
      const organizationData = {
        naicsCode: '211110',
        ghg_intensity: 45.0, // Above average
        methane_intensity: 0.8, // High
        trir: 2.0 // Poor safety
      };

      const insights = await integration.generateProactiveInsights(
        'test-org',
        organizationData
      );

      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);

      insights.forEach(insight => {
        expect(insight.type).toMatch(/alert|opportunity|benchmark|regulatory/);
        expect(insight.priority).toMatch(/critical|high|medium|low/);
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.actionable).toBe(true);
        expect(Array.isArray(insight.recommendations)).toBe(true);
      });
    });

    test('should prioritize critical insights', async () => {
      const organizationData = {
        naicsCode: '211110',
        ghg_intensity: 80.0, // Very high
        safety_incidents: 10, // Many incidents
        compliance_score: 0.3 // Poor compliance
      };

      const insights = await integration.generateProactiveInsights(
        'test-org',
        organizationData
      );

      const criticalInsights = insights.filter(i => i.priority === 'critical');
      expect(criticalInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Conversation Memory', () => {
    test('should track industry-related conversation topics', () => {
      const conversations = [
        {
          role: 'user',
          content: 'What are our Scope 1 emissions?',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'Your Scope 1 emissions are 100,000 tCO2e',
          timestamp: new Date()
        },
        {
          role: 'user',
          content: 'How does that compare to industry average?',
          timestamp: new Date()
        }
      ];

      const topics = integration.extractIndustryTopics(conversations);

      expect(topics).toBeDefined();
      expect(topics).toContain('emissions');
      expect(topics).toContain('benchmarking');
      expect(topics).toContain('scope-1');
    });

    test('should maintain context across conversation turns', async () => {
      const conversationHistory = [
        {
          role: 'user',
          content: 'What are our emissions?',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'Your Scope 1 emissions are 100,000 tCO2e',
          timestamp: new Date()
        }
      ];

      const context = {
        organizationId: 'test-org',
        conversationHistory,
        organizationData: { naicsCode: '211110' }
      };

      const newQuery = 'How does that compare to peers?';
      const enhancedPrompt = await integration.enhancePrompt(newQuery, context);

      expect(enhancedPrompt).toContain('emissions');
      expect(enhancedPrompt).toContain('100,000');
      expect(enhancedPrompt).toContain('compare');
    });
  });

  describe('Error Handling', () => {
    test('should handle analysis failures gracefully', async () => {
      // Mock a failure in industry analysis
      const failingIntegration = new AIIntegration();
      (failingIntegration as any).orchestrator = {
        analyzeOrganization: jest.fn().mockRejectedValue(new Error('Analysis failed'))
      };

      const context = {
        organizationId: 'test-org',
        organizationData: { naicsCode: '211110' }
      };

      const enhancedContext = await failingIntegration.enhanceContext(context);

      expect(enhancedContext).toBeDefined();
      expect(enhancedContext.organizationId).toBe('test-org');
      // Should include error information but not fail completely
      expect(enhancedContext.industryIntelligence?.error).toBeDefined();
    });

    test('should handle invalid industry classifications', async () => {
      const context = {
        organizationId: 'test-org',
        organizationData: {
          naicsCode: '999999' // Invalid code
        }
      };

      const enhancedContext = await integration.enhanceContext(context);

      expect(enhancedContext).toBeDefined();
      expect(enhancedContext.industryIntelligence).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    test('should cache industry analysis results', async () => {
      const context = {
        organizationId: 'test-org',
        organizationData: { naicsCode: '211110' }
      };

      const start1 = Date.now();
      const result1 = await integration.enhanceContext(context);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const result2 = await integration.enhanceContext(context);
      const time2 = Date.now() - start2;

      expect(result1).toEqual(result2);
      expect(time2).toBeLessThan(time1); // Second call should be faster
    });

    test('should support cache invalidation', () => {
      integration.clearCache();
      
      const cacheSize = integration.getCacheSize();
      expect(cacheSize).toBe(0);
    });
  });

  describe('Configuration', () => {
    test('should respect auto-trigger configuration', () => {
      const config = {
        enableAutoTriggers: false,
        enableContextEnhancement: true,
        maxRecommendations: 3
      };

      const configuredIntegration = new AIIntegration(config);
      
      const query = 'What are our emissions compared to industry?';
      const shouldTrigger = configuredIntegration.shouldTriggerIndustryAnalysis(query);
      
      // Should respect the disabled auto-triggers
      expect(shouldTrigger).toBe(false);
    });

    test('should limit recommendations based on configuration', async () => {
      const config = {
        enableAutoTriggers: true,
        enableContextEnhancement: true,
        maxRecommendations: 2
      };

      const configuredIntegration = new AIIntegration(config);
      
      const organizationData = {
        naicsCode: '211110',
        ghg_intensity: 50.0
      };

      const insights = await configuredIntegration.generateProactiveInsights(
        'test-org',
        organizationData
      );

      // Should limit recommendations per insight based on config
      insights.forEach(insight => {
        expect(insight.recommendations.length).toBeLessThanOrEqual(2);
      });
    });
  });
});