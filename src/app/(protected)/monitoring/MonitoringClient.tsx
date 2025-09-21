import { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/monitoring/PerformanceDashboard';
import { RealtimeMetrics } from '@/components/monitoring/MetricsChart';

export const metadata: Metadata = {
  title: 'System Monitoring | blipee OS',
  description: 'Real-time system monitoring and performance metrics',
};

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-black">
      <PerformanceDashboard />

      {/* Real-time metrics charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <RealtimeMetrics
          endpoint="/api/monitoring/metrics/cpu"
          title="CPU Usage"
          metric="value"
          type="area"
          color="#8b5cf6"
          unit="%"
        />

        <RealtimeMetrics
          endpoint="/api/monitoring/metrics/memory"
          title="Memory Usage"
          metric="value"
          type="area"
          color="#3b82f6"
          unit="%"
        />

        <RealtimeMetrics
          endpoint="/api/monitoring/metrics/requests"
          title="Request Rate"
          metric="value"
          type="line"
          color="#10b981"
          unit=" req/s"
        />

        <RealtimeMetrics
          endpoint="/api/monitoring/metrics/response-time"
          title="Response Time"
          metric="value"
          type="bar"
          color="#f59e0b"
          unit=" ms"
        />

        <RealtimeMetrics
          endpoint="/api/monitoring/metrics/errors"
          title="Error Rate"
          metric="value"
          type="line"
          color="#ef4444"
          unit="%"
        />

        <RealtimeMetrics
          endpoint="/api/monitoring/metrics/cache-hits"
          title="Cache Hit Rate"
          metric="value"
          type="area"
          color="#06b6d4"
          unit="%"
        />
      </div>
    </div>
  );
}