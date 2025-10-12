'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Zap,
  Droplets,
  Trees,
  Factory,
  Trash2,
  ShieldAlert,
  Truck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { GRI305Disclosures } from './GRI305Disclosures';
import { GRI302Disclosures } from './GRI302Disclosures';
import { GRI303Disclosures } from './GRI303Disclosures';
import { GRI306Disclosures } from './GRI306Disclosures';
import { GRI301Disclosures } from './GRI301Disclosures';
import { GRI304Disclosures } from './GRI304Disclosures';
import { GRI307Disclosures } from './GRI307Disclosures';
import { GRI308Disclosures } from './GRI308Disclosures';

interface GRIStandard {
  code: string;
  title: string;
  icon: any;
  status: 'implemented' | 'available' | 'not_available';
  description: string;
  metricsCount?: number;
  color: string;
}

interface GRIEnvironmentalStandardsProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function GRIEnvironmentalStandards({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRIEnvironmentalStandardsProps) {
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

  const standards: GRIStandard[] = [
    {
      code: 'GRI 301',
      title: 'Materials 2016',
      icon: Package,
      status: 'available',
      description: 'Materials used by weight or volume, recycled input materials, reclaimed products and packaging',
      metricsCount: 23,
      color: 'amber'
    },
    {
      code: 'GRI 302',
      title: 'Energy 2016',
      icon: Zap,
      status: 'implemented',
      description: 'Energy consumption within the organization, energy intensity, reduction of energy consumption',
      metricsCount: 7,
      color: 'yellow'
    },
    {
      code: 'GRI 303',
      title: 'Water and Effluents 2018',
      icon: Droplets,
      status: 'implemented',
      description: 'Interactions with water as a shared resource, water withdrawal, discharge and consumption',
      metricsCount: 3,
      color: 'blue'
    },
    {
      code: 'GRI 304',
      title: 'Biodiversity 2016',
      icon: Trees,
      status: 'available',
      description: 'Operational sites in protected areas, impacts on biodiversity, habitats protected or restored',
      color: 'green'
    },
    {
      code: 'GRI 305',
      title: 'Emissions 2016',
      icon: Factory,
      status: 'implemented',
      description: 'Direct and indirect GHG emissions, emissions intensity, reduction of GHG emissions',
      metricsCount: 98,
      color: 'purple'
    },
    {
      code: 'GRI 306',
      title: 'Waste 2020',
      icon: Trash2,
      status: 'implemented',
      description: 'Waste generation and significant waste-related impacts, management of waste-related impacts',
      metricsCount: 20,
      color: 'orange'
    },
    {
      code: 'GRI 307',
      title: 'Environmental Compliance 2016',
      icon: ShieldAlert,
      status: 'available',
      description: 'Non-compliance with environmental laws and regulations, fines and sanctions',
      color: 'red'
    },
    {
      code: 'GRI 308',
      title: 'Supplier Environmental Assessment 2016',
      icon: Truck,
      status: 'available',
      description: 'New suppliers screened using environmental criteria, negative environmental impacts in supply chain',
      color: 'indigo'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Implemented
          </div>
        );
      case 'available':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
            <Info className="w-3.5 h-3.5" />
            Data Available
          </div>
        );
      case 'not_available':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            Not Tracked
          </div>
        );
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, any> = {
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/10',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        hover: 'hover:border-amber-300 dark:hover:border-amber-700'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/10',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        hover: 'hover:border-yellow-300 dark:hover:border-yellow-700'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        hover: 'hover:border-blue-300 dark:hover:border-blue-700'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/10',
        border: 'border-green-200 dark:border-green-800',
        icon: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        hover: 'hover:border-green-300 dark:hover:border-green-700'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        hover: 'hover:border-purple-300 dark:hover:border-purple-700'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        hover: 'hover:border-orange-300 dark:hover:border-orange-700'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/10',
        border: 'border-red-200 dark:border-red-800',
        icon: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        hover: 'hover:border-red-300 dark:hover:border-red-700'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/10',
        border: 'border-indigo-200 dark:border-indigo-800',
        icon: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        hover: 'hover:border-indigo-300 dark:hover:border-indigo-700'
      }
    };
    return colors[color];
  };

  // If a standard is selected, show its detail view
  if (selectedStandard) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedStandard(null)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to All GRI Environmental Standards
        </button>
        {selectedStandard === 'GRI 301' && (
          <GRI301Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 302' && (
          <GRI302Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 303' && (
          <GRI303Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 304' && (
          <GRI304Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 305' && (
          <GRI305Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 306' && (
          <GRI306Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 307' && (
          <GRI307Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
        {selectedStandard === 'GRI 308' && (
          <GRI308Disclosures
            organizationId={organizationId}
            selectedYear={selectedYear}
            selectedSite={selectedSite}
            selectedPeriod={selectedPeriod}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Trees className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            GRI Environmental Standards
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          Complete overview of GRI 300 series environmental disclosure standards for {selectedYear}
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              About GRI Environmental Standards
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              The GRI 300 series covers environmental topics including materials, energy, water, biodiversity, emissions,
              waste, and supplier environmental assessment. These standards help organizations report on their environmental
              impacts and management approaches.
            </p>
          </div>
        </div>
      </div>

      {/* Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standards.map((standard) => {
          const Icon = standard.icon;
          const colors = getColorClasses(standard.color);
          const isClickable = standard.status === 'implemented' || standard.status === 'available';

          return (
            <motion.div
              key={standard.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative ${colors.bg} border ${colors.border} rounded-xl p-5 transition-all ${
                isClickable ? `${colors.hover} cursor-pointer` : 'cursor-default'
              }`}
              onClick={() => {
                if (standard.status === 'implemented' || standard.status === 'available') {
                  setSelectedStandard(standard.code);
                }
              }}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {getStatusBadge(standard.status)}
              </div>

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 ${colors.icon} rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 pr-24">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {standard.code}
                  </h3>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {standard.title}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {standard.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {standard.status === 'implemented' && (
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ✓ Active & Reporting
                    </span>
                  )}
                  {standard.status === 'available' && standard.metricsCount && (
                    <span>
                      {standard.metricsCount} metrics tracked
                    </span>
                  )}
                  {standard.status === 'not_available' && (
                    <span className="text-gray-500 dark:text-gray-400">
                      No data collection configured
                    </span>
                  )}
                </div>
                {isClickable && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Legend:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Implemented</p>
              <p className="text-gray-600 dark:text-gray-400">Full disclosure reporting available</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Data Available</p>
              <p className="text-gray-600 dark:text-gray-400">Metrics tracked, UI coming soon</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Not Tracked</p>
              <p className="text-gray-600 dark:text-gray-400">No metrics configured yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action for Not Available Standards */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
              Want to Track Additional Standards?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
              Standards marked as "Not Tracked" require additional data collection. Contact support or configure
              custom metrics to enable tracking for GRI 301, 304, 307, and 308.
            </p>
            <button className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline">
              Learn about setting up custom environmental metrics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
