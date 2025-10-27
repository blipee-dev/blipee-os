'use client';

/**
 * Carbon Emissions Visualization Component
 *
 * Displays carbon footprint data with:
 * - Scope breakdown (1, 2, 3)
 * - Trend over time
 * - Interactive charts
 */

import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CarbonEmissionsData {
  totalEmissions: number;
  scope1?: number;
  scope2?: number;
  scope3?: number;
  breakdown?: any;
  trend?: {
    change: number;
    direction: 'up' | 'down' | 'stable';
  };
  period?: string;
}

interface CarbonEmissionsChartProps {
  data: CarbonEmissionsData;
}

const COLORS = {
  scope1: '#ef4444', // red-500
  scope2: '#f97316', // orange-500
  scope3: '#eab308', // yellow-500
};

export function CarbonEmissionsChart({ data }: CarbonEmissionsChartProps) {
  // Prepare data for charts
  const scopeData = [
    {
      name: 'Scope 1',
      value: data.scope1 || data.breakdown?.scope1 || 0,
      description: 'Direct emissions'
    },
    {
      name: 'Scope 2',
      value: data.scope2 || data.breakdown?.scope2 || 0,
      description: 'Indirect energy emissions'
    },
    {
      name: 'Scope 3',
      value: data.scope3 || data.breakdown?.scope3 || 0,
      description: 'Value chain emissions'
    }
  ].filter(item => item.value > 0);

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Render trend indicator
  const renderTrend = () => {
    if (!data.trend) return null;

    const Icon = data.trend.direction === 'up'
      ? TrendingUp
      : data.trend.direction === 'down'
      ? TrendingDown
      : Minus;

    const color = data.trend.direction === 'up'
      ? 'text-red-500'
      : data.trend.direction === 'down'
      ? 'text-green-500'
      : 'text-gray-500';

    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <Icon className="w-4 h-4" />
        <span>{Math.abs(data.trend.change)}%</span>
      </div>
    );
  };

  return (
    <Card className="p-6 my-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Carbon Emissions Analysis</h3>
          {data.period && (
            <p className="text-sm text-muted-foreground">Period: {data.period}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatNumber(data.totalEmissions)}</div>
          <div className="text-sm text-muted-foreground">tCO2e</div>
          {renderTrend()}
        </div>
      </div>

      {/* Charts */}
      {scopeData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Emissions by Scope</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scopeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => `${formatNumber(value)} tCO2e`}
                />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={scopeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(COLORS)[index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${formatNumber(value)} tCO2e`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Scope Details */}
      <div className="mt-6 space-y-2">
        {scopeData.map((scope, index) => (
          <div
            key={scope.name}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: Object.values(COLORS)[index] }}
              />
              <div>
                <div className="font-medium text-sm">{scope.name}</div>
                <div className="text-xs text-muted-foreground">{scope.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatNumber(scope.value)}</div>
              <div className="text-xs text-muted-foreground">tCO2e</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
