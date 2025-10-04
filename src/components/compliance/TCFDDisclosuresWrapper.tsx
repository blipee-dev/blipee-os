'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  Shield,
  Target,
  Info,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  GovernanceForm,
  StrategyForm,
  RiskManagementForm,
  MetricsDescriptionForm
} from './TCFDForms';

interface TCFDData {
  reporting_year: number;
  governance_oversight: any;
  governance_management: any;
  strategy_risks: any;
  strategy_opportunities: any;
  strategy_scenarios: any;
  strategy_resilience: string | null;
  risk_identification: string | null;
  risk_assessment: string | null;
  risk_management_process: string | null;
  risk_integration: string | null;
  metrics: {
    scope_1_gross: number;
    scope_2_gross_lb: number;
    scope_2_gross_mb: number;
    scope_3_gross: number;
    total_gross: number;
    energy_consumption_mwh: number;
    description: string | null;
    scope123_methodology: string | null;
  };
  targets: any[] | null;
}

const pillars = [
  {
    id: 'governance',
    label: 'Governance',
    icon: Building2,
    description: 'Board oversight and management\'s role'
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: TrendingUp,
    description: 'Climate risks, opportunities, and resilience'
  },
  {
    id: 'risk',
    label: 'Risk Management',
    icon: Shield,
    description: 'How climate risks are identified and managed'
  },
  {
    id: 'metrics',
    label: 'Metrics & Targets',
    icon: Target,
    description: 'Climate performance indicators and goals'
  },
];

export function TCFDDisclosuresWrapper() {
  const [activePillar, setActivePillar] = useState('governance');
  const [data, setData] = useState<TCFDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/compliance/tcfd?year=${selectedYear}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching TCFD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPillarContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
        </div>
      );
    }

    switch (activePillar) {
      case 'governance':
        return <GovernancePillar data={data} onRefresh={fetchData} />;
      case 'strategy':
        return <StrategyPillar data={data} onRefresh={fetchData} />;
      case 'risk':
        return <RiskManagementPillar data={data} onRefresh={fetchData} />;
      case 'metrics':
        return <MetricsTargetsPillar data={data} onRefresh={fetchData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              TCFD Disclosures
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Task Force on Climate-related Financial Disclosures
            </p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>
      </div>

      {/* Pillar Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const isActive = activePillar === pillar.id;
          const hasData = data && getPillarDataStatus(data, pillar.id);

          return (
            <motion.button
              key={pillar.id}
              onClick={() => setActivePillar(pillar.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                  : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.05] hover:border-purple-300 dark:hover:border-purple-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isActive ? 'bg-white/20' : 'bg-purple-50 dark:bg-purple-900/20'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm ${
                      isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {pillar.label}
                    </h3>
                    {hasData && !isActive && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                    {!hasData && !isActive && (
                      <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" title="No data" />
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${
                    isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {pillar.description}
                  </p>
                </div>
                {isActive && (
                  <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Pillar Content */}
      <motion.div
        key={activePillar}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6"
      >
        {renderPillarContent()}
      </motion.div>
    </div>
  );
}

// Helper function to check if pillar has data
function getPillarDataStatus(data: TCFDData, pillarId: string): boolean {
  switch (pillarId) {
    case 'governance':
      return !!(data.governance_oversight || data.governance_management);
    case 'strategy':
      return !!(data.strategy_risks || data.strategy_opportunities || data.strategy_scenarios || data.strategy_resilience);
    case 'risk':
      return !!(data.risk_identification || data.risk_assessment || data.risk_management_process || data.risk_integration);
    case 'metrics':
      return !!(data.metrics.total_gross > 0 || data.targets);
    default:
      return false;
  }
}

// Governance Pillar Component
function GovernancePillar({ data, onRefresh }: { data: TCFDData; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasOversight = data.governance_oversight;
  const hasManagement = data.governance_management;

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/compliance/tcfd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reporting_year: data.reporting_year
        })
      });

      if (response.ok) {
        setShowForm(false);
        onRefresh();
      } else {
        console.error('Failed to save governance data');
      }
    } catch (error) {
      console.error('Error saving governance data:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <GovernanceForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        initialData={data}
        saving={saving}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Pillar 1: Governance
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {hasOversight || hasManagement ? 'Edit Data' : 'Add Data'}
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">TCFD Governance Recommendations</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Describe board oversight of climate-related risks and opportunities</li>
              <li>Describe management's role in assessing and managing climate issues</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Board Oversight */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Board Oversight
        </h4>
        {hasOversight ? (
          <div className="prose dark:prose-invert max-w-none">
            {typeof data.governance_oversight === 'string' ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.governance_oversight}</p>
            ) : (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(data.governance_oversight, null, 2)}</pre>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No board oversight information provided yet
          </p>
        )}
      </div>

      {/* Management Role */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Management's Role
        </h4>
        {hasManagement ? (
          <div className="prose dark:prose-invert max-w-none">
            {typeof data.governance_management === 'string' ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.governance_management}</p>
            ) : (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(data.governance_management, null, 2)}</pre>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No management role information provided yet
          </p>
        )}
      </div>
    </div>
  );
}

// Strategy Pillar Component
function StrategyPillar({ data, onRefresh }: { data: TCFDData; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/compliance/tcfd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reporting_year: data.reporting_year
        })
      });

      if (response.ok) {
        setShowForm(false);
        onRefresh();
      } else {
        console.error('Failed to save strategy data');
      }
    } catch (error) {
      console.error('Error saving strategy data:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasData = data.strategy_risks || data.strategy_opportunities || data.strategy_scenarios || data.strategy_resilience;

  return (
    <div className="space-y-6">
      <StrategyForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        initialData={data}
        saving={saving}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Pillar 2: Strategy
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {hasData ? 'Edit Data' : 'Add Data'}
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">TCFD Strategy Recommendations</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Describe climate-related risks and opportunities (short, medium, and long-term)</li>
              <li>Describe impact on business, strategy, and financial planning</li>
              <li>Describe resilience under different climate scenarios (e.g., 2°C or lower)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Climate Risks */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Climate-Related Risks
        </h4>
        {data.strategy_risks ? (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(data.strategy_risks, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No climate risks identified yet
          </p>
        )}
      </div>

      {/* Climate Opportunities */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Climate-Related Opportunities
        </h4>
        {data.strategy_opportunities ? (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(data.strategy_opportunities, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No climate opportunities identified yet
          </p>
        )}
      </div>

      {/* Scenario Analysis */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Scenario Analysis
        </h4>
        {data.strategy_scenarios ? (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(data.strategy_scenarios, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No scenario analysis conducted yet
          </p>
        )}
      </div>

      {/* Resilience Narrative */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Strategic Resilience
        </h4>
        {data.strategy_resilience ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.strategy_resilience}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No resilience narrative provided yet
          </p>
        )}
      </div>
    </div>
  );
}

// Risk Management Pillar Component
function RiskManagementPillar({ data, onRefresh }: { data: TCFDData; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/compliance/tcfd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reporting_year: data.reporting_year
        })
      });

      if (response.ok) {
        setShowForm(false);
        onRefresh();
      } else {
        console.error('Failed to save risk management data');
      }
    } catch (error) {
      console.error('Error saving risk management data:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasData = data.risk_identification || data.risk_assessment || data.risk_management_process || data.risk_integration;

  return (
    <div className="space-y-6">
      <RiskManagementForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        initialData={data}
        saving={saving}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Pillar 3: Risk Management
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {hasData ? 'Edit Data' : 'Add Data'}
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">TCFD Risk Management Recommendations</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Describe processes for identifying climate-related risks</li>
              <li>Describe processes for assessing climate-related risks</li>
              <li>Describe how climate risks are integrated into overall risk management</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Identification */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Risk Identification Process
        </h4>
        {data.risk_identification ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.risk_identification}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No risk identification process described yet
          </p>
        )}
      </div>

      {/* Risk Assessment */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Risk Assessment Process
        </h4>
        {data.risk_assessment ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.risk_assessment}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No risk assessment process described yet
          </p>
        )}
      </div>

      {/* Risk Management */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Risk Management Process
        </h4>
        {data.risk_management_process ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.risk_management_process}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No risk management process described yet
          </p>
        )}
      </div>

      {/* Integration with ERM */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Integration with Overall Risk Management
        </h4>
        {data.risk_integration ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.risk_integration}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No integration information provided yet
          </p>
        )}
      </div>
    </div>
  );
}

// Metrics & Targets Pillar Component
function MetricsTargetsPillar({ data, onRefresh }: { data: TCFDData; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/compliance/tcfd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reporting_year: data.reporting_year
        })
      });

      if (response.ok) {
        setShowForm(false);
        onRefresh();
      } else {
        console.error('Failed to save metrics description');
      }
    } catch (error) {
      console.error('Error saving metrics description:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <MetricsDescriptionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        initialData={data.metrics}
        saving={saving}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Pillar 4: Metrics & Targets
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {data.metrics.description ? 'Edit Methodology' : 'Add Methodology'}
          </button>
          <a
            href="/sustainability/targets"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Manage Targets
          </a>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">TCFD Metrics & Targets Recommendations</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Disclose Scope 1, 2, and (if appropriate) Scope 3 GHG emissions</li>
              <li>Describe climate-related risks and opportunities metrics</li>
              <li>Describe targets used and performance against targets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* GHG Emissions Metrics */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          GHG Emissions ({data.reporting_year})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 1</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.metrics.scope_1_gross.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 2 (LB)</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.metrics.scope_2_gross_lb.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 2 (MB)</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.metrics.scope_2_gross_mb.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 3</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.metrics.scope_3_gross.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Total</p>
            <p className="text-lg font-semibold text-purple-900 dark:text-purple-300">
              {data.metrics.total_gross.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">tCO₂e</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Energy</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.metrics.energy_consumption_mwh.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">MWh</p>
          </div>
        </div>

        {data.metrics.scope123_methodology && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Methodology</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {data.metrics.scope123_methodology}
            </p>
          </div>
        )}
      </div>

      {/* Climate Targets */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Climate-Related Targets
        </h4>
        {data.targets && data.targets.length > 0 ? (
          <div className="space-y-3">
            {data.targets.map((target, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">{target.name}</h5>
                    {target.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{target.description}</p>
                    )}
                  </div>
                  {target.sbti_validated && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                      SBTi
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Base Year</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{target.base_year}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Target Year</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{target.target_year}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Reduction</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {target.reduction_percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      target.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {target.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No climate targets set yet</p>
            <a
              href="/sustainability/targets"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Target
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
