'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Building2,
  Fuel,
  Truck,
  Trash2,
  Plane,
  Car,
  Home,
  Package,
  Factory,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Scope3CategoriesProps {
  categories: {
    [key: string]: {
      value: number;
      included: boolean;
      data_quality: number;
    };
  };
  totalScope3: number;
}

export function Scope3Categories({ categories, totalScope3 }: Scope3CategoriesProps) {
  const categoryIcons: { [key: string]: any } = {
    'purchased_goods': ShoppingBag,
    'capital_goods': Building2,
    'fuel_energy': Fuel,
    'upstream_transportation': Truck,
    'waste': Trash2,
    'business_travel': Plane,
    'employee_commuting': Car,
    'upstream_leased': Home,
    'downstream_transportation': Truck,
    'processing': Factory,
    'use_of_products': Package,
    'end_of_life': Trash2,
    'downstream_leased': Building2,
    'franchises': Users,
    'investments': TrendingUp
  };

  const categoryNames: { [key: string]: string } = {
    'purchased_goods': 'Purchased Goods & Services',
    'capital_goods': 'Capital Goods',
    'fuel_energy': 'Fuel & Energy Activities',
    'upstream_transportation': 'Upstream Transportation',
    'waste': 'Waste Generated',
    'business_travel': 'Business Travel',
    'employee_commuting': 'Employee Commuting',
    'upstream_leased': 'Upstream Leased Assets',
    'downstream_transportation': 'Downstream Transportation',
    'processing': 'Processing of Sold Products',
    'use_of_products': 'Use of Sold Products',
    'end_of_life': 'End-of-Life Treatment',
    'downstream_leased': 'Downstream Leased Assets',
    'franchises': 'Franchises',
    'investments': 'Investments'
  };

  const getDataQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-500';
    if (quality >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDataQualityLabel = (quality: number) => {
    if (quality >= 0.8) return 'High';
    if (quality >= 0.6) return 'Medium';
    return 'Low';
  };

  const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b.value - a.value);

  const includedCount = Object.values(categories).filter(c => c.included).length;
  const totalCategories = 15;
  const coveragePercent = (includedCount / totalCategories) * 100;

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scope 3 Categories (GHG Protocol)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            All 15 categories per GHG Protocol Corporate Value Chain Standard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Coverage</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {includedCount}/{totalCategories}
            </p>
          </div>
          <div className="w-16 h-16">
            <svg className="transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${coveragePercent}, 100`}
                className="text-green-500"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedCategories.map(([key, data], index) => {
          const Icon = categoryIcons[key] || Package;
          const percentage = totalScope3 > 0 ? (data.value / totalScope3) * 100 : 0;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`p-4 rounded-lg border ${
                data.included
                  ? 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/[0.1]'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    data.included
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    {data.included ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {data.included && (
                  <span className={`text-xs font-medium ${getDataQualityColor(data.data_quality)}`}>
                    {getDataQualityLabel(data.data_quality)}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {categoryNames[key] || key}
              </h4>

              {data.included ? (
                <>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {data.value.toFixed(1)} tCO2e
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}% of Scope 3
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Data Quality Indicator */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Data Quality</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-3 rounded-sm ${
                            i < Math.round(data.data_quality * 5)
                              ? getDataQualityColor(data.data_quality).replace('text-', 'bg-')
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Not measured
                  </p>
                  <button className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Enable tracking →
                  </button>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Compliance Alert */}
      {includedCount < 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                Incomplete Scope 3 Coverage
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                You're tracking {includedCount} of 15 Scope 3 categories.
                SBTi requires screening all categories and including those that are material
                (typically &gt;5% of total Scope 3 emissions).
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}