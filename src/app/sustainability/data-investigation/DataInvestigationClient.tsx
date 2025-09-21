'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useTranslations } from '@/providers/LanguageProvider';
import toast from 'react-hot-toast';

interface MetricData {
  id: string;
  metric_id: string;
  organization_id: string;
  site_id: string;
  value: number;
  unit: string;
  period_start: string;
  period_end: string;
  co2e_emissions: number;
  created_at: string;
  metrics_catalog: {
    name: string;
    code: string;
    category: string;
    subcategory: string;
    scope: string;
    emission_factor: number;
    emission_factor_unit: string;
  };
  site: {
    name: string;
  };
}

interface GroupedData {
  [metricName: string]: {
    [yearMonth: string]: {
      totalValue: number;
      totalEmissions: number;
      unit: string;
      entries: MetricData[];
    };
  };
}

interface DataAnomaly {
  type: 'duplicate' | 'missing';
  metric: string;
  month: string;
  year: number;
  details?: string;
}

export default function DataInvestigationPage() {
  useAuthRedirect('/sustainability/data-investigation');
  const { user } = useAuth();
  const t = useTranslations('settings.sustainability');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricData[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedData>({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSite, setSelectedSite] = useState('all');
  const [sites, setSites] = useState<any[]>([]);
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  const [dataAnomalies, setDataAnomalies] = useState<DataAnomaly[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedYear, selectedSite]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sites first
      const sitesRes = await fetch('/api/sites');
      const sitesData = await sitesRes.json();
      setSites(sitesData.sites || []);

      // Fetch detailed metrics data
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const res = await fetch(`/api/sustainability/metrics-investigation?startDate=${startDate}&endDate=${endDate}&site=${selectedSite}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await res.json();
      setData(result.data || []);
      
      // Group data by metric and month
      const grouped = groupDataByMetricAndMonth(result.data || []);
      setGroupedData(grouped);
      
      // Detect anomalies
      const anomalies = detectDataAnomalies(grouped, selectedYear);
      setDataAnomalies(anomalies);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  };

  const groupDataByMetricAndMonth = (data: MetricData[]): GroupedData => {
    const grouped: GroupedData = {};

    data.forEach(item => {
      const metricName = item.metrics_catalog?.name || 'Unknown';
      const date = new Date(item.period_start);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[metricName]) {
        grouped[metricName] = {};
      }

      if (!grouped[metricName][yearMonth]) {
        grouped[metricName][yearMonth] = {
          totalValue: 0,
          totalEmissions: 0,
          unit: item.unit,
          entries: []
        };
      }

      grouped[metricName][yearMonth].totalValue += item.value || 0;
      grouped[metricName][yearMonth].totalEmissions += item.co2e_emissions || 0;
      grouped[metricName][yearMonth].entries.push(item);
    });

    return grouped;
  };

  const detectDataAnomalies = (grouped: GroupedData, year: number): DataAnomaly[] => {
    const anomalies: DataAnomaly[] = [];
    const monthsSet = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);

    Object.entries(grouped).forEach(([metricName, monthlyData]) => {
      const monthCounts: { [month: string]: number } = {};
      
      // Count entries per month
      monthsSet.forEach(month => {
        const monthKey = `${year}-${month}`;
        monthCounts[month] = monthlyData[monthKey]?.entries.length || 0;
      });

      // Check for duplicates (more than 1 entry per month)
      Object.entries(monthCounts).forEach(([month, count]) => {
        if (count > 1) {
          anomalies.push({
            type: 'duplicate',
            metric: metricName,
            month: months[parseInt(month) - 1],
            year,
            details: `${count} entries found`
          });
        }
      });

      // Check for missing months (0 entries)
      Object.entries(monthCounts).forEach(([month, count]) => {
        if (count === 0) {
          // Only flag as anomaly if other months have data
          const hasOtherData = Object.values(monthCounts).some(c => c > 0);
          if (hasOtherData) {
            anomalies.push({
              type: 'missing',
              metric: metricName,
              month: months[parseInt(month) - 1],
              year,
              details: 'No data recorded'
            });
          }
        }
      });
    });

    return anomalies;
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const toggleMetricExpansion = (metricName: string) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(metricName)) {
      newExpanded.delete(metricName);
    } else {
      newExpanded.add(metricName);
    }
    setExpandedMetrics(newExpanded);
  };

  const toggleEntryExpansion = (key: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedEntries(newExpanded);
  };

  const exportToCSV = () => {
    let csv = 'Metric,Month,Year,Total Value,Unit,Total Emissions (kgCO2e),Number of Entries\n';
    
    Object.entries(groupedData).forEach(([metricName, monthlyData]) => {
      Object.entries(monthlyData).forEach(([yearMonth, data]) => {
        const [year, month] = yearMonth.split('-');
        csv += `"${metricName}",${months[parseInt(month) - 1]},${year},${data.totalValue},${data.unit},${data.totalEmissions},${data.entries.length}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sustainability-data-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <SustainabilityLayout selectedView="data-investigation" onSelectView={() => {}}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin accent-text" />
        </div>
      </SustainabilityLayout>
    );
  }

  return (
    <SustainabilityLayout selectedView="data-investigation" onSelectView={() => {}}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Investigation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Detailed monthly breakdown of all sustainability metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 accent-ring cursor-pointer"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Site Selector */}
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 accent-ring cursor-pointer"
            >
              <option value="all">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Data Quality Alert */}
        {dataAnomalies.length > 0 && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Data Quality Issues Detected
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="mb-2">The following anomalies were found in the {selectedYear} data:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {dataAnomalies.filter(a => a.type === 'duplicate').length > 0 && (
                      <li>
                        <strong>Duplicate entries:</strong> {dataAnomalies.filter(a => a.type === 'duplicate').map((a, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            {a.metric} ({a.month} - {a.details})
                          </span>
                        ))}
                      </li>
                    )}
                    {dataAnomalies.filter(a => a.type === 'missing').length > 0 && (
                      <li>
                        <strong>Missing data:</strong> {dataAnomalies.filter(a => a.type === 'missing').slice(0, 5).map((a, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            {a.metric} ({a.month})
                          </span>
                        ))}
                        {dataAnomalies.filter(a => a.type === 'missing').length > 5 && (
                          <span> and {dataAnomalies.filter(a => a.type === 'missing').length - 5} more...</span>
                        )}
                      </li>
                    )}
                  </ul>
                  <p className="mt-2 text-xs">
                    Note: It appears that October data may have been incorrectly recorded as March, resulting in duplicate March entries and missing October data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(groupedData).map(([metricName, monthlyData]) => {
            const isExpanded = expandedMetrics.has(metricName);
            const yearTotal = Object.values(monthlyData).reduce((sum, data) => sum + data.totalValue, 0);
            const yearEmissions = Object.values(monthlyData).reduce((sum, data) => sum + data.totalEmissions, 0);
            const unit = Object.values(monthlyData)[0]?.unit || '';

            return (
              <motion.div
                key={metricName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg overflow-hidden"
              >
                {/* Metric Header */}
                <div
                  onClick={() => toggleMetricExpansion(metricName)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {metricName}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>Year Total: {yearTotal.toFixed(2)} {unit}</span>
                      <span>•</span>
                      <span>Emissions: {(yearEmissions / 1000).toFixed(2)} tCO2e</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Monthly Data Table */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-white/[0.05]">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-black/20">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Unit
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Emissions (kgCO2e)
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Entries
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date Range
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                          {months.map((month, index) => {
                            const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
                            const monthData = monthlyData[monthKey];

                            const dateRange = monthData ? 
                              `${new Date(Math.min(...monthData.entries.map(e => new Date(e.period_start).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...monthData.entries.map(e => new Date(e.period_end).getTime()))).toLocaleDateString()}` 
                              : '-';

                            const hasAnomaly = dataAnomalies.some(a => 
                              a.metric === metricName && 
                              a.month === month && 
                              a.year === selectedYear
                            );

                            const anomalyType = dataAnomalies.find(a => 
                              a.metric === metricName && 
                              a.month === month && 
                              a.year === selectedYear
                            )?.type;

                            return (
                              <React.Fragment key={month}>
                              <tr className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${
                                hasAnomaly ? (anomalyType === 'duplicate' ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-red-50 dark:bg-red-900/10') : ''
                              }`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    {month} {selectedYear}
                                    {hasAnomaly && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        anomalyType === 'duplicate' 
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' 
                                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                      }`}>
                                        {anomalyType === 'duplicate' ? 'Duplicate' : 'Missing'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                                  {monthData ? monthData.totalValue.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                                  {monthData ? monthData.unit : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                                  {monthData ? monthData.totalEmissions.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                                  {monthData && monthData.entries.length > 1 ? (
                                    <button
                                      onClick={() => toggleEntryExpansion(`${metricName}-${monthKey}`)}
                                      className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                                    >
                                      {monthData.entries.length} entries
                                      {expandedEntries.has(`${metricName}-${monthKey}`) ? ' ▼' : ' ▶'}
                                    </button>
                                  ) : (
                                    monthData ? monthData.entries.length : 0
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                                  {dateRange}
                                </td>
                              </tr>
                              {/* Expanded entries row */}
                              {expandedEntries.has(`${metricName}-${monthKey}`) && monthData && monthData.entries.length > 1 && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-black/30">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Individual Entries for {month} {selectedYear}:
                                      </h4>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                                          <thead>
                                            <tr className="text-xs text-gray-500 dark:text-gray-400">
                                              <th className="px-3 py-2 text-left">Entry ID</th>
                                              <th className="px-3 py-2 text-left">Site</th>
                                              <th className="px-3 py-2 text-right">Value</th>
                                              <th className="px-3 py-2 text-right">Unit</th>
                                              <th className="px-3 py-2 text-right">Emissions</th>
                                              <th className="px-3 py-2 text-left">Period Start</th>
                                              <th className="px-3 py-2 text-left">Period End</th>
                                              <th className="px-3 py-2 text-left">Created At</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                                            {monthData.entries.map((entry, idx) => (
                                              <tr key={idx} className="text-xs">
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-mono text-[10px]">
                                                  {entry.id.substring(0, 8)}...
                                                </td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                  {entry.site?.name || 'Unknown'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                                  {entry.value.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                                  {entry.unit}
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                                  {entry.co2e_emissions.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                  {new Date(entry.period_start).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                  {new Date(entry.period_end).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                  {new Date(entry.created_at).toLocaleDateString()}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                            );
                          })}
                          {/* Total Row */}
                          <tr className="bg-gray-50 dark:bg-black/20 font-semibold">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              Total
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {yearTotal.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {yearEmissions.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {Object.values(monthlyData).reduce((sum, data) => sum + data.entries.length, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              -
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {Object.keys(groupedData).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No data available for the selected period.</p>
            </div>
          )}
        </div>
      </main>
    </SustainabilityLayout>
  );
}