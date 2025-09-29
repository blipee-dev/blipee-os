'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Shield,
  TrendingUp,
  FileText,
  Award,
  Target
} from 'lucide-react';

interface GHGProtocolComplianceProps {
  scopeData: any;
  complianceScore: number;
}

export function GHGProtocolCompliance({ scopeData, complianceScore }: GHGProtocolComplianceProps) {
  // Compliance requirements based on GHG Protocol
  const complianceRequirements = [
    {
      category: 'Organizational Boundaries',
      items: [
        {
          requirement: 'Control Approach Defined',
          description: 'Operational or financial control approach selected',
          status: 'complete',
          required: true
        },
        {
          requirement: 'All Entities Included',
          description: '100% of controlled entities in inventory',
          status: 'complete',
          required: true
        },
        {
          requirement: 'Equity Share Calculated',
          description: 'For joint ventures and partnerships',
          status: 'in-progress',
          required: false
        }
      ]
    },
    {
      category: 'Operational Boundaries',
      items: [
        {
          requirement: 'Scope 1 Complete',
          description: 'All direct emissions included',
          status: 'complete',
          required: true
        },
        {
          requirement: 'Scope 2 Complete',
          description: 'All purchased energy emissions',
          status: 'complete',
          required: true
        },
        {
          requirement: 'Scope 3 Screening',
          description: 'All 15 categories screened',
          status: scopeData.scope_3.coverage >= 67 ? 'complete' : 'in-progress',
          required: true
        },
        {
          requirement: 'Material Scope 3 Included',
          description: 'Categories >5% of total included',
          status: 'in-progress',
          required: false
        }
      ]
    },
    {
      category: 'Calculation Methodology',
      items: [
        {
          requirement: 'Emission Factors Documented',
          description: 'Source and vintage of all factors',
          status: 'complete',
          required: true
        },
        {
          requirement: 'Activity Data Verified',
          description: 'Primary data collection where possible',
          status: 'in-progress',
          required: true
        },
        {
          requirement: 'GWP Values Current',
          description: 'Using IPCC AR6 values',
          status: 'complete',
          required: true
        },
        {
          requirement: 'Uncertainty Analysis',
          description: 'Data quality assessment completed',
          status: 'incomplete',
          required: false
        }
      ]
    },
    {
      category: 'Reporting & Verification',
      items: [
        {
          requirement: 'Base Year Established',
          description: 'Representative year with complete data',
          status: 'complete',
          required: true
        },
        {
          requirement: 'Recalculation Policy',
          description: 'Triggers and thresholds defined',
          status: 'in-progress',
          required: true
        },
        {
          requirement: 'Third-Party Verification',
          description: 'Limited or reasonable assurance',
          status: 'incomplete',
          required: false
        },
        {
          requirement: 'Public Disclosure',
          description: 'CDP, GRI, or TCFD reporting',
          status: 'incomplete',
          required: false
        }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'incomplete':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'incomplete':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getComplianceLevel = () => {
    if (complianceScore >= 90) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (complianceScore >= 70) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (complianceScore >= 50) return { label: 'Needs Improvement', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { label: 'Non-Compliant', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const complianceLevel = getComplianceLevel();

  // Calculate stats
  const totalRequirements = complianceRequirements.flatMap(c => c.items).filter(i => i.required).length;
  const completedRequirements = complianceRequirements.flatMap(c => c.items).filter(i => i.required && i.status === 'complete').length;
  const optionalCompleted = complianceRequirements.flatMap(c => c.items).filter(i => !i.required && i.status === 'complete').length;
  const totalOptional = complianceRequirements.flatMap(c => c.items).filter(i => !i.required).length;

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          GHG Protocol Compliance
        </h3>
        <div className={`px-3 py-1 rounded-full ${complianceLevel.bg}`}>
          <span className={`text-sm font-medium ${complianceLevel.color}`}>
            {complianceLevel.label}
          </span>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-white">Overall Compliance Score</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {complianceScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500`}
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Required Items</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {completedRequirements}/{totalRequirements} Complete
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Optional Items</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {optionalCompleted}/{totalOptional} Complete
            </p>
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-4">
        {complianceRequirements.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="border border-gray-200 dark:border-white/[0.05] rounded-lg overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02]">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {category.category}
              </h4>
            </div>
            <div className="p-4 space-y-3">
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.requirement}
                          {item.required && (
                            <span className="ml-2 text-xs text-red-500">*Required</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Next Steps for Full Compliance
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1">
              {complianceScore < 100 && scopeData.scope_3.coverage < 95 && (
                <li>• Increase Scope 3 coverage to include all material categories</li>
              )}
              {complianceScore < 100 && (
                <li>• Complete third-party verification for enhanced credibility</li>
              )}
              {complianceScore < 90 && (
                <li>• Establish formal recalculation policy and triggers</li>
              )}
              <li>• Consider aligning with CDP, TCFD, or GRI reporting standards</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Certification Badge */}
      {complianceScore >= 90 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center"
        >
          <Award className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900 dark:text-green-300">
            GHG Protocol Compliant
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Your inventory meets GHG Protocol Corporate Standard requirements
          </p>
        </motion.div>
      )}
    </div>
  );
}