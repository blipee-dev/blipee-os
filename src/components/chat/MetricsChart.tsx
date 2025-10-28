'use client';

import { memo } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export type ChartData = {
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'stackedBar';
  labels: string[];
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
  values?: number[]; // For pie/doughnut
  colors?: string[]; // For pie/doughnut
  unit: string;
  title?: string;
  trend?: 'increasing' | 'stable' | 'decreasing';
  percentageChange?: number;
  total?: number;
};

const MetricsChartComponent = ({ data }: { data: ChartData }) => {
  // Safety check - return error message if data is invalid
  if (!data.datasets && !data.values) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 md:p-6">
        <p className="text-red-700">Unable to load chart data. Please try again.</p>
      </div>
    );
  }

  // Prepare chart data based on type
  const chartData = data.chartType === 'pie' || data.chartType === 'doughnut'
    ? {
        labels: data.labels,
        datasets: [{
          data: data.values!,
          backgroundColor: data.colors || [
            '#22c55e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'
          ],
          borderWidth: 3,
          borderColor: '#ffffff',
        }]
      }
    : {
        labels: data.labels,
        datasets: (data.datasets || []).map(ds => ({
          ...ds,
          tension: data.chartType === 'line' ? 0.4 : undefined,
          borderWidth: 2,
        }))
      };

  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: data.chartType === 'doughnut' ? '70%' : undefined, // Larger inner radius for doughnut
    radius: data.chartType === 'doughnut' ? '80%' : undefined, // Smaller overall size for doughnut
    plugins: {
      legend: {
        display: false, // Hide legend - we have custom legend below
      },
      title: {
        display: false, // Hide title - we have title in card header
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            label += value.toLocaleString();
            label += ` ${data.unit}`;

            // Add percentage for pie/doughnut
            if (data.chartType === 'pie' || data.chartType === 'doughnut') {
              const total = data.values!.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              label += ` (${percentage}%)`;
            }

            return label;
          }
        }
      }
    },
    scales: data.chartType !== 'pie' && data.chartType !== 'doughnut' ? {
      y: {
        beginAtZero: true,
        stacked: data.chartType === 'stackedBar',
        title: {
          display: true,
          text: data.unit,
          color: '#374151',
          font: {
            size: 12,
            weight: '500',
            family: 'system-ui, -apple-system, sans-serif',
          }
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            family: 'system-ui, -apple-system, sans-serif',
          },
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false,
        }
      },
      x: {
        stacked: data.chartType === 'stackedBar',
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            family: 'system-ui, -apple-system, sans-serif',
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false,
        }
      }
    } : undefined,
  };

  // Render appropriate chart type
  const ChartComponent =
    data.chartType === 'line' ? Line :
    data.chartType === 'bar' || data.chartType === 'stackedBar' ? Bar :
    data.chartType === 'pie' ? Pie :
    data.chartType === 'doughnut' ? Doughnut :
    Bar; // fallback

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
      {/* Header with metrics */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          {data.title || 'Metrics Visualization'}
        </h3>

        {/* Show trend badge for time-series */}
        {data.trend && data.percentageChange !== undefined && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            data.trend === 'decreasing' ? 'bg-green-50 text-green-700 border border-green-200' :
            data.trend === 'increasing' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-gray-50 text-gray-700 border border-gray-200'
          }`}>
            <span className="text-base">
              {data.trend === 'decreasing' && '↓'}
              {data.trend === 'increasing' && '↑'}
              {data.trend === 'stable' && '→'}
            </span>
            {Math.abs(data.percentageChange).toFixed(1)}%
          </div>
        )}

        {/* Show total for pie/doughnut */}
        {data.total !== undefined && (
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{data.total.toLocaleString()} {data.unit}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[280px] md:h-[320px]">
        <ChartComponent data={chartData} options={options} />
      </div>

      {/* Legend for pie/doughnut charts with values */}
      {(data.chartType === 'pie' || data.chartType === 'doughnut') && data.values && (
        <div className="mt-3 space-y-1.5">
          {data.labels.map((label, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: data.colors?.[idx] || '#3b82f6' }}
                />
                <span className="text-xs text-gray-700 leading-tight">{label}</span>
              </div>
              <span className="font-semibold whitespace-nowrap text-xs text-gray-900">
                {data.values[idx].toLocaleString()} {data.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders during streaming
export const MetricsChart = memo(MetricsChartComponent);
