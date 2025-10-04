'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  FileText,
  TrendingDown,
  Zap,
  DollarSign,
  ThermometerSun,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Edit,
  Plus
} from 'lucide-react';
import { complianceColors } from '@/styles/compliance-design-tokens';
import { TransitionPlanForm, PoliciesForm, CarbonPricingForm } from './ESRSE1Forms';

interface ESRSE1Data {
  reporting_year: number;

  // E1-1: Transition Plan
  transition_plan?: {
    decarbonization_levers: string[];
    target_alignment: string;
    resource_allocation: string;
    last_updated: string;
  };

  // E1-2: Policies
  climate_policies?: {
    policy_name: string;
    description: string;
    scope: string[];
  }[];

  // E1-3: Actions and Resources
  mitigation_actions?: {
    action: string;
    scope_coverage: string[];
    expected_reduction: number;
    status: string;
  }[];
  capex_green?: number;
  opex_green?: number;

  // E1-4: Targets
  targets?: {
    target_type: string;
    base_year: number;
    target_year: number;
    reduction_percentage: number;
    scopes_covered: string[];
    target_description: string;
  }[];

  // E1-5: Energy Consumption
  energy_consumption?: {
    total_consumption: number;
    renewable_percentage: number;
    by_source: { source: string; value: number }[];
  };

  // E1-6: Gross GHG Emissions
  scope_1_gross: number;
  scope_2_gross_lb: number;
  scope_2_gross_mb: number;
  scope_3_gross: number;
  total_gross: number;

  // E1-7: Removals and Credits
  removals_total?: number;
  credits_total?: number;

  // E1-8: Carbon Pricing
  carbon_price_used?: number;
  carbon_price_currency?: string;

  // E1-9: Financial Effects
  financial_effects?: {
    physical_risks: { risk: string; financial_impact: number }[];
    transition_risks: { risk: string; financial_impact: number }[];
    opportunities: { opportunity: string; potential_benefit: number }[];
  };
}

interface ESRSE1DisclosuresProps {
  data: ESRSE1Data;
}

export function ESRSE1Disclosures({ data }: ESRSE1DisclosuresProps) {
  const [activeTab, setActiveTab] = useState<string>('E1-1');
  const [saving, setSaving] = useState(false);
  const [showTransitionPlanForm, setShowTransitionPlanForm] = useState(false);
  const [showPoliciesForm, setShowPoliciesForm] = useState(false);
  const [showCarbonPricingForm, setShowCarbonPricingForm] = useState(false);

  const tabs = [
    { id: 'E1-1', label: 'Transition Plan', icon: Target, available: true, hasData: !!data.transition_plan },
    { id: 'E1-2', label: 'Policies', icon: FileText, available: true, hasData: !!data.climate_policies },
    { id: 'E1-3', label: 'Actions & Resources', icon: TrendingDown, available: true, hasData: !!data.mitigation_actions },
    { id: 'E1-4', label: 'Targets', icon: Target, available: true, hasData: !!data.targets },
    { id: 'E1-5', label: 'Energy', icon: Zap, available: true, hasData: !!data.energy_consumption },
    { id: 'E1-6', label: 'GHG Emissions', icon: ThermometerSun, available: true, hasData: true },
    { id: 'E1-7', label: 'Removals & Credits', icon: TrendingDown, available: true, hasData: !!(data.removals_total || data.credits_total) },
    { id: 'E1-8', label: 'Carbon Pricing', icon: DollarSign, available: true, hasData: !!data.carbon_price_used },
    { id: 'E1-9', label: 'Financial Effects', icon: AlertTriangle, available: true, hasData: !!data.financial_effects },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'E1-1':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-300 text-sm">
                    ESRS E1-1: Climate Transition Plan
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    Description of the plan to ensure business model and strategy are compatible with transition
                    to a sustainable economy and limiting global warming to 1.5°C
                  </p>
                </div>
              </div>
            </div>

            {data.transition_plan ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Decarbonization Levers</h4>
                  <div className="space-y-2">
                    {data.transition_plan.decarbonization_levers.map((lever, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{lever}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Target Alignment</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{data.transition_plan.target_alignment}</p>
                </div>

                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Resource Allocation</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{data.transition_plan.resource_allocation}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Last updated: {new Date(data.transition_plan.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-8">
                <div className="text-center space-y-4">
                  <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold mb-1">No Transition Plan Yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Define your climate transition plan including decarbonization strategy and resource allocation
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTransitionPlanForm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create Transition Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'E1-2':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                    ESRS E1-2: Climate Policies
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Description of policies related to climate change mitigation and adaptation
                  </p>
                </div>
              </div>
            </div>

            {data.climate_policies && data.climate_policies.length > 0 ? (
              data.climate_policies.map((policy, i) => (
                <div key={i} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{policy.policy_name}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{policy.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {policy.scope.map((s, j) => (
                      <span key={j} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-8">
                <div className="text-center space-y-4">
                  <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold mb-1">No Climate Policies Yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add your organization's climate-related policies to complete this disclosure
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPoliciesForm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Climate Policy
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'E1-3':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-400">CapEx (Climate)</span>
                </div>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                  €{(data.capex_green || 0).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Climate mitigation investment</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-400">OpEx (Climate)</span>
                </div>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                  €{(data.opex_green || 0).toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Operational expenses</p>
              </div>
            </div>

            {data.mitigation_actions && data.mitigation_actions.length > 0 && (
              <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Mitigation Actions</h4>
                <div className="space-y-3">
                  {data.mitigation_actions.map((action, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{action.action}</p>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          action.status === 'completed' ? 'bg-green-100 text-green-700' :
                          action.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Expected reduction: {action.expected_reduction} tCO₂e</span>
                        <div className="flex gap-1">
                          {action.scope_coverage.map((s, j) => (
                            <span key={j} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'E1-4':
        return (
          <div className="space-y-4">
            {data.targets && data.targets.length > 0 ? (
              data.targets.map((target, i) => (
                <div key={i} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{target.target_type}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{target.target_description}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg font-semibold">
                      -{target.reduction_percentage}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Base Year</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{target.base_year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Target Year</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{target.target_year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Scopes</p>
                      <div className="flex gap-1">
                        {target.scopes_covered.map((s, j) => (
                          <span key={j} className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No targets defined
              </div>
            )}
          </div>
        );

      case 'E1-5':
        return data.energy_consumption ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Energy Consumption</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {data.energy_consumption.total_consumption.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">MWh</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <p className="text-sm text-green-700 dark:text-green-400 mb-2">Renewable Energy</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                  {data.energy_consumption.renewable_percentage}%
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">of total consumption</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Energy by Source</h4>
              <div className="space-y-2">
                {data.energy_consumption.by_source.map((source, i) => {
                  const percentage = (source.value / data.energy_consumption!.total_consumption) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{source.source}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {source.value.toLocaleString()} MWh ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Energy data not available
          </div>
        );

      case 'E1-6':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">ESRS E1-6 Requirement</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Gross GHG emissions in metric tonnes of CO₂ equivalent, reported separately by Scope 1, 2, and 3.
                Scope 2 must be reported using both location-based and market-based methods.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#111827] border-2 border-blue-500 rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scope 1 Gross</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.scope_1_gross.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
              </div>

              <div className="bg-white dark:bg-[#111827] border-2 border-purple-500 rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scope 2 (LB)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.scope_2_gross_lb.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
              </div>

              <div className="bg-white dark:bg-[#111827] border-2 border-purple-500 rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scope 2 (MB)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.scope_2_gross_mb.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
              </div>

              <div className="bg-white dark:bg-[#111827] border-2 border-green-500 rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scope 3 Gross</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.scope_3_gross.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-4 md:col-span-2">
                <p className="text-xs text-white/80 mb-1">Total Gross GHG Emissions</p>
                <p className="text-3xl font-bold text-white">
                  {data.total_gross.toLocaleString()}
                </p>
                <p className="text-xs text-white/80">tCO₂e (market-based)</p>
              </div>
            </div>
          </div>
        );

      case 'E1-7':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <p className="text-sm text-green-700 dark:text-green-400 mb-2">GHG Removals</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                  {(data.removals_total || 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">tCO₂e removed</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Carbon Credits</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                  {(data.credits_total || 0).toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">tCO₂e from credits</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">ESRS Requirement</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Removals and credits must be reported separately from gross emissions and cannot be used to reduce
                gross GHG emission figures in E1-6.
              </p>
            </div>
          </div>
        );

      case 'E1-8':
        return data.carbon_price_used ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Internal Carbon Price</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {data.carbon_price_currency}{data.carbon_price_used}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">per tonne CO₂e</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-xs text-purple-700 dark:text-purple-400">
                Internal carbon pricing helps guide investment decisions and incentivize emission reductions
                across the organization.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-8">
            <div className="text-center space-y-4">
              <DollarSign className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto" />
              <div>
                <p className="text-gray-900 dark:text-white font-semibold mb-1">No Carbon Price Set</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set your internal carbon price to guide investment decisions and incentivize emission reductions
                </p>
              </div>
              <button
                onClick={() => setShowCarbonPricingForm(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Set Carbon Price
              </button>
            </div>
          </div>
        );

      case 'E1-9':
        return data.financial_effects ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Physical Risks
              </h4>
              <div className="space-y-2">
                {data.financial_effects.physical_risks.map((risk, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/10 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{risk.risk}</span>
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      €{risk.financial_impact.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Transition Risks
              </h4>
              <div className="space-y-2">
                {data.financial_effects.transition_risks.map((risk, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/10 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{risk.risk}</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      €{risk.financial_impact.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-500" />
                Opportunities
              </h4>
              <div className="space-y-2">
                {data.financial_effects.opportunities.map((opp, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/10 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opp.opportunity}</span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      €{opp.potential_benefit.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Financial effects analysis not completed
          </div>
        );

      default:
        return null;
    }
  };

  const handleSave = async (formData: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/compliance/esrs-e1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporting_year: data.reporting_year,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      // Reload the page to fetch fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error saving ESRS E1 data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ESRS E1: Climate Change
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            European Sustainability Reporting Standards • {data.reporting_year}
          </p>
        </div>
        <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
            CSRD Compliant
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-2 shadow-sm">
        <div className="grid grid-cols-3 md:grid-cols-9 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium text-center">{tab.id}</span>
                {!tab.hasData && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" title="No data" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Forms */}
      <TransitionPlanForm
        isOpen={showTransitionPlanForm}
        onClose={() => setShowTransitionPlanForm(false)}
        onSave={(formData) => {
          handleSave(formData);
          setShowTransitionPlanForm(false);
        }}
        initialData={data.transition_plan}
        saving={saving}
      />

      <PoliciesForm
        isOpen={showPoliciesForm}
        onClose={() => setShowPoliciesForm(false)}
        onSave={(formData) => {
          handleSave(formData);
          setShowPoliciesForm(false);
        }}
        initialData={data.climate_policies}
        saving={saving}
      />

      <CarbonPricingForm
        isOpen={showCarbonPricingForm}
        onClose={() => setShowCarbonPricingForm(false)}
        onSave={(formData) => {
          handleSave(formData);
          setShowCarbonPricingForm(false);
        }}
        initialData={{ price: data.carbon_price_used, currency: data.carbon_price_currency }}
        saving={saving}
      />
    </div>
  );
}
