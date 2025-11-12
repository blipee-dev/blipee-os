'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2, XCircle, Zap } from 'lucide-react'
import type { DisclosureGroupOpportunity } from '@/lib/data/gri'
import styles from './materiality.module.css'
import type { MetricStatus } from '@/app/actions/gri/metricTracking'

interface DisclosureCardProps {
  disclosure: DisclosureGroupOpportunity
  defaultExpanded?: boolean
  metricStatuses?: Map<string, MetricStatus>
  onStatusChange?: (metricCode: string, status: MetricStatus | null) => void
}

export function DisclosureCard({
  disclosure,
  defaultExpanded = false,
  metricStatuses = new Map(),
  onStatusChange
}: DisclosureCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())

  // Difficulty badge
  const getDifficultyBadge = () => {
    const badgeClasses = {
      easy: styles.difficultyBadgeEasy,
      medium: styles.difficultyBadgeMedium,
      hard: styles.difficultyBadgeHard,
    }
    const labels = {
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil',
    }

    return (
      <span className={badgeClasses[disclosure.avg_difficulty]}>
        {labels[disclosure.avg_difficulty]}
      </span>
    )
  }

  // Priority badge
  const getPriorityBadge = () => {
    if (disclosure.highest_priority === 'high') {
      return <span className={styles.priorityBadgeHigh}>Alta</span>
    }
    if (disclosure.highest_priority === 'medium') {
      return <span className={styles.priorityBadgeMedium}>Média</span>
    }
    return <span className={styles.priorityBadgeLow}>Baixa</span>
  }

  const coverage = disclosure.metrics_tracking > 0
    ? Math.round((disclosure.metrics_tracking / disclosure.total_metrics) * 100)
    : 0

  // Toggle bulk selection for a metric
  const toggleBulkSelection = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedForBulk)
    if (newSelected.has(code)) {
      newSelected.delete(code)
    } else {
      newSelected.add(code)
    }
    setSelectedForBulk(newSelected)
  }

  // Select all metrics in this disclosure
  const selectAll = () => {
    if (selectedForBulk.size === disclosure.metrics_available.length) {
      setSelectedForBulk(new Set())
    } else {
      setSelectedForBulk(new Set(disclosure.metrics_available.map(m => m.code)))
    }
  }

  // Apply status to all selected
  const applyBulkAction = (status: MetricStatus) => {
    selectedForBulk.forEach(code => {
      onStatusChange?.(code, status)
    })
    setSelectedForBulk(new Set())
  }

  return (
    <div className={styles.disclosureCard}>
      {/* Header (collapsed view) */}
      <div
        className={styles.disclosureCardHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.disclosureCardHeaderLeft}>
          <div className={styles.disclosureCardInfo}>
            <div className={styles.disclosureCardTitle}>
              <span className={styles.disclosureCode}>GRI {disclosure.disclosure}</span>
              <span className={styles.disclosureTitle}>{disclosure.disclosure_title}</span>
            </div>
            <div className={styles.disclosureCardMeta}>
              <span className={styles.metaItem}>
                {disclosure.metrics_available.length} métrica{disclosure.metrics_available.length !== 1 ? 's' : ''} disponíve{disclosure.metrics_available.length !== 1 ? 'is' : 'l'}
              </span>
              {disclosure.metrics_tracking > 0 && (
                <span className={styles.metaItem}>
                  • {disclosure.metrics_tracking} tracked ({coverage}%)
                </span>
              )}
              {disclosure.has_quick_wins && (
                <span className={styles.quickWinPill}>
                  <Zap size={12} /> {disclosure.quick_win_count} Quick Win{disclosure.quick_win_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.disclosureCardHeaderRight}>
          {getPriorityBadge()}
          {getDifficultyBadge()}
          <ChevronDown
            size={18}
            className={styles.expandIcon}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              marginLeft: '8px'
            }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className={styles.disclosureCardBody}>
          <p className={styles.disclosureDescription}>
            {disclosure.disclosure_description}
          </p>

          {/* Bulk Actions Bar */}
          {selectedForBulk.size > 0 && (
            <div className={styles.bulkActionsBarCompact}>
              <div className={styles.bulkActionsInfo}>
                <span className={styles.bulkCount}>{selectedForBulk.size} selected</span>
                <button onClick={() => setSelectedForBulk(new Set())} className={styles.bulkClear}>
                  Clear
                </button>
              </div>
              <div className={styles.bulkActionsGroup}>
                <button onClick={() => applyBulkAction('add_to_tracking')} className={styles.bulkPillTrack}>
                  <CheckCircle2 size={14} /> Track
                </button>
                <button onClick={() => applyBulkAction('not_priority')} className={styles.bulkPillSkip}>
                  Skip
                </button>
                <button onClick={() => applyBulkAction('not_applicable')} className={styles.bulkPillDismiss}>
                  <XCircle size={14} /> Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Metrics list header with select all */}
          <div className={styles.metricsListHeader}>
            <h4 className={styles.metricsListTitle}>
              Available Metrics ({disclosure.metrics_available.length})
            </h4>
            <button onClick={selectAll} className={styles.selectAllBtn}>
              {selectedForBulk.size === disclosure.metrics_available.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className={styles.metricsList}>
            {disclosure.metrics_available.map((metric) => {
              const isSelected = selectedMetric === metric.code
              const isChecked = selectedForBulk.has(metric.code)
              const currentStatus = metricStatuses.get(metric.code)

              return (
                <div key={metric.code} className={styles.metricItemWrapper}>
                  <div
                    className={`${styles.metricItem} ${isSelected ? styles.metricItemExpanded : ''}`}
                    onClick={() => setSelectedMetric(isSelected ? null : metric.code)}
                  >
                    <div className={styles.metricItemLeft}>
                      <div
                        className={styles.metricCheckbox}
                        onClick={(e) => toggleBulkSelection(metric.code, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                        />
                      </div>
                      <div className={styles.metricInfo}>
                        <div className={styles.metricName}>{metric.name}</div>
                        <div className={styles.metricMeta}>
                          <span className={styles.metricCategory}>{metric.category}</span>
                          {metric.subcategory && (
                            <span className={styles.metricSubcategory}>› {metric.subcategory}</span>
                          )}
                          <span className={styles.metricUnit}>• {metric.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.metricItemRight}>
                      {metric.is_quick_win && (
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
                        style={{ transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className={styles.metricDetails}>
                      <div className={styles.metricDetailsContent}>
                        {metric.description && (
                          <p className={styles.metricDescription}>{metric.description}</p>
                        )}
                        <div className={styles.metricProps}>
                          <div className={styles.metricProp}>
                            <span className={styles.metricPropLabel}>Difficulty:</span>
                            <span className={styles.metricPropValue}>
                              {metric.difficulty === 'easy' && '🟢 Easy'}
                              {metric.difficulty === 'medium' && '🟡 Medium'}
                              {metric.difficulty === 'hard' && '🔴 Hard'}
                            </span>
                          </div>
                          <div className={styles.metricProp}>
                            <span className={styles.metricPropLabel}>Priority:</span>
                            <span className={styles.metricPropValue}>
                              {metric.priority === 'high' && 'High'}
                              {metric.priority === 'medium' && 'Medium'}
                              {metric.priority === 'low' && 'Low'}
                            </span>
                          </div>
                          <div className={styles.metricProp}>
                            <span className={styles.metricPropLabel}>Scope:</span>
                            <span className={styles.metricPropValue}>{metric.scope}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Pills */}
                      <div className={styles.metricActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusChange?.(metric.code, currentStatus === 'add_to_tracking' ? null : 'add_to_tracking')
                          }}
                          className={`${styles.actionPill} ${currentStatus === 'add_to_tracking' ? styles.actionPillActive : ''}`}
                        >
                          <CheckCircle2 size={16} /> Track this metric
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusChange?.(metric.code, currentStatus === 'not_priority' ? null : 'not_priority')
                          }}
                          className={`${styles.actionPill} ${currentStatus === 'not_priority' ? styles.actionPillActive : ''}`}
                        >
                          Skip for now
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusChange?.(metric.code, currentStatus === 'not_applicable' ? null : 'not_applicable')
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
            })}
          </div>
        </div>
      )}
    </div>
  )
}
