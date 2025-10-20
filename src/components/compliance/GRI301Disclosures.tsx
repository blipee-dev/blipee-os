'use client';

import { useState } from 'react';
import { Package, RefreshCw, Recycle, TrendingUp } from 'lucide-react';
import { useGRIDisclosures } from '@/hooks/useDashboardData';

interface GRI301DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: string | null;
  selectedPeriod?: string;
}

interface MaterialsData {
  year: number;
  totalRawMaterials: number;
  renewableMaterials: number;
  nonRenewableMaterials: number;
  renewablePercentage: number;
  rawMaterialsBreakdown: { [key: string]: number };
  totalRecycledInput: number;
  recycledContentPercentage: number;
  recycledBreakdown: { [key: string]: number };
  totalPackaging: number;
  packagingBreakdown: { [key: string]: number };
  productsReclaimed: number;
  reclamationData: { [key: string]: number };
  intensityMetrics: {
    materialsPerRevenue: number | null;
    materialsPerEmployee: number | null;
    materialsPerArea: number | null;
  };
  methodology: {
    boundaries: string;
    reportingPeriod: string;
    standards: string;
  };
}

export function GRI301Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI301DisclosuresProps) {
  // Fetch data using React Query hook
  const { data, isLoading, error: queryError } = useGRIDisclosures('301', selectedYear, selectedSite);

  const loading = isLoading;
  const error = queryError?.message || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading materials data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-gray-300">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <h3 className="text-yellow-400 font-semibold mb-2">No Data Available</h3>
        <p className="text-gray-300">No materials data found for {selectedYear}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            GRI 301: Materials 2016
          </h2>
          <p className="text-gray-400">
            Materials used by weight or volume, recycled input materials, and reclaimed products and their packaging materials
          </p>
        </div>
      </div>

      {/* GRI 301-1: Materials Used by Weight or Volume */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          301-1: Materials Used by Weight or Volume
        </h3>

        {/* Total Materials Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-4">
            <div className="text-amber-400 text-sm mb-1">Total Raw Materials</div>
            <div className="text-3xl font-bold text-white">
              {data.totalRawMaterials.toLocaleString()}
              <span className="text-lg text-gray-400 ml-2">tonnes</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 text-sm mb-1">Renewable Materials</div>
            <div className="text-3xl font-bold text-white">
              {data.renewableMaterials.toLocaleString()}
              <span className="text-lg text-gray-400 ml-2">tonnes</span>
            </div>
            <div className="text-sm text-green-400 mt-1">
              {data.renewablePercentage.toFixed(1)}% of total
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/20 to-slate-500/20 border border-gray-500/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Non-Renewable Materials</div>
            <div className="text-3xl font-bold text-white">
              {data.nonRenewableMaterials.toLocaleString()}
              <span className="text-lg text-gray-400 ml-2">tonnes</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {(100 - data.renewablePercentage).toFixed(1)}% of total
            </div>
          </div>
        </div>

        {/* Breakdown by Material Type */}
        {Object.keys(data.rawMaterialsBreakdown).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Raw Materials Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(data.rawMaterialsBreakdown).map(([material, value]) => (
                <div key={material} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                  <span className="text-gray-300">{material}</span>
                  <span className="text-white font-semibold">{value.toLocaleString()} tonnes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRI 301-2: Recycled Input Materials */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Recycle className="h-5 w-5 text-green-400" />
          301-2: Recycled Input Materials Used
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 text-sm mb-1">Total Recycled Input</div>
            <div className="text-3xl font-bold text-white">
              {data.totalRecycledInput.toLocaleString()}
              <span className="text-lg text-gray-400 ml-2">tonnes</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-400 text-sm mb-1">Recycled Content %</div>
            <div className="text-3xl font-bold text-white">
              {data.recycledContentPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400 mt-1">
              of total raw materials
            </div>
          </div>
        </div>

        {Object.keys(data.recycledBreakdown).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Recycled Materials Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(data.recycledBreakdown).map(([material, value]) => (
                <div key={material} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                  <span className="text-gray-300">{material}</span>
                  <span className="text-white font-semibold">{value.toLocaleString()} tonnes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Packaging Materials */}
      {data.totalPackaging > 0 && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            Packaging Materials
          </h3>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 mb-4">
            <div className="text-purple-400 text-sm mb-1">Total Packaging Materials</div>
            <div className="text-3xl font-bold text-white">
              {data.totalPackaging.toLocaleString()}
              <span className="text-lg text-gray-400 ml-2">tonnes</span>
            </div>
          </div>

          {Object.keys(data.packagingBreakdown).length > 0 && (
            <div className="space-y-2">
              {Object.entries(data.packagingBreakdown).map(([packaging, value]) => (
                <div key={packaging} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                  <span className="text-gray-300">{packaging}</span>
                  <span className="text-white font-semibold">{value.toLocaleString()} tonnes</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GRI 301-3: Reclaimed Products */}
      {data.productsReclaimed > 0 && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-400" />
            301-3: Reclaimed Products and Packaging Materials
          </h3>

          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <div className="text-cyan-400 text-sm mb-1">Products Reclaimed</div>
            <div className="text-3xl font-bold text-white">
              {data.productsReclaimed.toLocaleString()}
              <span className="text-lg text-gray-400 ml-2">tonnes</span>
            </div>
          </div>

          {Object.keys(data.reclamationData).length > 0 && (
            <div className="space-y-2">
              {Object.entries(data.reclamationData).map(([item, value]) => (
                <div key={item} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                  <span className="text-gray-300">{item}</span>
                  <span className="text-white font-semibold">{value.toLocaleString()} tonnes</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intensity Metrics */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Materials Intensity Metrics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.intensityMetrics.materialsPerRevenue !== null && (
            <div className="p-4 bg-white/[0.02] rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Materials per Million EUR Revenue</div>
              <div className="text-2xl font-bold text-white">
                {data.intensityMetrics.materialsPerRevenue.toFixed(2)}
                <span className="text-sm text-gray-400 ml-1">tonnes/M EUR</span>
              </div>
            </div>
          )}

          {data.intensityMetrics.materialsPerEmployee !== null && (
            <div className="p-4 bg-white/[0.02] rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Materials per Employee</div>
              <div className="text-2xl font-bold text-white">
                {data.intensityMetrics.materialsPerEmployee.toFixed(2)}
                <span className="text-sm text-gray-400 ml-1">tonnes/FTE</span>
              </div>
            </div>
          )}

          {data.intensityMetrics.materialsPerArea !== null && (
            <div className="p-4 bg-white/[0-02] rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Materials per m²</div>
              <div className="text-2xl font-bold text-white">
                {data.intensityMetrics.materialsPerArea.toFixed(4)}
                <span className="text-sm text-gray-400 ml-1">tonnes/m²</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">Methodology & Boundaries</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>Reporting Period:</strong> {data.methodology.reportingPeriod}</p>
          <p><strong>Standards:</strong> {data.methodology.standards}</p>
          <p><strong>Boundaries:</strong> {data.methodology.boundaries}</p>
          <p><strong>Units:</strong> All materials measured in metric tonnes unless otherwise specified</p>
        </div>
      </div>
    </div>
  );
}
