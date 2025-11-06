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
import styles from './materiality.module.css'

interface MaterialityContentProps {
  materialityData: GRIMateriality[]
  organizationName: string
  industry: string
  totalMetrics: number
  materialMetrics: number
}

export function MaterialityContent({
  materialityData,
  organizationName,
  industry,
  totalMetrics,
  materialMetrics,
}: MaterialityContentProps) {
  const [activeSection, setActiveSection] = useState<'3-1' | '3-2' | '3-3'>('3-2')

  const handleExportPDF = async () => {
    alert('PDF export coming soon!')
  }

  return (
    <div className={styles.container}>
      {/* GRI Section Navigation Card */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>GRI 3: Material Topics Assessment</h2>
            <p className={styles.sectionDescription}>Review your materiality determination process and results</p>
          </div>
          <button onClick={handleExportPDF} className={styles.exportButton}>
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className={styles.tabNavigation}>
          {[
            { id: '3-1', label: 'GRI 3-1: Process' },
            { id: '3-2', label: 'GRI 3-2: List of Topics' },
            { id: '3-3', label: 'GRI 3-3: Management' },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`${styles.tabButton} ${activeSection === section.id ? styles.tabButtonActive : ''}`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRI 3-1: Process to Determine Material Topics */}
      {activeSection === '3-1' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>GRI 3-1: Process to Determine Material Topics</h2>
              <p className={styles.sectionDescription}>Our systematic approach to materiality assessment</p>
            </div>
          </div>

          <div className={styles.processContent}>
            <h3>Materiality Assessment Process</h3>

            <p>
              {organizationName} determined its material topics through a systematic review of
              business operations, industry benchmarks, and regulatory requirements for the{' '}
              {industry} sector.
            </p>

            <h4>Our Process Included:</h4>
            <ol>
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

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Metrics Assessed</div>
                <div className={styles.statValue}>{totalMetrics}</div>
                <div className={styles.statSubtext}>across GRI 301-308</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statLabel}>Determined Material</div>
                <div className={styles.statValue}>{materialMetrics}</div>
                <div className={styles.statSubtext}>
                  {totalMetrics > 0 ? ((materialMetrics / totalMetrics) * 100).toFixed(0) : 0}% of total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRI 3-2: List of Material Topics */}
      {activeSection === '3-2' && (
        <>
          {materialityData.map((standard) => (
            <div
              key={standard.gri_standard}
              className={`${styles.standardCard} ${
                standard.is_material ? styles.standardCardMaterial : styles.standardCardNotMaterial
              }`}
            >
              <div className={styles.standardHeader}>
                <div className={styles.standardTitleSection}>
                  {standard.is_material ? (
                    <CheckCircle className={styles.standardIcon} />
                  ) : (
                    <XCircle className={styles.standardIconNotMaterial} />
                  )}
                  <div>
                    <h2 className={styles.standardTitle}>
                      GRI {standard.gri_standard} - {standard.standard_name}
                    </h2>
                    <p className={styles.standardMeta}>
                      {standard.material_metrics}/{standard.total_metrics} metrics tracked •{' '}
                      <span className={standard.is_material ? styles.standardMetaMaterial : ''}>
                        {standard.is_material ? 'Material' : 'Not Material'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.standardPercentage}>
                  <div className={styles.percentageValue}>
                    {standard.materiality_percentage.toFixed(0)}%
                  </div>
                  <div className={styles.percentageLabel}>coverage</div>
                </div>
              </div>

              {standard.is_material && (
                <div className={styles.standardDetails}>
                  {/* Material Disclosures */}
                  {standard.material_disclosures && standard.material_disclosures.length > 0 && (
                    <div className={styles.disclosuresSection}>
                      <div className={styles.disclosuresLabel}>Material Disclosures:</div>
                      <div className={styles.disclosuresList}>
                        {standard.material_disclosures.map((disclosure) => (
                          <span key={disclosure} className={styles.disclosureBadge}>
                            {disclosure}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Peer Comparison */}
                  {standard.peer_adoption_avg && (
                    <div className={styles.peerInfo}>
                      <Users className={styles.peerIcon} />
                      <span>{standard.peer_adoption_avg.toFixed(0)}% of peers track this standard</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${standard.materiality_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {!standard.is_material && (
                <div className={styles.notMaterialReason}>
                  <strong>Reason:</strong> {standard.not_material_metrics} of{' '}
                  {standard.total_metrics} metrics marked as not applicable to {industry} operations.
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* GRI 3-3: Management of Material Topics */}
      {activeSection === '3-3' && (
        <>
          {materialityData
            .filter((std) => std.is_material)
            .map((standard) => (
              <div key={standard.gri_standard} className={styles.standardCard}>
                <div className={styles.standardHeader}>
                  <div>
                    <h2 className={styles.standardTitle}>
                      GRI {standard.gri_standard} - {standard.standard_name}
                    </h2>
                    <p className={styles.sectionDescription}>Management approach and improvement opportunities</p>
                  </div>
                </div>

                <div className={styles.managementContent}>
                  {/* Tracking & Measurement */}
                  <div className={styles.managementSection}>
                    <div className={styles.managementLabel}>
                      📊 Tracking & Measurement:
                    </div>
                    <div className={styles.managementGrid}>
                      <div className={styles.managementMetric}>
                        <div className={styles.managementMetricLabel}>Metrics Tracked</div>
                        <div className={styles.managementMetricValue}>
                          {standard.material_metrics}/{standard.total_metrics}
                        </div>
                      </div>
                      <div className={styles.managementMetric}>
                        <div className={styles.managementMetricLabel}>Coverage</div>
                        <div className={styles.managementMetricValue}>
                          {standard.materiality_percentage.toFixed(0)}%
                        </div>
                      </div>
                      <div className={styles.managementMetric}>
                        <div className={styles.managementMetricLabel}>Peer Alignment</div>
                        <div className={styles.managementMetricValue}>
                          {standard.peer_adoption_avg?.toFixed(0) || 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.managementSection}>
                    <div className={styles.managementLabel}>
                      🎯 Actions Taken:
                    </div>
                    <ul className={styles.managementList}>
                      <li>Systematic data collection for {standard.material_metrics} key metrics</li>
                      <li>Monthly monitoring and reporting</li>
                      <li>Integration with {industry} best practices</li>
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div className={styles.managementSection}>
                    <div className={styles.managementLabel}>
                      ⚡ Improvement Opportunities:
                    </div>
                    {standard.materiality_percentage < 75 && (
                      <div className={`${styles.alertBox} ${styles.alertWarning}`}>
                        Consider tracking {standard.total_metrics - standard.material_metrics}{' '}
                        additional metrics to reach {industry} industry standards
                      </div>
                    )}
                    {standard.materiality_percentage >= 75 && (
                      <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                        ✅ Strong coverage aligned with industry best practices
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  )
}
