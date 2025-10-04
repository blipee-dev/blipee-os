'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Shield,
  Target,
  ThermometerSun,
  DollarSign,
  ChevronRight,
  Info,
  CheckCircle2,
  Cloud
} from 'lucide-react';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface TCFDData {
  reporting_year: number;

  // Governance (Pillar 1)
  governance: {
    board_oversight: {
      frequency: string;
      committee: string;
      responsibilities: string[];
    };
    management_role: {
      positions: Array<{ title: string; responsibilities: string }>;
      integration: string;
    };
  };

  // Strategy (Pillar 2)
  strategy: {
    physical_risks: Array<{
      risk: string;
      timeframe: 'short' | 'medium' | 'long';
      impact_level: 'low' | 'medium' | 'high';
      description: string;
    }>;
    transition_risks: Array<{
      risk: string;
      type: 'policy' | 'technology' | 'market' | 'reputation';
      timeframe: 'short' | 'medium' | 'long';
      impact_level: 'low' | 'medium' | 'high';
      description: string;
    }>;
    opportunities: Array<{
      opportunity: string;
      type: string;
      impact: string;
    }>;
    scenario_analysis: {
      scenarios_used: string[];
      methodology: string;
      findings: string;
    };
  };

  // Risk Management (Pillar 3)
  risk_management: {
    identification_process: string;
    assessment_process: string;
    integration_with_erm: string;
    tools_used: string[];
  };

  // Metrics & Targets (Pillar 4)
  metrics: {
    ghg_emissions: {
      scope_1: number;
      scope_2: number;
      scope_3: number;
    };
    climate_related_metrics: Array<{
      metric: string;
      value: number;
      unit: string;
      trend: number;
    }>;
    remuneration_link: string;
  };
}

interface TCFDDisclosuresProps {
  data: TCFDData;
}

export function TCFDDisclosures({ data }: TCFDDisclosuresProps) {
  const [activePillar, setActivePillar] = useState<string>('governance');

  const pillars = [
    { id: 'governance', label: 'Governance', icon: Users, color: complianceColors.primary[600] },
    { id: 'strategy', label: 'Strategy', icon: TrendingUp, color: complianceColors.green[600] },
    { id: 'risk', label: 'Risk Management', icon: AlertTriangle, color: complianceColors.amber[600] },
    { id: 'metrics', label: 'Metrics & Targets', icon: BarChart3, color: complianceColors.teal[600] }
  ];

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return { bg: complianceColors.red[100], text: complianceColors.red[700], border: complianceColors.red[200] };
      case 'medium': return { bg: complianceColors.amber[100], text: complianceColors.amber[700], border: complianceColors.amber[200] };
      case 'low': return { bg: complianceColors.green[100], text: complianceColors.green[700], border: complianceColors.green[200] };
      default: return { bg: complianceColors.light.gray100, text: complianceColors.light.gray700, border: complianceColors.light.gray300 };
    }
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case 'short': return '0-3 years';
      case 'medium': return '3-10 years';
      case 'long': return '10+ years';
      default: return timeframe;
    }
  };

  const renderContent = () => {
    switch (activePillar) {
      case 'governance':
        return (
          <div className="space-y-6">
            {/* Board Oversight */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Board Oversight</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">TCFD Governance Recommendation (a)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Review Frequency</p>
                    <p className="font-medium text-gray-900 dark:text-white">{data.governance.board_oversight.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Responsible Committee</p>
                    <p className="font-medium text-gray-900 dark:text-white">{data.governance.board_oversight.committee}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Board Responsibilities:</p>
                  <ul className="space-y-2">
                    {data.governance.board_oversight.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Management Role */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Management's Role</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">TCFD Governance Recommendation (b)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Key Positions:</p>
                  <div className="space-y-2">
                    {data.governance.management_role.positions.map((pos, i) => (
                      <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white">{pos.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{pos.responsibilities}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Integration with Business Strategy:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{data.governance.management_role.integration}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'strategy':
        return (
          <div className="space-y-6">
            {/* Physical Risks */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ThermometerSun className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Physical Climate Risks</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Acute and chronic physical risks from climate change
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.strategy.physical_risks.map((risk, i) => {
                  const impactStyle = getImpactColor(risk.impact_level);
                  return (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{risk.risk}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.description}</p>
                        </div>
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded ml-3"
                          style={{ backgroundColor: impactStyle.bg, color: impactStyle.text }}
                        >
                          {risk.impact_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          {getTimeframeLabel(risk.timeframe)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Transition Risks */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Transition Risks</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Policy, technology, market, and reputation risks
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.strategy.transition_risks.map((risk, i) => {
                  const impactStyle = getImpactColor(risk.impact_level);
                  return (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">{risk.risk}</p>
                            <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded">
                              {risk.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{risk.description}</p>
                        </div>
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded ml-3"
                          style={{ backgroundColor: impactStyle.bg, color: impactStyle.text }}
                        >
                          {risk.impact_level.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          {getTimeframeLabel(risk.timeframe)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Climate-Related Opportunities</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Strategic opportunities from climate action
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.strategy.opportunities.map((opp, i) => (
                  <div key={i} className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">{opp.opportunity}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{opp.impact}</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-green-600 text-white rounded ml-3">
                        {opp.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario Analysis */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Climate Scenario Analysis</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">TCFD Strategy Recommendation (c)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Scenarios Analyzed:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.strategy.scenario_analysis.scenarios_used.map((scenario, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
                        {scenario}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Methodology:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{data.strategy.scenario_analysis.methodology}</p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Key Findings:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">{data.strategy.scenario_analysis.findings}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Risk Identification & Assessment</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">TCFD Risk Management Recommendations</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Identification Process:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    {data.risk_management.identification_process}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Assessment Process:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    {data.risk_management.assessment_process}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Integration with Enterprise Risk Management:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    {data.risk_management.integration_with_erm}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tools & Frameworks Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.risk_management.tools_used.map((tool, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'metrics':
        return (
          <div className="space-y-6">
            {/* GHG Emissions */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">GHG Emissions</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">TCFD Metrics Recommendation (a)</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Scope 1</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {data.metrics.ghg_emissions.scope_1.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">tCO₂e</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Scope 2</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {data.metrics.ghg_emissions.scope_2.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">tCO₂e</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Scope 3</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {data.metrics.ghg_emissions.scope_3.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">tCO₂e</p>
                </div>
              </div>
            </div>

            {/* Climate Metrics */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Additional Climate-Related Metrics</h4>
              <div className="space-y-3">
                {data.metrics.climate_related_metrics.map((metric, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{metric.metric}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Unit: {metric.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{metric.value.toLocaleString()}</p>
                      <div className="flex items-center gap-1 justify-end">
                        {metric.trend < 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-xs ${metric.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(metric.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Remuneration */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Executive Remuneration Link</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">TCFD Metrics Recommendation (c)</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                {data.metrics.remuneration_link}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            TCFD Climate-Related Financial Disclosures
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Task Force on Climate-related Financial Disclosures • {data.reporting_year}
          </p>
        </div>
        <div className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
          <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">
            TCFD Aligned
          </span>
        </div>
      </div>

      {/* 4 Pillar Navigation */}
      <div className="grid grid-cols-4 gap-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const isActive = activePillar === pillar.id;
          return (
            <button
              key={pillar.id}
              onClick={() => setActivePillar(pillar.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-current shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={{ borderColor: isActive ? pillar.color : undefined }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Icon
                  className="w-8 h-8"
                  style={{ color: isActive ? pillar.color : undefined }}
                />
                <span
                  className={`font-semibold text-sm ${
                    isActive ? '' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ color: isActive ? pillar.color : undefined }}
                >
                  {pillar.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pillar Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePillar}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* TCFD Framework Info */}
      <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-teal-900 dark:text-teal-300 text-sm mb-2">
              About TCFD Framework
            </p>
            <p className="text-xs text-teal-700 dark:text-teal-400">
              The TCFD framework provides 11 recommendations across 4 thematic pillars (Governance, Strategy,
              Risk Management, and Metrics & Targets) to help organizations disclose climate-related financial
              information to investors, lenders, and insurance underwriters. Aligned with IFRS S2 Climate-related Disclosures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
