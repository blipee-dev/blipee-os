'use client';

import { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useGRIDisclosures } from '@/hooks/useDashboardData';

interface GRI307DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: string | null;
  selectedPeriod?: string;
}

interface EnvironmentalIncident {
  id: string;
  date: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  fineAmount: number | null;
  currency: string;
  regulatoryBody: string;
  regulationViolated: string;
  correctiveActions: string;
  resolutionDate: string | null;
}

interface ComplianceData {
  year: number;
  totalIncidents: number;
  totalFines: number;
  significantFines: number;
  nonMonetarySanctions: number;
  incidentsByType: { [key: string]: number };
  incidentsBySeverity: { [key: string]: number };
  incidentsByStatus: { [key: string]: number };
  incidents: EnvironmentalIncident[];
  methodology: {
    boundaries: string;
    reportingPeriod: string;
    standards: string;
    significantFineThreshold: string;
  };
}

export function GRI307Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI307DisclosuresProps) {
  // Fetch data using React Query hook
  const { data, isLoading, error: queryError } = useGRIDisclosures('307', selectedYear, selectedSite);

  const loading = isLoading;
  const error = queryError?.message || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading compliance data...</p>
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
    return null;
  }

  // Show "no incidents" message if clean record
  if (data.totalIncidents === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              GRI 307: Environmental Compliance 2016
            </h2>
            <p className="text-gray-400">
              Non-compliance with environmental laws and regulations
            </p>
          </div>
        </div>

        {/* Clean Record Banner */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">
            No Environmental Non-Compliance
          </h3>
          <p className="text-gray-300 text-lg">
            No significant fines, sanctions, or environmental violations reported in {selectedYear}
          </p>
        </div>

        {/* Methodology */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Methodology & Boundaries</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Reporting Period:</strong> {data.methodology.reportingPeriod}</p>
            <p><strong>Standards:</strong> {data.methodology.standards}</p>
            <p><strong>Boundaries:</strong> {data.methodology.boundaries}</p>
            <p><strong>Significant Fine Threshold:</strong> {data.methodology.significantFineThreshold}</p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'significant':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'minor':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'dismissed':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <Scale className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            GRI 307: Environmental Compliance 2016
          </h2>
          <p className="text-gray-400">
            Non-compliance with environmental laws and regulations
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 text-sm mb-1">Total Incidents</div>
          <div className="text-3xl font-bold text-white">{data.totalIncidents}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="text-orange-400 text-sm mb-1">Total Fines</div>
          <div className="text-3xl font-bold text-white">
            €{data.totalFines.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 text-sm mb-1">Significant Fines</div>
          <div className="text-3xl font-bold text-white">{data.significantFines}</div>
          <div className="text-xs text-gray-400 mt-1">≥ €10,000</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-yellow-400 text-sm mb-1">Non-Monetary Sanctions</div>
          <div className="text-3xl font-bold text-white">{data.nonMonetarySanctions}</div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Type */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">By Incident Type</h4>
          <div className="space-y-2">
            {Object.entries(data.incidentsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{type}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Severity */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">By Severity</h4>
          <div className="space-y-2">
            {Object.entries(data.incidentsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{severity}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">By Status</h4>
          <div className="space-y-2">
            {Object.entries(data.incidentsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Incidents List */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Detailed Incidents</h3>
        <div className="space-y-4">
          {data.incidents.map((incident) => (
            <div
              key={incident.id}
              className={`border rounded-lg p-4 ${getSeverityColor(incident.severity)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(incident.status)}
                    <span className="font-semibold text-white capitalize">
                      {incident.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(incident.date).toLocaleDateString()} • {incident.regulatoryBody}
                  </div>
                </div>
                {incident.fineAmount && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {incident.currency}{incident.fineAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">Fine Amount</div>
                  </div>
                )}
              </div>

              <p className="text-gray-300 mb-2">{incident.description}</p>

              {incident.regulationViolated && (
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Regulation Violated:</strong> {incident.regulationViolated}
                </p>
              )}

              {incident.correctiveActions && (
                <div className="mt-3 p-3 bg-white/[0.03] rounded-lg">
                  <div className="text-sm font-semibold text-green-400 mb-1">Corrective Actions</div>
                  <p className="text-sm text-gray-300">{incident.correctiveActions}</p>
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span className="capitalize">Status: {incident.status.replace('_', ' ')}</span>
                {incident.resolutionDate && (
                  <span>Resolved: {new Date(incident.resolutionDate).toLocaleDateString()}</span>
                )}
              </div>
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
          <p><strong>Significant Fine Threshold:</strong> {data.methodology.significantFineThreshold}</p>
        </div>
      </div>
    </div>
  );
}
