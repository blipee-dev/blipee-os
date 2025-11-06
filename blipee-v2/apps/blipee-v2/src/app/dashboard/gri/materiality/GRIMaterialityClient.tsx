'use client'

import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  TrendingUp,
  Users,
  Grid3x3,
  Info,
} from 'lucide-react'
import type { GRIMateriality } from '@/lib/data/initiatives'

interface GRIMaterialityClientProps {
  materialityData: GRIMateriality[]
  organizationId: string
  organizationName: string
  industry: string
}

export function GRIMaterialityClient({
  materialityData,
  organizationId,
  organizationName,
  industry,
}: GRIMaterialityClientProps) {
  const [activeSection, setActiveSection] = useState<'3-1' | '3-2' | '3-3'>('3-2')

  const totalMetrics = materialityData.reduce((sum, std) => sum + std.total_metrics, 0)
  const materialMetrics = materialityData.reduce((sum, std) => sum + std.material_metrics, 0)
  const materialStandards = materialityData.filter((std) => std.is_material).length
  const avgPeerAdoption = materialityData.reduce((sum, std) => sum + (std.peer_adoption_avg || 0), 0) / materialityData.length

  const handleExportPDF = async () => {
    alert('PDF export coming soon!')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            GRI Materiality Assessment
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Auto-generated from your metric tracking decisions • {organizationName}
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Topics</span>
            <Grid3x3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {materialityData.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            GRI Standards assessed
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Material</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {materialStandards}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            of {materialityData.length} standards
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Coverage</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalMetrics > 0 ? ((materialMetrics / totalMetrics) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {materialMetrics}/{totalMetrics} metrics
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Peer Alignment</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgPeerAdoption.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            industry average
          </div>
        </div>
      </div>

      {/* GRI Section Navigation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              This report covers GRI 3: Material Topics
            </div>
            <div className="flex gap-2">
              {[
                { id: '3-1', label: 'GRI 3-1: Process' },
                { id: '3-2', label: 'GRI 3-2: List of Topics' },
                { id: '3-3', label: 'GRI 3-3: Management' },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GRI 3-1: Process to Determine Material Topics */}
      {activeSection === '3-1' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            GRI 3-1: Process to Determine Material Topics
          </h2>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Materiality Assessment Process
            </h3>

            <div className="prose dark:prose-invert max-w-none text-sm">
              <p>
                {organizationName} determined its material topics through a systematic review of
                business operations, industry benchmarks, and regulatory requirements for the{' '}
                {industry} sector.
              </p>

              <h4 className="font-semibold mt-4 mb-2">Our Process Included:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Industry-Specific Recommendations:</strong> Based on GRI Sector Standards
                  and international frameworks (ESRS, CDP, TCFD)
                </li>
                <li>
                  <strong>Peer Benchmarking:</strong> Analyzed tracking patterns from similar
                  organizations in our industry
                </li>
                <li>
                  <strong>Internal Assessment:</strong> Evaluated applicability to our specific
                  operations and business model
                </li>
                <li>
                  <strong>Double Materiality:</strong> Considered both impact materiality
                  (environmental/social) and financial materiality
                </li>
              </ol>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Metrics Assessed
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalMetrics}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    across GRI 301-308
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Determined Material
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {materialMetrics}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {totalMetrics > 0 ? ((materialMetrics / totalMetrics) * 100).toFixed(0) : 0}%
                    of total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRI 3-2: List of Material Topics */}
      {activeSection === '3-2' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            GRI 3-2: List of Material Topics
          </h2>

          <div className="space-y-3">
            {materialityData.map((standard) => (
              <div
                key={standard.gri_standard}
                className={`border rounded-lg p-6 transition-all ${
                  standard.is_material
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        standard.is_material
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      {standard.is_material ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        GRI {standard.gri_standard} - {standard.standard_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            standard.is_material
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {standard.is_material ? 'Material' : 'Not Material'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {standard.material_metrics}/{standard.total_metrics} metrics tracked
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {standard.materiality_percentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">coverage</div>
                  </div>
                </div>

                {standard.is_material && (
                  <div className="space-y-3 pt-4 border-t border-green-200 dark:border-green-800">
                    {/* Material Disclosures */}
                    {standard.material_disclosures && standard.material_disclosures.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Material Disclosures:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {standard.material_disclosures.map((disclosure) => (
                            <span
                              key={disclosure}
                              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {disclosure}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Peer Comparison */}
                    {standard.peer_adoption_avg && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>
                          {standard.peer_adoption_avg.toFixed(0)}% of peers track this standard
                        </span>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${standard.materiality_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {!standard.is_material && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <strong>Reason:</strong> {standard.not_material_metrics} of{' '}
                    {standard.total_metrics} metrics marked as not applicable to {industry}{' '}
                    operations.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRI 3-3: Management of Material Topics */}
      {activeSection === '3-3' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            GRI 3-3: Management of Material Topics
          </h2>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              For each material topic, we describe our management approach:
            </p>

            <div className="space-y-6">
              {materialityData
                .filter((std) => std.is_material)
                .map((standard) => (
                  <div
                    key={standard.gri_standard}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      GRI {standard.gri_standard} - {standard.standard_name}
                    </h3>

                    <div className="space-y-4 text-sm">
                      {/* Tracking & Measurement */}
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          📊 Tracking & Measurement:
                        </div>
                        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Metrics Tracked
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {standard.material_metrics}/{standard.total_metrics}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Coverage</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {standard.materiality_percentage.toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Peer Alignment
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {standard.peer_adoption_avg?.toFixed(0) || 0}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          🎯 Actions Taken:
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                          <li>Systematic data collection for {standard.material_metrics} key metrics</li>
                          <li>Monthly monitoring and reporting</li>
                          <li>Integration with {industry} best practices</li>
                        </ul>
                      </div>

                      {/* Next Steps */}
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ⚡ Improvement Opportunities:
                        </div>
                        {standard.materiality_percentage < 75 && (
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-300">
                            Consider tracking {standard.total_metrics - standard.material_metrics}{' '}
                            additional metrics to reach {industry} industry standards
                          </div>
                        )}
                        {standard.materiality_percentage >= 75 && (
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-800 dark:text-green-300">
                            ✅ Strong coverage aligned with industry best practices
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
