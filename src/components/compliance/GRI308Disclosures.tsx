'use client';

import { useState, useEffect } from 'react';
import { Truck, Shield, AlertTriangle, CheckCircle, Award } from 'lucide-react';

interface GRI308DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: string | null;
  selectedPeriod?: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string | null;
  country: string | null;
  sector: string | null;
  status: string;
  screeningCompleted: boolean;
  screeningDate: string | null;
  assessmentCompleted: boolean;
  assessmentDate: string | null;
  assessmentScore: number | null;
  negativeImpacts: boolean;
  impactsDescription: string | null;
  riskLevel: string | null;
  improvementPlan: boolean;
  improvementsImplemented: boolean;
  iso14001: boolean;
  annualSpend: number | null;
}

interface SupplierData {
  year: number;
  totalSuppliers: number;
  activeSuppliers: number;
  suppliersScreened: number;
  suppliersScreenedThisYear: number;
  screeningRate: number;
  suppliersWithAssessments: number;
  suppliersWithImpacts: number;
  suppliersWithImprovementPlans: number;
  improvementsImplemented: number;
  relationshipsTerminated: number;
  suppliersByRisk: { [key: string]: number };
  iso14001Certified: number;
  certificationRate: number;
  suppliers: Supplier[];
  methodology: {
    reportingPeriod: string;
    standards: string;
    screeningCriteria: string;
    assessmentApproach: string;
  };
}

export function GRI308Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI308DisclosuresProps) {
  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupplierData() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          year: selectedYear.toString(),
          organizationId: organizationId
        });

        const response = await fetch(`/api/compliance/gri-308?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch supplier data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching GRI 308 data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchSupplierData();
  }, [organizationId, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading supplier data...</p>
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

  if (!data || data.totalSuppliers === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
            <Truck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              GRI 308: Supplier Environmental Assessment 2016
            </h2>
            <p className="text-gray-400">
              New suppliers screened and suppliers assessed for environmental impacts
            </p>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-yellow-400 font-semibold mb-2">No Supplier Data</h3>
          <p className="text-gray-300">No suppliers have been added to the system yet</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
          <Truck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            GRI 308: Supplier Environmental Assessment 2016
          </h2>
          <p className="text-gray-400">
            New suppliers screened and suppliers assessed for environmental impacts
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="text-blue-400 text-sm mb-1">Total Suppliers</div>
          <div className="text-3xl font-bold text-white">{data.totalSuppliers}</div>
          <div className="text-xs text-gray-400 mt-1">{data.activeSuppliers} active</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="text-green-400 text-sm mb-1">Screening Rate</div>
          <div className="text-3xl font-bold text-white">{data.screeningRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 mt-1">{data.suppliersScreened} screened</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
          <div className="text-purple-400 text-sm mb-1">ISO 14001 Certified</div>
          <div className="text-3xl font-bold text-white">{data.iso14001Certified}</div>
          <div className="text-xs text-gray-400 mt-1">{data.certificationRate.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="text-orange-400 text-sm mb-1">Negative Impacts</div>
          <div className="text-3xl font-bold text-white">{data.suppliersWithImpacts}</div>
          <div className="text-xs text-gray-400 mt-1">identified</div>
        </div>
      </div>

      {/* GRI 308-1: New Suppliers Screened */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          308-1: New Suppliers Screened Using Environmental Criteria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Suppliers Screened ({selectedYear})</div>
            <div className="text-2xl font-bold text-white">{data.suppliersScreenedThisYear}</div>
            <div className="text-sm text-gray-400 mt-1">new suppliers screened this year</div>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Total Screened (All Time)</div>
            <div className="text-2xl font-bold text-white">{data.suppliersScreened}</div>
            <div className="text-sm text-gray-400 mt-1">
              {data.screeningRate.toFixed(1)}% of all suppliers
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
          <p className="text-sm text-gray-300">
            <strong className="text-blue-400">Screening Criteria:</strong> {data.methodology.screeningCriteria}
          </p>
        </div>
      </div>

      {/* GRI 308-2: Negative Impacts in Supply Chain */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          308-2: Negative Environmental Impacts in Supply Chain
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Assessed</div>
            <div className="text-2xl font-bold text-white">{data.suppliersWithAssessments}</div>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Impacts Identified</div>
            <div className="text-2xl font-bold text-white">{data.suppliersWithImpacts}</div>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Improvement Plans</div>
            <div className="text-2xl font-bold text-white">{data.suppliersWithImprovementPlans}</div>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Relationships Terminated</div>
            <div className="text-2xl font-bold text-white">{data.relationshipsTerminated}</div>
          </div>
        </div>

        {/* Risk Distribution */}
        {Object.keys(data.suppliersByRisk).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Suppliers by Risk Level</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.suppliersByRisk).map(([risk, count]) => (
                <div
                  key={risk}
                  className={`p-3 rounded-lg border ${getRiskColor(risk)}`}
                >
                  <div className="text-sm capitalize mb-1">{risk}</div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Supplier Details Table */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Supplier Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/[0.05]">
              <tr className="text-left text-sm text-gray-400">
                <th className="pb-3 pr-4">Supplier</th>
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Screened</th>
                <th className="pb-3 pr-4">Risk</th>
                <th className="pb-3 pr-4">ISO 14001</th>
                <th className="pb-3 pr-4">Impacts</th>
              </tr>
            </thead>
            <tbody>
              {data.suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                >
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-white">{supplier.name}</div>
                    {supplier.code && (
                      <div className="text-xs text-gray-400">{supplier.code}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{supplier.country || '-'}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      supplier.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {supplier.screeningCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {supplier.riskLevel ? (
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${getRiskColor(supplier.riskLevel)}`}>
                        {supplier.riskLevel}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {supplier.iso14001 ? (
                      <Award className="h-5 w-5 text-purple-400" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {supplier.negativeImpacts ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-400" />
                        {supplier.improvementPlan && (
                          <span className="text-xs text-green-400">Plan agreed</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">Methodology & Boundaries</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>Reporting Period:</strong> {data.methodology.reportingPeriod}</p>
          <p><strong>Standards:</strong> {data.methodology.standards}</p>
          <p><strong>Assessment Approach:</strong> {data.methodology.assessmentApproach}</p>
        </div>
      </div>
    </div>
  );
}
