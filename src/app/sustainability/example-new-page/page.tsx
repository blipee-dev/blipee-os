'use client';

/**
 * Example New Page - Demonstrates the blipee OS Design System
 *
 * This is a template showing how to create a new sustainability page
 * using the design system components. Copy this file and modify it
 * to create your own pages with consistent styling.
 *
 * See DESIGN_SYSTEM.md for full documentation.
 */

import { useState, useEffect } from 'react';
import { Leaf, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  PageLayout,
  Section,
  MetricGrid,
  ChartGrid,
  MetricCard,
  ChartCard,
  StatCard,
  designTokens,
  getCategoryColor,
} from '@/components/design-system';

// Example data (replace with real API calls)
const generateExampleData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    value: Math.random() * 100 + 50,
    scope1: Math.random() * 30 + 10,
    scope2: Math.random() * 40 + 20,
    scope3: Math.random() * 30 + 10,
  }));
};

const scopeData = [
  { name: 'Scope 1', value: 456, color: designTokens.colors.scope.scope1 },
  { name: 'Scope 2', value: 1234, color: designTokens.colors.scope.scope2 },
  { name: 'Scope 3', value: 766, color: designTokens.colors.scope.scope3 },
];

export default function ExampleNewPage() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMonthlyData(generateExampleData());
      setLoading(false);
    }, 500);
  }, []);

  return (
    <PageLayout
      title="Example Dashboard"
      description="GRI Standards • Design System Demo"
      icon={Leaf}
      showFilters={true}
    >
      {({ organizationId, selectedSite, selectedPeriod }) => (
        <>
          {/* Executive Summary Metrics */}
          <Section>
            <MetricGrid columns={4}>
              <MetricCard
                title="Total Impact"
                value={2456.8}
                unit="tCO2e"
                icon={Leaf}
                iconColor={designTokens.colors.category.electricity}
                trend={{
                  value: -12.3,
                  label: 'YoY',
                }}
                tooltip="Total environmental impact across all categories"
              />

              <MetricCard
                title="Scope 1 Emissions"
                value={456.2}
                unit="tCO2e"
                icon={Leaf}
                iconColor={designTokens.colors.scope.scope1}
                trend={{
                  value: -8.1,
                  label: 'YoY',
                }}
                tooltip="Direct emissions from owned or controlled sources"
              />

              <MetricCard
                title="Scope 2 Emissions"
                value={1234.5}
                unit="tCO2e"
                icon={Leaf}
                iconColor={designTokens.colors.scope.scope2}
                trend={{
                  value: -15.2,
                  label: 'YoY',
                }}
                subtitle="Projected: 1500 tCO2e"
                tooltip="Indirect emissions from purchased electricity, steam, heating and cooling"
              />

              <MetricCard
                title="Scope 3 Emissions"
                value={766.1}
                unit="tCO2e"
                icon={Leaf}
                iconColor={designTokens.colors.scope.scope3}
                trend={{
                  value: -9.8,
                  label: 'YoY',
                }}
                tooltip="All other indirect emissions in the value chain"
              />
            </MetricGrid>
          </Section>

          {/* Charts Section */}
          <Section>
            <ChartGrid columns={2}>
              {/* Trend Chart */}
              <ChartCard
                title="Monthly Trend"
                icon={TrendingUp}
                iconColor="#8B5CF6"
                tooltip="Historical data showing monthly trends with year-over-year comparison"
                badges={[
                  { label: 'TCFD', type: 'tcfd' },
                  { label: 'ESRS E1', type: 'esrs' },
                ]}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-[320px]">
                    <div className={designTokens.loading.spinner} />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '10px' }}
                        label={{
                          value: 'tCO2e',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fill: '#9CA3AF', fontSize: '10px' },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={designTokens.colors.charts.total}
                        strokeWidth={2.5}
                        name="Total"
                        dot={{ r: 4, fill: designTokens.colors.charts.total }}
                      />
                      <Line
                        type="monotone"
                        dataKey="scope1"
                        stroke={designTokens.colors.scope.scope1}
                        strokeWidth={2}
                        name="Scope 1"
                        dot={{ r: 3, fill: designTokens.colors.scope.scope1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="scope2"
                        stroke={designTokens.colors.scope.scope2}
                        strokeWidth={2}
                        name="Scope 2"
                        dot={{ r: 3, fill: designTokens.colors.scope.scope2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Pie Chart */}
              <ChartCard
                title="Scope Breakdown"
                icon={PieChartIcon}
                iconColor="#3B82F6"
                tooltip="Distribution of emissions across different scopes"
                badges={[
                  { label: 'GHG Protocol', type: 'ghg' },
                  { label: 'GRI 305', type: 'gri' },
                ]}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={scopeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={true}
                    >
                      {scopeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </ChartGrid>
          </Section>

          {/* Additional Information Section */}
          <Section>
            <ChartGrid columns={2}>
              <StatCard title="Data Quality" icon={Leaf} iconColor="#10B981">
                <div className="space-y-3">
                  <div>
                    <div className={designTokens.typography.label}>Primary Data</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      85%
                    </div>
                  </div>
                  <div>
                    <div className={designTokens.typography.label}>
                      Verification Status
                    </div>
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      Third-party verified
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: '85%' }}
                    />
                  </div>
                </div>
              </StatCard>

              <StatCard title="Key Insights" icon={TrendingUp} iconColor="#F59E0B">
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
                    <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                      On Track
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      15% reduction achieved vs. target of 12%
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                      Opportunity
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Switch to renewable energy could reduce Scope 2 by 40%
                    </div>
                  </div>
                </div>
              </StatCard>
            </ChartGrid>
          </Section>
        </>
      )}
    </PageLayout>
  );
}
