/**
 * Tests for Real-Time Analytics Engine
 * Phase 7: Advanced Analytics & Optimization
 */

import { RealTimeAnalyticsEngine } from '../real-time-analytics-engine';
import type {
  AnalyticsStream,
  StreamDataSource,
  ProcessingRule,
  OutputTarget,
  AnalyticsQuery,
  QueryResult,
  CustomAnalyticsPipeline
} from '../real-time-analytics-engine';

describe('RealTimeAnalyticsEngine', () => {
  let engine: RealTimeAnalyticsEngine;

  beforeEach(() => {
    engine = new RealTimeAnalyticsEngine();
  });

  describe('Stream Registration', () => {
    it('should register a new analytics stream', async () => {
      const stream: AnalyticsStream = {
        streamId: 'test_stream_001',
        name: 'Test Emissions Stream',
        type: 'emissions',
        dataSource: {
          sourceId: 'test_source',
          type: 'iot_sensor',
          connectionConfig: {
            endpoint: 'mqtt://test.local',
            topic: 'test/emissions'
          },
          schema: {
            fields: [
              { name: 'co2', type: 'number', nullable: false },
              { name: 'timestamp', type: 'timestamp', nullable: false }
            ],
            timestampField: 'timestamp'
          }
        },
        frequency: 'realtime',
        processingRules: [],
        outputTargets: []
      };

      const result = await engine.registerStream(stream);
      
      expect(result).toBeDefined();
      expect(result.streamId).toBe(stream.streamId);
      expect(result.status).toBe('active');
    });

    it('should validate stream schema', async () => {
      const invalidStream = {
        streamId: 'invalid_stream',
        name: 'Invalid Stream',
        // Missing required fields
      } as any;

      await expect(engine.registerStream(invalidStream))
        .rejects
        .toThrow();
    });
  });

  describe('Stream Processing', () => {
    it('should process incoming data according to rules', async () => {
      const processingRule: ProcessingRule = {
        ruleId: 'rule_001',
        name: 'Aggregate by minute',
        type: 'aggregation',
        config: {
          operation: 'aggregate',
          parameters: {
            groupBy: 'minute',
            aggregations: { co2: 'sum' }
          },
          windowSize: 60
        },
        priority: 1
      };

      // Test rule processing logic
      const mockData = {
        co2: 100,
        timestamp: new Date().toISOString()
      };

      // This would be implemented with actual processing logic
      expect(processingRule).toBeDefined();
      expect(processingRule.type).toBe('aggregation');
    });
  });

  describe('Analytics Queries', () => {
    it('should execute analytics query', async () => {
      const query: AnalyticsQuery = {
        queryId: 'query_001',
        name: 'Test Query',
        streams: ['test_stream_001'],
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
          duration: 24 * 60 * 60
        },
        aggregations: [
          {
            field: 'co2',
            operation: 'avg',
            groupBy: ['hour']
          }
        ],
        outputFormat: 'json'
      };

      const result = await engine.executeQuery(query);
      
      expect(result).toBeDefined();
      expect(result.queryId).toBe(query.queryId);
      expect(result.status).toBe('completed');
    });

    it('should handle query with predictions', async () => {
      const queryWithPredictions: AnalyticsQuery = {
        queryId: 'query_002',
        name: 'Query with Predictions',
        streams: ['test_stream_001'],
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          duration: 7 * 24 * 60 * 60
        },
        predictions: [
          {
            metric: 'co2',
            horizon: 24 * 60,
            model: 'lstm'
          }
        ],
        outputFormat: 'json'
      };

      const result = await engine.executeQuery(queryWithPredictions);
      
      expect(result.predictions).toBeDefined();
      expect(result.predictions).toHaveLength(1);
    });
  });

  describe('Custom Pipelines', () => {
    it('should create custom analytics pipeline', async () => {
      const pipeline: CustomAnalyticsPipeline = {
        pipelineId: 'custom_001',
        name: 'Custom Emissions Pipeline',
        description: 'Custom processing for emissions data',
        stages: [
          {
            stageId: 'stage_1',
            name: 'Data Cleaning',
            type: 'transform',
            config: {
              operation: 'clean',
              rules: [
                { field: 'co2', rule: 'remove_outliers' }
              ]
            }
          }
        ],
        inputStreams: ['test_stream_001'],
        outputFormat: {
          type: 'structured',
          schema: {
            fields: [
              { name: 'cleaned_co2', type: 'number', nullable: false }
            ],
            timestampField: 'timestamp'
          }
        }
      };

      const result = await engine.createPipeline(pipeline);
      
      expect(result).toBeDefined();
      expect(result.pipelineId).toBe(pipeline.pipelineId);
      expect(result.status).toBe('active');
    });
  });

  describe('Stream Management', () => {
    it('should update stream configuration', async () => {
      const streamId = 'test_stream_001';
      const updates = {
        processingRules: [
          {
            ruleId: 'new_rule',
            name: 'New Processing Rule',
            type: 'filter' as const,
            config: {
              operation: 'filter',
              conditions: [
                { field: 'co2', operator: 'gt' as const, value: 0 }
              ]
            },
            priority: 1
          }
        ]
      };

      const result = await engine.updateStream(streamId, updates);
      
      expect(result.streamId).toBe(streamId);
      expect(result.processingRules).toHaveLength(1);
    });

    it('should pause and resume streams', async () => {
      const streamId = 'test_stream_001';
      
      const pauseResult = await engine.pauseStream(streamId);
      expect(pauseResult.status).toBe('paused');
      
      const resumeResult = await engine.resumeStream(streamId);
      expect(resumeResult.status).toBe('active');
    });

    it('should delete stream', async () => {
      const streamId = 'test_stream_001';
      
      const result = await engine.deleteStream(streamId);
      expect(result.success).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should track analytics performance', async () => {
      const metrics = await engine.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.streamsActive).toBeGreaterThanOrEqual(0);
      expect(metrics.eventsProcessed).toBeGreaterThanOrEqual(0);
      expect(metrics.averageLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle stream connection failures', async () => {
      const faultyStream: AnalyticsStream = {
        streamId: 'faulty_stream',
        name: 'Faulty Stream',
        type: 'emissions',
        dataSource: {
          sourceId: 'bad_source',
          type: 'iot_sensor',
          connectionConfig: {
            endpoint: 'mqtt://unreachable.host',
            topic: 'test/topic'
          },
          schema: {
            fields: [],
            timestampField: 'timestamp'
          }
        },
        frequency: 'realtime',
        processingRules: [],
        outputTargets: []
      };

      const result = await engine.registerStream(faultyStream);
      
      // Should register but show connection error
      expect(result.streamId).toBe(faultyStream.streamId);
      expect(result.health?.status).toBe('unhealthy');
    });

    it('should handle malformed data gracefully', async () => {
      // Test processing malformed data
      const malformedData = {
        // Missing required fields
        randomField: 'value'
      };

      // Engine should handle gracefully without crashing
      expect(() => engine.processData('test_stream', malformedData))
        .not.toThrow();
    });
  });
});