/**
 * Conversational AI Testing Framework
 * 
 * Provides comprehensive testing capabilities for AI conversations
 */

import { enhancedAIService, ConversationContext } from '../enhanced-service';
import { TaskType } from '../orchestrator';
import { metrics } from '@/lib/monitoring/metrics';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  inputs: TestInput[];
  expectedOutputs: ExpectedOutput[];
  context?: Partial<ConversationContext>;
  tags: string[];
}

export interface TestInput {
  query: string;
  context?: Record<string, any>;
  options?: Record<string, any>;
}

export interface ExpectedOutput {
  type: 'contains' | 'matches' | 'sentiment' | 'structure' | 'performance';
  criteria: any;
  threshold?: number;
}

export interface TestResult {
  scenarioId: string;
  scenarioName: string;
  passed: boolean;
  score: number;
  duration: number;
  details: TestDetails[];
  timestamp: Date;
}

export interface TestDetails {
  input: TestInput;
  output: string;
  checks: CheckResult[];
  metrics: {
    responseTime: number;
    tokenCount: number;
    confidence: number;
  };
}

export interface CheckResult {
  type: string;
  passed: boolean;
  expected: any;
  actual: any;
  message?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  scenarios: TestScenario[];
  config: TestConfig;
}

export interface TestConfig {
  organizationId: string;
  parallel: boolean;
  timeout: number;
  retries: number;
  mockExternal: boolean;
}

export class ConversationTestFramework {
  private testSuites: Map<string, TestSuite> = new Map();
  
  constructor() {
    this.initializeDefaultSuites();
  }
  
  /**
   * Run a test suite
   */
  async runSuite(
    suiteId: string, 
    config?: Partial<TestConfig>
  ): Promise<TestResult[]> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }
    
    const testConfig = { ...suite.config, ...config };
    const results: TestResult[] = [];
    
    const startTime = Date.now();
    
    for (const scenario of suite.scenarios) {
      const result = await this.runScenario(scenario, testConfig);
      results.push(result);
      
      // Record metrics
      metrics.incrementCounter('ai_tests_run', 1, {
        suite: suiteId,
        scenario: scenario.id,
        passed: result.passed.toString()
      });
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`Test suite ${suiteId} completed in ${duration}ms`);
    console.log(`Passed: ${results.filter(r => r.passed).length}/${results.length}`);
    
    return results;
  }
  
  /**
   * Run a single test scenario
   */
  async runScenario(
    scenario: TestScenario,
    config: TestConfig
  ): Promise<TestResult> {
    const startTime = Date.now();
    const details: TestDetails[] = [];
    
    try {
      for (const input of scenario.inputs) {
        const inputResult = await this.runTestInput(
          input,
          scenario,
          config
        );
        details.push(inputResult);
      }
      
      // Calculate overall pass/fail
      const allChecks = details.flatMap(d => d.checks);
      const passed = allChecks.every(check => check.passed);
      const score = allChecks.filter(c => c.passed).length / allChecks.length;
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed,
        score,
        duration: Date.now() - startTime,
        details,
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: false,
        score: 0,
        duration: Date.now() - startTime,
        details: [{
          input: scenario.inputs[0],
          output: '',
          checks: [{
            type: 'error',
            passed: false,
            expected: 'No error',
            actual: error instanceof Error ? error.message : 'Unknown error'
          }],
          metrics: {
            responseTime: 0,
            tokenCount: 0,
            confidence: 0
          }
        }],
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Run a single test input
   */
  private async runTestInput(
    input: TestInput,
    scenario: TestScenario,
    config: TestConfig
  ): Promise<TestDetails> {
    const startTime = Date.now();
    
    // Build conversation context
    const context: ConversationContext = {
      conversationId: `test-${scenario.id}-${Date.now()}`,
      organizationId: config.organizationId,
      userId: 'test-user',
      messageHistory: [],
      ...scenario.context
    };
    
    // Execute AI query
    const response = await enhancedAIService.processSustainabilityQuery(
      input.query,
      context,
      {
        ...input.options,
        allowSimilarCache: false // Disable cache for testing
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    // Run checks
    const checks: CheckResult[] = [];
    
    for (const expected of scenario.expectedOutputs) {
      const check = await this.runCheck(
        expected,
        response.content,
        response
      );
      checks.push(check);
    }
    
    return {
      input,
      output: response.content,
      checks,
      metrics: {
        responseTime,
        tokenCount: response.metadata.tokenCount || 0,
        confidence: response.confidence
      }
    };
  }
  
  /**
   * Run a single check
   */
  private async runCheck(
    expected: ExpectedOutput,
    output: string,
    fullResponse: any
  ): Promise<CheckResult> {
    switch (expected.type) {
      case 'contains':
        return this.checkContains(output, expected.criteria);
        
      case 'matches':
        return this.checkMatches(output, expected.criteria);
        
      case 'sentiment':
        return this.checkSentiment(output, expected.criteria, expected.threshold);
        
      case 'structure':
        return this.checkStructure(fullResponse, expected.criteria);
        
      case 'performance':
        return this.checkPerformance(fullResponse, expected.criteria);
        
      default:
        return {
          type: expected.type,
          passed: false,
          expected: expected.criteria,
          actual: 'Unknown check type',
          message: `Check type ${expected.type} not implemented`
        };
    }
  }
  
  /**
   * Check if output contains expected text
   */
  private checkContains(output: string, criteria: string | string[]): CheckResult {
    const criteriaArray = Array.isArray(criteria) ? criteria : [criteria];
    const lowerOutput = output.toLowerCase();
    
    const found = criteriaArray.filter(c => 
      lowerOutput.includes(c.toLowerCase())
    );
    
    return {
      type: 'contains',
      passed: found.length === criteriaArray.length,
      expected: criteriaArray,
      actual: found,
      message: `Found ${found.length}/${criteriaArray.length} expected terms`
    };
  }
  
  /**
   * Check if output matches pattern
   */
  private checkMatches(output: string, pattern: string | RegExp): CheckResult {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const matched = regex.test(output);
    
    return {
      type: 'matches',
      passed: matched,
      expected: pattern.toString(),
      actual: matched ? 'Matched' : 'No match',
      message: matched ? 'Pattern matched' : 'Pattern did not match'
    };
  }
  
  /**
   * Check sentiment of output
   */
  private checkSentiment(
    output: string, 
    expectedSentiment: 'positive' | 'negative' | 'neutral',
    threshold: number = 0.7
  ): CheckResult {
    // Simple sentiment analysis - in production use proper NLP
    const positiveWords = ['great', 'excellent', 'good', 'improve', 'success', 'achieve'];
    const negativeWords = ['bad', 'poor', 'fail', 'issue', 'problem', 'concern'];
    
    const lowerOutput = output.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerOutput.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerOutput.includes(w)).length;
    
    let sentiment: string;
    let score: number;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = positiveCount / (positiveCount + negativeCount);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = negativeCount / (positiveCount + negativeCount);
    } else {
      sentiment = 'neutral';
      score = 0.5;
    }
    
    return {
      type: 'sentiment',
      passed: sentiment === expectedSentiment && score >= threshold,
      expected: `${expectedSentiment} (>=${threshold})`,
      actual: `${sentiment} (${score.toFixed(2)})`,
      message: `Sentiment analysis: ${sentiment} with confidence ${score.toFixed(2)}`
    };
  }
  
  /**
   * Check response structure
   */
  private checkStructure(response: any, criteria: any): CheckResult {
    const hasExpectedFields = Object.keys(criteria).every(key => {
      if (key === 'metadata' && criteria.metadata) {
        return Object.keys(criteria.metadata).every(metaKey => 
          response.metadata && response.metadata[metaKey] !== undefined
        );
      }
      return response[key] !== undefined;
    });
    
    return {
      type: 'structure',
      passed: hasExpectedFields,
      expected: criteria,
      actual: {
        content: !!response.content,
        provider: response.provider,
        taskType: response.taskType,
        confidence: response.confidence,
        metadata: Object.keys(response.metadata || {})
      },
      message: hasExpectedFields ? 'Structure matches' : 'Structure mismatch'
    };
  }
  
  /**
   * Check performance metrics
   */
  private checkPerformance(response: any, criteria: any): CheckResult {
    const checks = [];
    
    if (criteria.maxResponseTime) {
      checks.push(response.processingTime <= criteria.maxResponseTime);
    }
    
    if (criteria.minConfidence) {
      checks.push(response.confidence >= criteria.minConfidence);
    }
    
    if (criteria.maxTokens) {
      checks.push((response.metadata.tokenCount || 0) <= criteria.maxTokens);
    }
    
    const passed = checks.every(c => c);
    
    return {
      type: 'performance',
      passed,
      expected: criteria,
      actual: {
        responseTime: response.processingTime,
        confidence: response.confidence,
        tokenCount: response.metadata.tokenCount || 0
      },
      message: `Performance: ${checks.filter(c => c).length}/${checks.length} criteria met`
    };
  }
  
  /**
   * Initialize default test suites
   */
  private initializeDefaultSuites() {
    // Sustainability Analysis Suite
    this.testSuites.set('sustainability-analysis', {
      id: 'sustainability-analysis',
      name: 'Sustainability Analysis Tests',
      scenarios: [
        {
          id: 'carbon-calculation',
          name: 'Carbon Footprint Calculation',
          description: 'Test carbon footprint calculation responses',
          inputs: [{
            query: 'Calculate my carbon footprint for electricity usage of 1000 kWh'
          }],
          expectedOutputs: [
            { type: 'contains', criteria: ['carbon', 'CO2', 'emissions'] },
            { type: 'contains', criteria: ['kWh', '1000'] },
            { type: 'structure', criteria: { metadata: { sustainability: true } } },
            { type: 'performance', criteria: { maxResponseTime: 5000, minConfidence: 0.8 } }
          ],
          tags: ['carbon', 'calculation']
        },
        {
          id: 'target-setting',
          name: 'Science-Based Target Setting',
          description: 'Test target setting recommendations',
          inputs: [{
            query: 'Help me set science-based targets for reducing emissions by 2030'
          }],
          expectedOutputs: [
            { type: 'contains', criteria: ['target', '2030', 'reduction'] },
            { type: 'contains', criteria: ['science-based', 'SBTi'] },
            { type: 'sentiment', criteria: 'positive', threshold: 0.7 },
            { type: 'performance', criteria: { maxResponseTime: 7000 } }
          ],
          tags: ['targets', 'sbti']
        }
      ],
      config: {
        organizationId: 'test-org',
        parallel: false,
        timeout: 30000,
        retries: 2,
        mockExternal: true
      }
    });
    
    // Conversational Flow Suite
    this.testSuites.set('conversation-flow', {
      id: 'conversation-flow',
      name: 'Conversation Flow Tests',
      scenarios: [
        {
          id: 'context-retention',
          name: 'Context Retention',
          description: 'Test if AI retains context across messages',
          inputs: [
            { query: 'My building uses 5000 kWh of electricity per month' },
            { query: 'How much CO2 does that generate?' }
          ],
          expectedOutputs: [
            { type: 'contains', criteria: ['5000', 'kWh'] },
            { type: 'performance', criteria: { maxResponseTime: 3000 } }
          ],
          tags: ['context', 'memory']
        }
      ],
      config: {
        organizationId: 'test-org',
        parallel: false,
        timeout: 30000,
        retries: 1,
        mockExternal: true
      }
    });
  }
  
  /**
   * Add custom test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.testSuites.set(suite.id, suite);
  }
  
  /**
   * Get all test suites
   */
  getTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }
  
  /**
   * Generate test report
   */
  generateReport(results: TestResult[]): string {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    let report = '# AI Conversation Test Report\n\n';
    report += `## Summary\n`;
    report += `- Total Scenarios: ${total}\n`;
    report += `- Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)\n`;
    report += `- Average Score: ${(avgScore*100).toFixed(1)}%\n`;
    report += `- Average Duration: ${avgDuration.toFixed(0)}ms\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    for (const result of results) {
      report += `### ${result.scenarioName}\n`;
      report += `- Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `- Score: ${(result.score*100).toFixed(1)}%\n`;
      report += `- Duration: ${result.duration}ms\n\n`;
      
      if (!result.passed) {
        report += `#### Failed Checks:\n`;
        for (const detail of result.details) {
          for (const check of detail.checks) {
            if (!check.passed) {
              report += `- ${check.type}: Expected ${JSON.stringify(check.expected)}, got ${JSON.stringify(check.actual)}\n`;
            }
          }
        }
        report += '\n';
      }
    }
    
    return report;
  }
}

// Export singleton instance
export const conversationTestFramework = new ConversationTestFramework();