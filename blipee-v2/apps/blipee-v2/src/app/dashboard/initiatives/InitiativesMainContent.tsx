'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  ChevronDown,
  Calendar,
  Target,
  TrendingUp,
  User,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
} from 'lucide-react'
import type { InitiativeWithDetails, InitiativeStatus, InitiativePriority } from '@/lib/types/initiatives'
import styles from '../dashboard.module.css'
import initiativesStyles from './initiatives.module.css'
import { CreateInitiativeModal } from './CreateInitiativeModal'

interface InitiativesMainContentProps {
  initiatives: InitiativeWithDetails[]
  organizationId: string
}

export function InitiativesMainContent({ initiatives, organizationId }: InitiativesMainContentProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<'all' | InitiativeStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | InitiativePriority>('all')
  const [expandedInitiative, setExpandedInitiative] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Filter initiatives
  const filteredInitiatives = initiatives.filter((initiative) => {
    if (statusFilter !== 'all' && initiative.status !== statusFilter) return false
    if (priorityFilter !== 'all' && initiative.priority !== priorityFilter) return false
    return true
  })

  // Status icon helper
  const getStatusIcon = (status: InitiativeStatus) => {
    switch (status) {
      case 'in_progress':
        return <TrendingUp size={16} />
      case 'completed':
        return <CheckCircle size={16} />
      case 'planning':
        return <Clock size={16} />
      case 'on_hold':
        return <Pause size={16} />
      case 'cancelled':
        return <XCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  // Status color helper
  const getStatusColor = (status: InitiativeStatus) => {
    switch (status) {
      case 'in_progress':
        return 'blue'
      case 'completed':
        return 'green'
      case 'planning':
        return 'yellow'
      case 'on_hold':
        return 'gray'
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
    }
  }

  // Priority color helper
  const getPriorityColor = (priority: InitiativePriority) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'blue'
      case 'low':
        return 'gray'
      default:
        return 'gray'
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header with Title and Actions */}
      <div className={styles.dashboardHeader}>
        <div>
          <div className={styles.dashboardTitle}>
            <Target className={styles.carbonIcon} />
            <h1>Initiatives</h1>
          </div>
          <p className={styles.subtitle}>Track and manage your sustainability initiatives</p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className={styles.filterButton}>
          <Plus size={18} />
          New Initiative
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters} style={{ marginBottom: '2rem' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className={styles.filterButton}
          style={{ appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
        >
          <option value="all">All Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="planning">Planning</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className={styles.filterButton}
          style={{ appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Initiatives List */}
      {filteredInitiatives.length === 0 ? (
        <div className={styles.chartCard}>
          <div className={initiativesStyles.emptyState}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No initiatives found</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{ marginTop: '1rem' }}
              className={styles.filterButton}
            >
              <Plus size={18} />
              Create your first initiative
            </button>
          </div>
        </div>
      ) : (
        filteredInitiatives.map((initiative) => {
          const isExpanded = expandedInitiative === initiative.id
          const statusColor = getStatusColor(initiative.status)
          const priorityColor = getPriorityColor(initiative.priority)

          return (
            <div key={initiative.id} className={initiativesStyles.initiativeCard}>
              {/* Header */}
              <div
                className={initiativesStyles.initiativeCardHeader}
                onClick={() => setExpandedInitiative(isExpanded ? null : initiative.id)}
              >
                <div className={initiativesStyles.initiativeHeaderLeft}>
                  <div>
                    <h3 className={initiativesStyles.initiativeTitle}>{initiative.name}</h3>
                    <div className={initiativesStyles.initiativeMeta}>
                      <span className={initiativesStyles.metaItem}>
                        {initiative.metrics_count || 0} metrics tracked
                      </span>
                      {initiative.owner_name && (
                        <span className={initiativesStyles.metaItem}>
                          <User size={14} /> {initiative.owner_name}
                        </span>
                      )}
                      {initiative.target_date && (
                        <span className={initiativesStyles.metaItem}>
                          <Calendar size={14} /> Due: {new Date(initiative.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={initiativesStyles.initiativeHeaderRight}>
                  {/* Priority Badge */}
                  <span
                    className={`${initiativesStyles.priorityPill} ${initiativesStyles[`priority${priorityColor.charAt(0).toUpperCase() + priorityColor.slice(1)}`]}`}
                  >
                    {initiative.priority}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`${initiativesStyles.statusPill} ${initiativesStyles[`status${statusColor.charAt(0).toUpperCase() + statusColor.slice(1)}`]}`}
                  >
                    {getStatusIcon(initiative.status)}
                    {initiative.status.replace('_', ' ')}
                  </span>

                  {/* Progress */}
                  <div className={initiativesStyles.progressContainer}>
                    <div className={initiativesStyles.progressBar}>
                      <div
                        className={initiativesStyles.progressFill}
                        style={{ width: `${initiative.overall_progress || 0}%` }}
                      />
                    </div>
                    <span className={initiativesStyles.progressText}>
                      {Math.round(initiative.overall_progress || 0)}%
                    </span>
                  </div>

                  <ChevronDown
                    size={20}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      color: 'var(--text-tertiary)',
                    }}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className={initiativesStyles.initiativeBody}>
                  {initiative.description && (
                    <p className={initiativesStyles.initiativeDescription}>{initiative.description}</p>
                  )}

                  <div className={initiativesStyles.initiativeDetails}>
                    <div className={initiativesStyles.detailsGrid}>
                      {initiative.start_date && (
                        <div className={initiativesStyles.detailItem}>
                          <span className={initiativesStyles.detailLabel}>Start Date:</span>
                          <span className={initiativesStyles.detailValue}>
                            {new Date(initiative.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {initiative.budget && (
                        <div className={initiativesStyles.detailItem}>
                          <span className={initiativesStyles.detailLabel}>Budget:</span>
                          <span className={initiativesStyles.detailValue}>
                            €{initiative.budget.toLocaleString()}
                            {initiative.budget_spent > 0 &&
                              ` (${Math.round((initiative.budget_spent / initiative.budget) * 100)}% spent)`}
                          </span>
                        </div>
                      )}

                      <div className={initiativesStyles.detailItem}>
                        <span className={initiativesStyles.detailLabel}>Milestones:</span>
                        <span className={initiativesStyles.detailValue}>
                          {initiative.completed_milestones_count || 0} / {initiative.milestones_count || 0} completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={initiativesStyles.initiativeActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/initiatives/${initiative.id}`)
                      }}
                      className={initiativesStyles.actionButton}
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/initiatives/${initiative.id}/edit`)
                      }}
                      className={initiativesStyles.actionButtonSecondary}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Create Initiative Modal */}
      <CreateInitiativeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        organizationId={organizationId}
      />
    </div>
  )
}
