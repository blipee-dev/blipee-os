'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Zap, Target, ChevronDown, CheckCircle2 } from 'lucide-react'
import type { GapAnalysisDashboard, MetricOpportunity } from '@/lib/data/gri'
import { DisclosureCard } from './DisclosureCard'
import styles from './materiality.module.css'
import { updateMetricStatus, type MetricStatus } from '@/app/actions/gri/metricTracking'

interface GapAnalysisContentProps {
  data: GapAnalysisDashboard
  initialStatuses?: Map<string, MetricStatus>
}

export function GapAnalysisContent({ data, initialStatuses }: GapAnalysisContentProps) {
  const t = useTranslations('gri.gapAnalysis')
  const [activeTab, setActiveTab] = useState<'overview' | 'explore'>('overview')

  // Explore tab filters
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'quick-wins' | 'high-priority' | 'sector-recommended'>('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'scope_1' | 'scope_2' | 'scope_3'>('all')
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(new Set())

  // Metric tracking status (metric_code -> status)
  const [metricStatuses, setMetricStatuses] = useState<Map<string, MetricStatus>>(initialStatuses || new Map())

  // Loading state for async operations
  const [isSaving, setIsSaving] = useState(false)

  // Handler for changing metric status
  const handleMetricStatusChange = async (metricCode: string, status: MetricStatus | null) => {
    // Optimistic update
    setMetricStatuses(prev => {
      const newMap = new Map(prev)
      if (status === null) {
        newMap.delete(metricCode)
      } else {
        newMap.set(metricCode, status)
      }
      return newMap
    })

    // Save to backend
    setIsSaving(true)
    const result = await updateMetricStatus(metricCode, status)
    setIsSaving(false)

    if (!result.success) {
      console.error('Failed to update metric status:', result.error)
      // Revert on error - restore to the state before the optimistic update
      setMetricStatuses(initialStatuses || new Map())
    }
  }


  return (
    <div className={styles.container}>
      {/* Saving indicator - minimal */}
      {isSaving && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(255, 255, 255, 0.7)',
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderTop: '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          Saving
        </div>
      )}

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabButtonActive : ''}`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`${styles.tabButton} ${activeTab === 'explore' ? styles.tabButtonActive : ''}`}
        >
          🔍 Explore Metrics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* High Priority Opportunities */}
          {data.high_priority_opportunities.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <AlertCircle className="w-5 h-5 inline mr-2 text-orange-500" />
                    {t('sections.highPriority')}
                  </h2>
                  <p className={styles.sectionDescription}>
                    {t('sections.highPriorityDesc')} {data.industry_sector}
                  </p>
                </div>
              </div>

              <div className={styles.opportunitiesList}>
                {data.high_priority_opportunities.slice(0, 10).map((opp) => (
                  <OpportunityCard
                    key={opp.code}
                    opportunity={opp}
                    metricStatuses={metricStatuses}
                    onStatusChange={handleMetricStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sector Recommended */}
          {data.sector_recommended_opportunities.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <TrendingUp className="w-5 h-5 inline mr-2 text-blue-500" />
                    {t('sections.sectorRecommended')}
                  </h2>
                  <p className={styles.sectionDescription}>
                    {t('sections.sectorRecommendedDesc')} {data.industry_sector}
                  </p>
                </div>
              </div>

              <div className={styles.opportunitiesList}>
                {data.sector_recommended_opportunities.slice(0, 8).map((opp) => (
                  <OpportunityCard
                    key={opp.code}
                    opportunity={opp}
                    metricStatuses={metricStatuses}
                    onStatusChange={handleMetricStatusChange}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Explore Metrics Tab */}
      {activeTab === 'explore' && (
        <>
          {/* Filters Section */}
          <div className={styles.sectionCard}>
            <div className={styles.filtersGrid}>
              {/* Priority Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>🎯 Filter by priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Metrics</option>
                  <option value="quick-wins">Quick Wins Only ({data.total_quick_wins})</option>
                  <option value="high-priority">High Priority Only</option>
                  <option value="sector-recommended">Sector Recommended Only</option>
                </select>
              </div>

              {/* Scope Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>🌍 Filter by scope:</label>
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as any)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Scopes</option>
                  <option value="scope_1">Scope 1 - Direct Emissions</option>
                  <option value="scope_2">Scope 2 - Electricity</option>
                  <option value="scope_3">Scope 3 - Value Chain</option>
                </select>
              </div>
            </div>
          </div>


          {/* Hierarchical View: Standards → Disclosures → Metrics */}
          {data.disclosure_groups && data.disclosure_groups.length > 0 ? (
            (() => {
              // Group disclosures by standard
              const disclosuresByStandard = new Map<string, typeof data.disclosure_groups>()

              data.disclosure_groups.forEach((disclosure) => {
                // Apply filters
                let filteredMetrics = disclosure.metrics_available

                // Apply scope filter
                if (scopeFilter !== 'all') {
                  filteredMetrics = filteredMetrics.filter(m => m.scope === scopeFilter)
                }

                // Apply priority filter
                if (priorityFilter === 'quick-wins') {
                  filteredMetrics = filteredMetrics.filter(m => m.is_quick_win)
                } else if (priorityFilter === 'high-priority') {
                  filteredMetrics = filteredMetrics.filter(m => m.priority === 'high')
                } else if (priorityFilter === 'sector-recommended') {
                  filteredMetrics = filteredMetrics.filter(m => m.is_sector_recommended)
                }

                if (filteredMetrics.length === 0) return

                const standard = disclosure.gri_standard
                if (!disclosuresByStandard.has(standard)) {
                  disclosuresByStandard.set(standard, [])
                }

                disclosuresByStandard.get(standard)!.push({
                  ...disclosure,
                  metrics_available: filteredMetrics,
                  total_metrics: filteredMetrics.length,
                })
              })

              const toggleStandard = (standard: string) => {
                const newExpanded = new Set(expandedStandards)
                if (newExpanded.has(standard)) {
                  newExpanded.delete(standard)
                } else {
                  newExpanded.add(standard)
                }
                setExpandedStandards(newExpanded)
              }

              return Array.from(disclosuresByStandard.entries()).length > 0 ? (
                Array.from(disclosuresByStandard.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([standard, disclosures]) => {
                    const isExpanded = expandedStandards.has(standard)
                    const totalMetrics = disclosures.reduce((sum, d) => sum + d.metrics_available.length, 0)

                    return (
                      <div key={standard} className={styles.standardCard}>
                        {/* Standard Header - Clickable */}
                        <div
                          className={styles.standardHeader}
                          onClick={() => toggleStandard(standard)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.standardTitleSection}>
                            <div>
                              <h2 className={styles.standardTitle}>
                                GRI {standard} - {t(`standards.${standard}`)}
                              </h2>
                              <p className={styles.standardMeta}>
                                {disclosures.length} disclosure{disclosures.length !== 1 ? 's' : ''} • {totalMetrics} métrica{totalMetrics !== 1 ? 's' : ''} disponível{totalMetrics !== 1 ? 'is' : ''}
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            size={20}
                            className={styles.expandIcon}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                        </div>

                        {/* Disclosures List (when expanded) */}
                        {isExpanded && (
                          <div className={styles.disclosuresSection}>
                            {disclosures.map((disclosure) => (
                              <DisclosureCard
                                key={disclosure.disclosure}
                                disclosure={disclosure}
                                defaultExpanded={false}
                                metricStatuses={metricStatuses}
                                onStatusChange={handleMetricStatusChange}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
              ) : (
                <div className={styles.sectionCard}>
                  <div className={styles.emptyState}>
                    <p>Nenhuma métrica encontrada com os filtros selecionados.</p>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className={styles.sectionCard}>
              <div className={styles.emptyState}>
                <p>Nenhuma divulgação disponível.</p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}

// Sophisticated Opportunity Card Component
function OpportunityCard({
  opportunity,
  metricStatuses,
  onStatusChange
}: {
  opportunity: MetricOpportunity
  metricStatuses?: Map<string, MetricStatus>
  onStatusChange?: (metricCode: string, status: MetricStatus | null) => void
}) {
  const t = useTranslations('gri.gapAnalysis')
  const [isExpanded, setIsExpanded] = useState(false)

  const currentStatus = metricStatuses?.get(opportunity.code)

  return (
    <div className={styles.opportunityCardSophisticated}>
      <div
        className={`${styles.opportunityCardHeader} ${isExpanded ? styles.opportunityCardHeaderExpanded : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.opportunityHeaderLeft}>
          <div className={styles.opportunityInfo}>
            <h4 className={styles.opportunityTitle}>{opportunity.name}</h4>
            <p className={styles.opportunityMeta}>
              {opportunity.category}
              {opportunity.subcategory && ` › ${opportunity.subcategory}`} • {opportunity.unit}
            </p>
          </div>
        </div>

        <div className={styles.opportunityHeaderRight}>
          {opportunity.is_quick_win && (
            <span className={styles.quickWinPill}>Quick Win</span>
          )}
          {currentStatus && (
            <span className={styles.statusPill}>
              {currentStatus === 'add_to_tracking' && '✓ Tracking'}
              {currentStatus === 'not_priority' && 'Skipped'}
              {currentStatus === 'not_applicable' && '✗ Dismissed'}
            </span>
          )}
          <ChevronDown
            size={16}
            className={styles.expandIcon}
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className={styles.opportunityDetailsExpanded}>
          <div className={styles.opportunityDetailsContent}>
            {opportunity.description && (
              <p className={styles.metricDescription}>{opportunity.description}</p>
            )}

            <div className={styles.metricProps}>
              <div className={styles.metricProp}>
                <span className={styles.metricPropLabel}>Difficulty:</span>
                <span className={styles.metricPropValue}>
                  {opportunity.difficulty === 'easy' && '🟢 Easy'}
                  {opportunity.difficulty === 'medium' && '🟡 Medium'}
                  {opportunity.difficulty === 'hard' && '🔴 Hard'}
                </span>
              </div>
              <div className={styles.metricProp}>
                <span className={styles.metricPropLabel}>Priority:</span>
                <span className={styles.metricPropValue}>
                  {opportunity.priority === 'high' && 'High'}
                  {opportunity.priority === 'medium' && 'Medium'}
                  {opportunity.priority === 'low' && 'Low'}
                </span>
              </div>
              <div className={styles.metricProp}>
                <span className={styles.metricPropLabel}>Impact:</span>
                <span className={styles.metricPropValue}>
                  {opportunity.impact === 'high' && '⭐⭐⭐ High'}
                  {opportunity.impact === 'medium' && '⭐⭐ Medium'}
                  {opportunity.impact === 'low' && '⭐ Low'}
                </span>
              </div>
              <div className={styles.metricProp}>
                <span className={styles.metricPropLabel}>Scope:</span>
                <span className={styles.metricPropValue}>{opportunity.scope}</span>
              </div>
              {opportunity.peer_adoption_rate !== null && (
                <div className={styles.metricProp}>
                  <span className={styles.metricPropLabel}>Peer Adoption:</span>
                  <span className={styles.metricPropValue}>
                    👥 {opportunity.peer_adoption_rate.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Pills */}
          <div className={styles.metricActions}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange?.(opportunity.code, currentStatus === 'add_to_tracking' ? null : 'add_to_tracking')
              }}
              className={`${styles.actionPill} ${currentStatus === 'add_to_tracking' ? styles.actionPillActive : ''}`}
            >
              <CheckCircle2 size={16} /> Track this metric
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange?.(opportunity.code, currentStatus === 'not_priority' ? null : 'not_priority')
              }}
              className={`${styles.actionPill} ${currentStatus === 'not_priority' ? styles.actionPillActive : ''}`}
            >
              Skip for now
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange?.(opportunity.code, currentStatus === 'not_applicable' ? null : 'not_applicable')
              }}
              className={`${styles.actionPill} ${currentStatus === 'not_applicable' ? styles.actionPillActive : ''}`}
            >
              <XCircle size={16} /> Not applicable
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
