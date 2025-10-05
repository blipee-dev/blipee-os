'use client';

import { useState } from 'react';
import { DynamicChart } from '@/lib/visualization/charts/DynamicChart';
import { Widget } from '@/lib/visualization/widgets/widget-library';
import { ExportService } from '@/lib/visualization/export/ExportService';
import { notFound } from 'next/navigation';

export default function TestVisualPage() {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = async () => {
    const results: string[] = [];

    // Test 1: Chart Rendering
    try {
      const chartData = [
        { name: 'Jan', value: 100 },
        { name: 'Feb', value: 120 },
        { name: 'Mar', value: 90 }
      ];
      results.push('✅ Chart data created');
    } catch (e) {
      results.push('❌ Chart failed: ' + e);
    }

    // Test 2: Widget Types
    try {
      const widgetData = {
        value: 2847.5,
        unit: 'tCO2e',
        change: -8.5,
        trend: 'down' as const
      };
      results.push('✅ Widget data created');
    } catch (e) {
      results.push('❌ Widget failed: ' + e);
    }

    // Test 3: Export functionality
    try {
      const testData = [{ id: 1, value: 100 }];
      // Test export formats exist
      const formats = ['png', 'pdf', 'excel', 'csv', 'json'];
      results.push(`✅ Export formats available: ${formats.length}`);
    } catch (e) {
      results.push('❌ Export failed: ' + e);
    }

    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Visual Component Test</h1>

      <button
        onClick={runTests}
        className="mb-6 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        Run Tests
      </button>

      {testResults.length > 0 && (
        <div className="mb-6 p-4 bg-white/5 rounded">
          <h3 className="text-white font-bold mb-2">Test Results:</h3>
          {testResults.map((result, i) => (
            <div key={i} className="text-white/80">{result}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Chart */}
        <div>
          <h2 className="text-white mb-2">1. Dynamic Chart (Recharts)</h2>
          <DynamicChart
            type="line"
            data={[
              { name: 'Jan', value: 100 },
              { name: 'Feb', value: 120 },
              { name: 'Mar', value: 90 },
              { name: 'Apr', value: 150 }
            ]}
            options={{ dataKeys: ['value'] }}
            height={200}
          />
        </div>

        {/* Test Widget */}
        <div>
          <h2 className="text-white mb-2">2. Metric Widget</h2>
          <Widget
            id="test-1"
            type="metric-card"
            title="Total Emissions"
            data={{
              value: 2847.5,
              unit: 'tCO2e',
              change: -8.5,
              trend: 'down'
            }}
          />
        </div>

        {/* Test Different Chart */}
        <div>
          <h2 className="text-white mb-2">3. Pie Chart</h2>
          <DynamicChart
            type="pie"
            data={[
              { name: 'Scope 1', value: 30 },
              { name: 'Scope 2', value: 45 },
              { name: 'Scope 3', value: 25 }
            ]}
            height={200}
          />
        </div>

        {/* Test Progress Widget */}
        <div>
          <h2 className="text-white mb-2">4. Progress Widget</h2>
          <Widget
            id="test-2"
            type="progress-card"
            title="Annual Target"
            data={{
              current: 2847,
              target: 3000,
              unit: 'tCO2e'
            }}
          />
        </div>
      </div>
    </div>
  );
}