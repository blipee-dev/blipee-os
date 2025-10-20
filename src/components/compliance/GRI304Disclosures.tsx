'use client';

import { useState } from 'react';
import { Leaf, MapPin, Shield, TrendingUp } from 'lucide-react';
import { useGRIDisclosures } from '@/hooks/useDashboardData';

interface GRI304DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: string | null;
  selectedPeriod?: string;
}

interface BiodiversitySite {
  id: string;
  name: string;
  location: string | null;
  area: number;
  coordinates: { lat: number; lng: number } | null;
  inProtectedArea: boolean;
  adjacentToProtected: boolean;
  protectedAreaName: string | null;
  protectedAreaType: string | null;
  biodiversityValue: string;
  habitatsPresent: string[];
  impactLevel: string;
  impactsDescription: string | null;
  protectedHectares: number;
  restoredHectares: number;
  conservationMeasures: string | null;
  monitoringProgram: boolean;
  iucnSpeciesPresent: boolean;
  iucnSpeciesCount: number;
  iucnSpeciesList: any;
  assessmentDate: string | null;
}

interface BiodiversityData {
  year: number | null;
  totalSites: number;
  totalArea: number;
  sitesInProtectedAreas: number;
  sitesAdjacentToProtected: number;
  sitesByImpactLevel: { [key: string]: number };
  protectedAreaHectares: number;
  restoredAreaHectares: number;
  sitesWithConservation: number;
  sitesWithMonitoring: number;
  sitesWithIUCNSpecies: number;
  totalIUCNSpecies: number;
  sitesByBiodiversityValue: { [key: string]: number };
  sites: BiodiversitySite[];
  methodology: {
    reportingPeriod: string;
    standards: string;
    boundaries: string;
    assessmentApproach: string;
  };
}

export function GRI304Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI304DisclosuresProps) {
  // Fetch data using React Query hook
  const { data, isLoading, error: queryError } = useGRIDisclosures('304', selectedYear, selectedSite);

  const loading = isLoading;
  const error = queryError?.message || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading biodiversity data...</p>
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

  if (!data || data.totalSites === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Leaf className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              GRI 304: Biodiversity 2016
            </h2>
            <p className="text-gray-400">
              Operational sites in or near protected areas and impacts on biodiversity
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-blue-400 font-semibold mb-2">Not Applicable</h3>
          <p className="text-gray-300">
            No operations in or adjacent to protected areas or areas of high biodiversity value have been identified
          </p>
        </div>
      </div>
    );
  }

  const getBiodiversityValueColor = (value: string) => {
    switch (value) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'severe':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      case 'none':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
          <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            GRI 304: Biodiversity 2016
          </h2>
          <p className="text-gray-400">
            Operational sites in or near protected areas and impacts on biodiversity
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="text-green-400 text-sm mb-1">Total Sites</div>
          <div className="text-3xl font-bold text-white">{data.totalSites}</div>
          <div className="text-xs text-gray-400 mt-1">{data.totalArea.toFixed(1)} hectares</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="text-blue-400 text-sm mb-1">Protected Areas</div>
          <div className="text-3xl font-bold text-white">{data.sitesInProtectedAreas}</div>
          <div className="text-xs text-gray-400 mt-1">{data.sitesAdjacentToProtected} adjacent</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
          <div className="text-purple-400 text-sm mb-1">IUCN Species</div>
          <div className="text-3xl font-bold text-white">{data.totalIUCNSpecies}</div>
          <div className="text-xs text-gray-400 mt-1">at {data.sitesWithIUCNSpecies} sites</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-lg p-4">
          <div className="text-emerald-400 text-sm mb-1">Restored</div>
          <div className="text-3xl font-bold text-white">{data.restoredAreaHectares.toFixed(1)}</div>
          <div className="text-xs text-gray-400 mt-1">hectares</div>
        </div>
      </div>

      {/* GRI 304-1: Protected Areas */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          304-1: Operational Sites in Protected Areas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Sites IN Protected Areas</div>
            <div className="text-2xl font-bold text-white">{data.sitesInProtectedAreas}</div>
            <div className="text-sm text-gray-400 mt-1">
              {data.totalSites > 0 ? ((data.sitesInProtectedAreas / data.totalSites) * 100).toFixed(1) : 0}% of total sites
            </div>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Sites ADJACENT TO Protected Areas</div>
            <div className="text-2xl font-bold text-white">{data.sitesAdjacentToProtected}</div>
            <div className="text-sm text-gray-400 mt-1">
              {data.totalSites > 0 ? ((data.sitesAdjacentToProtected / data.totalSites) * 100).toFixed(1) : 0}% of total sites
            </div>
          </div>
        </div>

        {/* Biodiversity Value Distribution */}
        {Object.keys(data.sitesByBiodiversityValue).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Sites by Biodiversity Value</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.sitesByBiodiversityValue).map(([value, count]) => (
                <div
                  key={value}
                  className={`p-3 rounded-lg border ${getBiodiversityValueColor(value)}`}
                >
                  <div className="text-sm capitalize mb-1">{value}</div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRI 304-2: Impacts */}
      {Object.keys(data.sitesByImpactLevel).length > 0 && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-400" />
            304-2: Significant Impacts on Biodiversity
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(data.sitesByImpactLevel).map(([level, count]) => (
              <div key={level} className="p-4 bg-white/[0.02] rounded-lg">
                <div className={`text-sm capitalize mb-1 ${getImpactColor(level)}`}>{level}</div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-gray-400 mt-1">sites</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRI 304-3: Habitats Protected or Restored */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-400" />
          304-3: Habitats Protected or Restored
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-green-400 text-sm mb-1">Protected Habitats</div>
            <div className="text-2xl font-bold text-white">{data.protectedAreaHectares.toFixed(1)}</div>
            <div className="text-xs text-gray-400 mt-1">hectares</div>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="text-emerald-400 text-sm mb-1">Restored Habitats</div>
            <div className="text-2xl font-bold text-white">{data.restoredAreaHectares.toFixed(1)}</div>
            <div className="text-xs text-gray-400 mt-1">hectares</div>
          </div>

          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-blue-400 text-sm mb-1">Monitoring Programs</div>
            <div className="text-2xl font-bold text-white">{data.sitesWithMonitoring}</div>
            <div className="text-xs text-gray-400 mt-1">active programs</div>
          </div>
        </div>
      </div>

      {/* GRI 304-4: IUCN Red List Species */}
      {data.totalIUCNSpecies > 0 && (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">304-4: IUCN Red List Species</h3>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-red-400 text-sm mb-1">Total IUCN Red List Species</div>
            <div className="text-3xl font-bold text-white">{data.totalIUCNSpecies}</div>
            <div className="text-sm text-gray-400 mt-1">
              Present at {data.sitesWithIUCNSpecies} operational sites
            </div>
          </div>
        </div>
      )}

      {/* Site Details */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Site Details</h3>
        <div className="space-y-4">
          {data.sites.map((site) => (
            <div key={site.id} className="border border-white/[0.05] rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-white">{site.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getBiodiversityValueColor(site.biodiversityValue)}`}>
                      {site.biodiversityValue} value
                    </span>
                  </div>
                  {site.location && (
                    <p className="text-sm text-gray-400">{site.location}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{site.area.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">hectares</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {site.inProtectedArea && (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <Shield className="h-4 w-4" />
                    In Protected Area
                  </div>
                )}
                {site.iucnSpeciesPresent && (
                  <div className="text-sm text-red-400">
                    {site.iucnSpeciesCount} IUCN Species
                  </div>
                )}
                {site.monitoringProgram && (
                  <div className="text-sm text-green-400">
                    Monitoring Active
                  </div>
                )}
                <div className={`text-sm capitalize ${getImpactColor(site.impactLevel)}`}>
                  {site.impactLevel} Impact
                </div>
              </div>

              {(site.protectedHectares > 0 || site.restoredHectares > 0) && (
                <div className="flex gap-4 text-sm mb-3">
                  {site.protectedHectares > 0 && (
                    <span className="text-green-400">
                      {site.protectedHectares.toFixed(1)} ha protected
                    </span>
                  )}
                  {site.restoredHectares > 0 && (
                    <span className="text-emerald-400">
                      {site.restoredHectares.toFixed(1)} ha restored
                    </span>
                  )}
                </div>
              )}

              {site.conservationMeasures && (
                <div className="p-3 bg-green-500/5 rounded-lg">
                  <div className="text-xs font-semibold text-green-400 mb-1">Conservation Measures</div>
                  <p className="text-sm text-gray-300">{site.conservationMeasures}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">Methodology & Boundaries</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>Reporting Period:</strong> {data.methodology.reportingPeriod}</p>
          <p><strong>Standards:</strong> {data.methodology.standards}</p>
          <p><strong>Boundaries:</strong> {data.methodology.boundaries}</p>
          <p><strong>Assessment Approach:</strong> {data.methodology.assessmentApproach}</p>
        </div>
      </div>
    </div>
  );
}
