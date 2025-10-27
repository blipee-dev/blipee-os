'use client';

/**
 * Benchmark Comparison Visualization Component
 *
 * Displays performance benchmarking data with:
 * - Peer comparison charts
 * - Industry average indicators
 * - Performance metrics
 * - Ranking visualization
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Award, Target } from 'lucide-react';

interface BenchmarkMetric {
  name: string;
  yourValue: number;
  peerAverage: number;
  industryAverage: number;
  unit: string;
}

interface BenchmarkData {
  metrics?: BenchmarkMetric[];
  overallRanking?: number;
  totalPeers?: number;
  performanceCategory?: 'leader' | 'above_average' | 'average' | 'below_average';
  strengths?: string[];
  improvements?: string[];
}

interface BenchmarkComparisonProps {
  data: BenchmarkData;
}

export function BenchmarkComparison({ data }: BenchmarkComparisonProps) {
  // Get performance category config
  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'leader':
        return {
          label: 'Industry Leader',
          color: 'bg-green-500',
          icon: Award,
          textColor: 'text-green-600'
        };
      case 'above_average':
        return {
          label: 'Above Average',
          color: 'bg-blue-500',
          icon: TrendingUp,
          textColor: 'text-blue-600'
        };
      case 'average':
        return {
          label: 'Average',
          color: 'bg-yellow-500',
          icon: Target,
          textColor: 'text-yellow-600'
        };
      case 'below_average':
        return {
          label: 'Below Average',
          color: 'bg-orange-500',
          icon: Target,
          textColor: 'text-orange-600'
        };
      default:
        return {
          label: 'Not Ranked',
          color: 'bg-gray-500',
          icon: Target,
          textColor: 'text-gray-600'
        };
    }
  };

  const categoryConfig = getCategoryConfig(data.performanceCategory);
  const CategoryIcon = categoryConfig.icon;

  // Format chart data
  const chartData = data.metrics?.map(metric => ({
    name: metric.name,
    'Your Performance': metric.yourValue,
    'Peer Average': metric.peerAverage,
    'Industry Average': metric.industryAverage
  })) || [];

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <Card className="p-6 my-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Benchmark Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Performance vs peers and industry standards
          </p>
        </div>
        {data.performanceCategory && (
          <Badge className={categoryConfig.color}>
            <CategoryIcon className="w-3 h-3 mr-1" />
            {categoryConfig.label}
          </Badge>
        )}
      </div>

      {/* Ranking */}
      {data.overallRanking && data.totalPeers && (
        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">
              #{data.overallRanking}
              <span className="text-lg text-muted-foreground"> / {data.totalPeers}</span>
            </div>
            <div className="text-sm text-muted-foreground">Overall Ranking</div>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="Your Performance"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Peer Average"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Industry Average"
                fill="#6b7280"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Metrics */}
      {data.metrics && data.metrics.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium">Detailed Comparison</h4>
          {data.metrics.map((metric, index) => {
            const vsIndustry = ((metric.yourValue - metric.industryAverage) / metric.industryAverage) * 100;
            const isAboveAverage = vsIndustry > 0;

            return (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{metric.name}</div>
                  <Badge variant={isAboveAverage ? 'default' : 'secondary'}>
                    {isAboveAverage ? '+' : ''}{vsIndustry.toFixed(1)}% vs industry
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Your Performance</div>
                    <div className="font-semibold">
                      {formatNumber(metric.yourValue)} {metric.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Peer Average</div>
                    <div className="font-semibold">
                      {formatNumber(metric.peerAverage)} {metric.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Industry Average</div>
                    <div className="font-semibold">
                      {formatNumber(metric.industryAverage)} {metric.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {data.strengths && data.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Key Strengths
            </h4>
            <ul className="space-y-1.5">
              {data.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {data.improvements && data.improvements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1.5">
              {data.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
