'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Zap,
  Factory,
  Leaf,
  TrendingDown,
  Calculator,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ReductionScenariosProps {
  currentEmissions: any;
  predictions: any;
}

export function ReductionScenarios({ currentEmissions, predictions }: ReductionScenariosProps) {
  const [selectedScenario, setSelectedScenario] = useState('moderate');

  const scenarios = [
    {
      id: 'conservative',
      name: 'Conservative',
      reduction: 15,
      color: '#FCD34D',
      initiatives: [
        { name: 'LED Lighting', impact: 3, cost: 50000 },
        { name: 'HVAC Optimization', impact: 5, cost: 75000 },
        { name: 'Waste Reduction', impact: 7, cost: 25000 }
      ]
    },
    {
      id: 'moderate',
      name: 'Moderate',
      reduction: 30,
      color: '#10B981',
      initiatives: [
        { name: 'Solar Installation', impact: 12, cost: 200000 },
        { name: 'Fleet Electrification', impact: 8, cost: 150000 },
        { name: 'Energy Management System', impact: 10, cost: 100000 }
      ]
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      reduction: 50,
      color: '#3B82F6',
      initiatives: [
        { name: 'Full Renewable Energy', impact: 25, cost: 500000 },
        { name: 'Carbon Capture', impact: 15, cost: 350000 },
        { name: 'Supply Chain Optimization', impact: 10, cost: 200000 }
      ]
    }
  ];

  const selectedScenarioData = scenarios.find(s => s.id === selectedScenario)!;

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reduction Scenarios
        </h3>
        <div className="flex gap-2">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedScenario === scenario.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Impact */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Projected Impact
          </h4>
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${selectedScenarioData.color}20` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Target Reduction</span>
              <span className="text-2xl font-bold" style={{ color: selectedScenarioData.color }}>
                -{selectedScenarioData.reduction}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current Emissions</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentEmissions.total.toFixed(0)} tCO2e
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Target Emissions</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(currentEmissions.total * (1 - selectedScenarioData.reduction / 100)).toFixed(0)} tCO2e
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Investment</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(selectedScenarioData.initiatives.reduce((sum, i) => sum + i.cost, 0) / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Initiatives */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Key Initiatives
          </h4>
          <div className="space-y-3">
            {selectedScenarioData.initiatives.map((initiative, index) => (
              <motion.div
                key={initiative.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${selectedScenarioData.color}20` }}>
                    <Leaf className="w-4 h-4" style={{ color: selectedScenarioData.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {initiative.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {initiative.impact}% reduction
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${(initiative.cost / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-gray-500">
                    Investment
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}