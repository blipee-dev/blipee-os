'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Minus,
  Equal,
  Info,
  AlertCircle,
  Leaf,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface GrossVsNetData {
  // Gross emissions (ESRS requirement: report gross separately)
  scope_1_gross: number;
  scope_2_gross: number;
  scope_3_gross: number;
  total_gross: number;

  // Removals (nature-based and technological)
  removals: {
    nature_based: number;
    technological: number;
    total: number;
    projects: Array<{
      name: string;
      type: 'nature_based' | 'technological';
      amount: number;
      certification: string;
    }>;
  };

  // Carbon credits (purchased offsets)
  credits: {
    purchased_offsets: number;
    certification_standards: string[];
    vintage_year: number;
    retirement_date?: string;
    projects: Array<{
      name: string;
      amount: number;
      standard: string;
      project_type: string;
    }>;
  };

  // Net emissions (for reference only - not for official ESRS reporting)
  net_emissions: number;
}

interface GrossVsNetEmissionsProps {
  data: GrossVsNetData;
  reportingYear: number;
}

export function GrossVsNetEmissions({ data, reportingYear }: GrossVsNetEmissionsProps) {
  const chartData = [
    {
      category: 'Gross Emissions',
      value: data.total_gross,
      color: complianceColors.red[600],
      type: 'emission'
    },
    {
      category: 'Removals',
      value: -data.removals.total,
      color: complianceColors.green[600],
      type: 'removal'
    },
    {
      category: 'Credits',
      value: -data.credits.purchased_offsets,
      color: complianceColors.teal[600],
      type: 'credit'
    },
    {
      category: 'Net Position',
      value: data.net_emissions,
      color: data.net_emissions > 0 ? complianceColors.amber[600] : complianceColors.green[700],
      type: 'net'
    }
  ];

  return (
    <div className="space-y-6">
      {/* ESRS Compliance Warning */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
              ESRS E1-6 & E1-7 Compliance Requirement
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-semibold">Gross emissions must be reported separately</span> from removals
              and carbon credits. GHG removals and credits <span className="font-semibold">cannot be netted</span> against
              gross emissions in E1-6. This separation ensures transparency and prevents greenwashing.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gross Emissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111827] border-2 border-red-500 dark:border-red-400 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 rotate-180" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Gross Emissions</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">E1-6</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {data.total_gross.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">tCO₂e</p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scope 1:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.scope_1_gross.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scope 2:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.scope_2_gross.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scope 3:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.scope_3_gross.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Removals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#111827] border-2 border-green-500 dark:border-green-400 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Removals</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">E1-7</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data.removals.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">tCO₂e removed</p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nature-based:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.removals.nature_based.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Technological:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.removals.technological.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Projects:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.removals.projects.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Carbon Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] border-2 border-teal-500 dark:border-teal-400 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
              <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Carbon Credits</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">E1-7</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {data.credits.purchased_offsets.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">tCO₂e offset</p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Vintage:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.credits.vintage_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Projects:</span>
              <span className="font-medium text-gray-900 dark:text-white">{data.credits.projects.length}</span>
            </div>
            {data.credits.retirement_date && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Retired:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(data.credits.retirement_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Net Position (informational only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`border-2 rounded-xl p-5 shadow-sm ${
            data.net_emissions > 0
              ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 dark:border-amber-400'
              : 'bg-green-50 dark:bg-green-900/10 border-green-500 dark:border-green-400'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${
              data.net_emissions > 0
                ? 'bg-amber-100 dark:bg-amber-900/20'
                : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              <Equal className={`w-5 h-5 ${
                data.net_emissions > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Net Position</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Informational</p>
            </div>
          </div>
          <p className={`text-3xl font-bold ${
            data.net_emissions > 0
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {data.net_emissions.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">tCO₂e net</p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {data.net_emissions > 0 ? 'Emissions exceed removals' : 'Net zero achieved'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Waterfall Chart */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Emissions Accounting Waterfall
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gross emissions → Removals → Credits → Net position
          </p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis
              dataKey="category"
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              label={{
                value: 'tCO₂e',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#64748B', fontSize: 12 }
              }}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                `${Math.abs(value).toLocaleString()} tCO₂e`,
                name === 'value' ? 'Amount' : name
              ]}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <ReferenceLine y={0} stroke="#64748B" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[8, 8, 8, 8]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Removal Projects */}
        {data.removals.projects.length > 0 && (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-500" />
              Removal Projects
            </h4>
            <div className="space-y-3">
              {data.removals.projects.map((project, i) => (
                <div key={i} className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{project.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {project.type === 'nature_based' ? '🌳 Nature-based' : '⚙️ Technological'}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded">
                      {project.amount.toLocaleString()} tCO₂e
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Certified: {project.certification}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carbon Credit Projects */}
        {data.credits.projects.length > 0 && (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-500" />
              Carbon Credit Projects
            </h4>
            <div className="space-y-3">
              {data.credits.projects.map((project, i) => (
                <div key={i} className="p-3 bg-teal-50 dark:bg-teal-900/10 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{project.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{project.project_type}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-teal-600 text-white rounded">
                      {project.amount.toLocaleString()} tCO₂e
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Standard: {project.standard}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Methodology Note */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
              Reporting Methodology ({reportingYear})
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                • <span className="font-semibold">Gross emissions (E1-6):</span> Reported as required without
                netting removals or credits
              </li>
              <li>
                • <span className="font-semibold">Removals (E1-7):</span> GHG removals and storage separately
                disclosed, including both nature-based solutions and technological removals
              </li>
              <li>
                • <span className="font-semibold">Credits (E1-7):</span> Carbon credits from certified projects
                (VCS, Gold Standard, etc.) separately disclosed with vintage and retirement information
              </li>
              <li>
                • <span className="font-semibold">Net position:</span> Calculated for internal management only,
                not used for official ESRS E1-6 disclosure
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
