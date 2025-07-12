import { 
  recordMetric, 
  getMetrics, 
  clearMetrics,
  calculateAverage,
  calculatePercentile 
} from '../metrics';

describe('metrics', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      recordMetric('test.metric', 100, 'ms');
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test.metric');
      expect(metrics[0].value).toBe(100);
    });

    it('should record multiple metrics', () => {
      recordMetric('metric1', 100);
      recordMetric('metric2', 200);
      const metrics = getMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should include tags if provided', () => {
      recordMetric('tagged.metric', 50, 'count', { environment: 'test' });
      const metrics = getMetrics();
      expect(metrics[0].tags).toEqual({ environment: 'test' });
    });
  });

  describe('getMetrics', () => {
    it('should return empty array when no metrics', () => {
      expect(getMetrics()).toEqual([]);
    });

    it('should filter metrics by name', () => {
      recordMetric('api.latency', 100);
      recordMetric('db.query', 50);
      const apiMetrics = getMetrics({ name: 'api.latency' });
      expect(apiMetrics).toHaveLength(1);
      expect(apiMetrics[0].name).toBe('api.latency');
    });

    it('should filter metrics by time range', () => {
      recordMetric('old.metric', 100);
      const future = Date.now() + 10000;
      const metrics = getMetrics({ startTime: future });
      expect(metrics).toHaveLength(0);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average of values', () => {
      const values = [10, 20, 30, 40, 50];
      expect(calculateAverage(values)).toBe(30);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(calculateAverage([42])).toBe(42);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate 50th percentile (median)', () => {
      const values = [1, 2, 3, 4, 5];
      expect(calculatePercentile(values, 50)).toBe(3);
    });

    it('should calculate 95th percentile', () => {
      const values = Array.from({length: 100}, (_, i) => i + 1);
      expect(calculatePercentile(values, 95)).toBe(95);
    });

    it('should return 0 for empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });
  });
});