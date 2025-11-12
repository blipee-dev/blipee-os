'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Activity,
} from 'lucide-react'
import type { InitiativeWithDetails, InitiativeStatus, InitiativePriority } from '@/lib/types/initiatives'
import { deleteInitiative, toggleMilestone } from '@/app/actions/initiatives'
import styles from '../../gri/materiality/materiality.module.css'
import initiativesStyles from '../initiatives.module.css'

interface InitiativeDetailContentProps {
  initiative: InitiativeWithDetails
  organizationId: string
}

export function InitiativeDetailContent({ initiative, organizationId }: InitiativeDetailContentProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // Status icon helper
  const getStatusIcon = (status: InitiativeStatus) => {
    switch (status) {
      case 'in_progress':
        return <TrendingUp size={20} />
      case 'completed':
        return <CheckCircle size={20} />
      case 'planning':
        return <Clock size={20} />
      case 'on_hold':
        return <Pause size={20} />
      case 'cancelled':
        return <XCircle size={20} />
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
    }
  }

  const statusColor = getStatusColor(initiative.status)
  const priorityColor = getPriorityColor(initiative.priority)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this initiative? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteInitiative(initiative.id)

    if (result.success) {
      router.push('/dashboard/initiatives')
    } else {
      alert('Error deleting initiative: ' + result.error)
      setIsDeleting(false)
    }
  }

  const handleToggleMilestone = async (milestoneId: string) => {
    await toggleMilestone(milestoneId)
    router.refresh()
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.sectionCard}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push('/dashboard/initiatives')}
            className={styles.backButton}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '1.5rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to Initiatives
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h1 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                  {initiative.name}
                </h1>
                <span
                  className={`${initiativesStyles.priorityPill} ${initiativesStyles[`priority${priorityColor.charAt(0).toUpperCase() + priorityColor.slice(1)}`]}`}
                >
                  {initiative.priority}
                </span>
                <span
                  className={`${initiativesStyles.statusPill} ${initiativesStyles[`status${statusColor.charAt(0).toUpperCase() + statusColor.slice(1)}`]}`}
                >
                  {getStatusIcon(initiative.status)}
                  {initiative.status.replace('_', ' ')}
                </span>
              </div>

              {initiative.description && (
                <p className={styles.sectionDescription}>{initiative.description}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => router.push(`/dashboard/initiatives/${initiative.id}/edit`)}
                className={styles.exportButton}
                style={{ minWidth: 'auto' }}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={styles.exportButton}
                style={{
                  minWidth: 'auto',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
              {Math.round(initiative.overall_progress || 0)}%
            </span>
          </div>
          <div className={initiativesStyles.progressBar} style={{ height: '8px' }}>
            <div
              className={initiativesStyles.progressFill}
              style={{ width: `${initiative.overall_progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Dates Card */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            <Calendar size={18} /> Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {initiative.start_date && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  Start Date
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                  {new Date(initiative.start_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {initiative.target_date && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  Target Date
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                  {new Date(initiative.target_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {initiative.completion_date && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  Completed
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                  {new Date(initiative.completion_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget Card */}
        {initiative.budget && (
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: '1rem' }}>
              <DollarSign size={18} /> Budget
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  Total Budget
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
                  €{initiative.budget.toLocaleString()}
                </div>
              </div>
              {initiative.budget_spent > 0 && (
                <>
                  <div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                      Spent
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                      €{initiative.budget_spent.toLocaleString()} (
                      {Math.round((initiative.budget_spent / initiative.budget) * 100)}%)
                    </div>
                  </div>
                  <div className={initiativesStyles.progressBar} style={{ height: '6px' }}>
                    <div
                      className={initiativesStyles.progressFill}
                      style={{
                        width: `${Math.min((initiative.budget_spent / initiative.budget) * 100, 100)}%`,
                        background:
                          initiative.budget_spent > initiative.budget
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            : undefined,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Team Card */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            <Users size={18} /> Team
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {initiative.owner_name && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  Owner
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <User size={14} /> {initiative.owner_name}
                </div>
              </div>
            )}
            {initiative.team_members && initiative.team_members.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  Team Members
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                  {initiative.team_members.length} member(s)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle}>
            <Target size={20} /> Tracked Metrics ({initiative.metrics?.length || 0})
          </h2>
          <button
            onClick={() => router.push(`/dashboard/initiatives/${initiative.id}/add-metrics`)}
            className={styles.exportButton}
          >
            <Plus size={16} />
            Add Metrics
          </button>
        </div>

        {initiative.metrics && initiative.metrics.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {initiative.metrics.map((metric) => (
              <div
                key={metric.id}
                className={initiativesStyles.initiativeCard}
                style={{ marginBottom: 0 }}
              >
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' }}>
                        {metric.metric_code}
                      </div>
                      {metric.notes && (
                        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>{metric.notes}</div>
                      )}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
                        {metric.baseline_value !== null && (
                          <div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Baseline: </span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                              {metric.baseline_value} {metric.target_unit}
                            </span>
                          </div>
                        )}
                        {metric.target_value !== null && (
                          <div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Target: </span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                              {metric.target_value} {metric.target_unit}
                            </span>
                          </div>
                        )}
                        {metric.current_value !== null && (
                          <div>
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Current: </span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                              {metric.current_value} {metric.target_unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={initiativesStyles.progressContainer} style={{ minWidth: '140px' }}>
                      <div className={initiativesStyles.progressBar}>
                        <div
                          className={initiativesStyles.progressFill}
                          style={{ width: `${metric.progress_percentage || 0}%` }}
                        />
                      </div>
                      <span className={initiativesStyles.progressText}>
                        {Math.round(metric.progress_percentage || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No metrics tracked yet</p>
            <button
              onClick={() => router.push(`/dashboard/initiatives/${initiative.id}/add-metrics`)}
              style={{ marginTop: '1rem' }}
              className={styles.exportButton}
            >
              <Plus size={18} />
              Add your first metric
            </button>
          </div>
        )}
      </div>

      {/* Milestones Section */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle}>
            <CheckCircle size={20} /> Milestones ({initiative.completed_milestones_count || 0} /{' '}
            {initiative.milestones_count || 0})
          </h2>
          <button
            onClick={() => router.push(`/dashboard/initiatives/${initiative.id}/add-milestone`)}
            className={styles.exportButton}
          >
            <Plus size={16} />
            Add Milestone
          </button>
        </div>

        {initiative.milestones && initiative.milestones.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {initiative.milestones
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((milestone) => (
                <div
                  key={milestone.id}
                  style={{
                    padding: '12px 16px',
                    background: milestone.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${milestone.completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleToggleMilestone(milestone.id)}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: `2px solid ${milestone.completed ? '#10b981' : 'rgba(255, 255, 255, 0.3)'}`,
                      background: milestone.completed ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {milestone.completed && <CheckCircle size={14} color="white" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: milestone.completed ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                        textDecoration: milestone.completed ? 'line-through' : 'none',
                      }}
                    >
                      {milestone.title}
                    </div>
                    {milestone.description && (
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                        {milestone.description}
                      </div>
                    )}
                  </div>
                  {milestone.due_date && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Calendar size={12} />
                      {new Date(milestone.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No milestones defined yet</p>
            <button
              onClick={() => router.push(`/dashboard/initiatives/${initiative.id}/add-milestone`)}
              style={{ marginTop: '1rem' }}
              className={styles.exportButton}
            >
              <Plus size={18} />
              Add your first milestone
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
