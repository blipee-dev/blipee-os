import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/monitoring/collector', () => ({
  MetricsCollector: jest.fn(() => ({
    getMetrics: jest.fn(),
    recordMetric: jest.fn()
  }))
}));

describe('Monitoring Metrics API', () => {
  let mockCollector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollector = new (require('@/lib/monitoring/collector').MetricsCollector)();
  });

  describe('GET /api/monitoring/metrics', () => {
    it('should return metrics data', async () => {
      mockCollector.getMetrics.mockResolvedValue({
        cpu: { usage: 45.2, trend: 'stable' },
        memory: { usage: 67.8, available: 32.2 },
        requests: { total: 1234, rate: 12.5 }
      });

      const _request = new NextRequest('http://localhost:3000/api/monitoring/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cpu.usage).toBe(45.2);
      expect(data.memory.usage).toBe(67.8);
    });

    it('should filter metrics by type', async () => {
      mockCollector.getMetrics.mockResolvedValue({
        cpu: { usage: 45.2 }
      });

      const _request = new NextRequest('http://localhost:3000/api/monitoring/metrics?type=cpu');
      const response = await GET(request);
      const data = await response.json();

      expect(data.cpu).toBeDefined();
      expect(data.memory).toBeUndefined();
    });
  });

  describe('POST /api/monitoring/metrics', () => {
    it('should record custom metrics', async () => {
      mockCollector.recordMetric.mockResolvedValue({ success: true });

      const _request = new NextRequest('http://localhost:3000/api/monitoring/metrics', {
        method: 'POST',
        body: JSON.stringify({
          name: 'custom.metric',
          value: 123.45,
          tags: { service: 'api', endpoint: 'health' }
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(mockCollector.recordMetric).toHaveBeenCalledWith({
        name: 'custom.metric',
        value: 123.45,
        tags: expect.any(Object)
      });
    });

    it('should validate metric format', async () => {
      const _request = new NextRequest('http://localhost:3000/api/monitoring/metrics', {
        method: 'POST',
        body: JSON.stringify({
          name: 'invalid metric name!',
          value: 'not-a-number'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});