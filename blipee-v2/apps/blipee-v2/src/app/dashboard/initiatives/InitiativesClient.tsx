'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  HelpCircle,
  RotateCcw,
  TrendingUp,
  Activity,
  AlertTriangle,
  Info,
  Edit3,
} from 'lucide-react'
import type { DismissedMetric, DismissedBreakdown } from '@/lib/data/initiatives'

interface InitiativesClientProps {
  dismissedMetrics: {
    not_material: DismissedMetric[]
    can_reactivate: DismissedMetric[]
    all: DismissedMetric[]
  }
  stats: {
    total_dismissed: number
    can_reactivate: number
    permanently_dismissed: number
    affects_materiality: number
  }
  breakdown: DismissedBreakdown[]
  organizationId: string
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'not_material':
      return XCircle
    case 'not_priority':
      return Clock
    case 'already_tracking':
      return CheckCircle
    case 'data_not_available':
      return AlertCircle
    case 'cost_prohibitive':
      return DollarSign
    default:
      return HelpCircle
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'not_material':
      return 'red'
    case 'not_priority':
      return 'yellow'
    case 'already_tracking':
      return 'green'
    case 'data_not_available':
      return 'orange'
    case 'cost_prohibitive':
      return 'purple'
    default:
      return 'gray'
  }
}

export function InitiativesClient({
  dismissedMetrics,
  stats,
  breakdown,
  organizationId,
}: InitiativesClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dismissed' | 'materiality'>('dismissed')
  const [reactivating, setReactivating] = useState<string | null>(null)
  const [recategorizing, setRecategorizing] = useState<string | null>(null)
  const [recategorizeModal, setRecategorizeModal] = useState<{
    isOpen: boolean
    metricId: string
    metricName: string
    currentCategory: string
  }>({
    isOpen: false,
    metricId: '',
    metricName: '',
    currentCategory: '',
  })

  const handleReactivate = async (recommendationId: string) => {
    const reason = prompt('Why are you reactivating this metric?')
    if (!reason) return

    setReactivating(recommendationId)

    try {
      const response = await fetch('/api/sustainability/recommendations/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          reason,
        }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to reactivate metric')
      }
    } catch (error) {
      console.error('Error reactivating metric:', error)
      alert('An error occurred')
    } finally {
      setReactivating(null)
    }
  }

  const handleRecategorize = async (
    category: string,
    notes: string
  ) => {
    if (!recategorizeModal.metricId) return

    setRecategorizing(recategorizeModal.metricId)

    try {
      const response = await fetch('/api/sustainability/recommendations/recategorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recategorizeModal.metricId,
          new_category: category,
          notes,
        }),
      })

      if (response.ok) {
        setRecategorizeModal({ isOpen: false, metricId: '', metricName: '', currentCategory: '' })
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to recategorize metric')
      }
    } catch (error) {
      console.error('Error recategorizing metric:', error)
      alert('An error occurred')
    } finally {
      setRecategorizing(null)
    }
  }

  const openRecategorizeModal = (
    metricId: string,
    metricName: string,
    currentCategory: string
  ) => {
    setRecategorizeModal({
      isOpen: true,
      metricId,
      metricName,
      currentCategory,
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Initiatives & Materiality</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Track dismissed metrics and review your materiality assessment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Dismissed</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total_dismissed}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Can Reactivate</span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.can_reactivate}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Not Material</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.permanently_dismissed}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Affects Materiality</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.affects_materiality}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('dismissed')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dismissed'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📊 Dismissed Metrics ({stats.total_dismissed})
          </button>
          <button
            onClick={() => setActiveTab('materiality')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'materiality'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            🎯 Materiality Assessment
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dismissed' && (
        <div className="space-y-6">
          {/* Breakdown by Category */}
          {breakdown.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Dismissal Breakdown
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {breakdown.map((cat) => {
                      const Icon = getCategoryIcon(cat.category)
                      const color = getCategoryColor(cat.category)
                      return (
                        <div
                          key={cat.category}
                          className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400"
                        >
                          <Icon className={`w-4 h-4 text-${color}-600`} />
                          <span>
                            {cat.category_label}: <strong>{cat.metric_count}</strong>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Can Reactivate Section */}
          {dismissedMetrics.can_reactivate.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Can Re-activate Later ({dismissedMetrics.can_reactivate.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These metrics were dismissed but can be reconsidered when priorities change.
              </p>

              <div className="space-y-3">
                {dismissedMetrics.can_reactivate.map((metric) => {
                  const Icon = getCategoryIcon(metric.dismissed_category)
                  const color = getCategoryColor(metric.dismissed_category)

                  return (
                    <div
                      key={metric.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex-shrink-0`}>
                              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {metric.metric_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {metric.recommendation_reason}
                              </p>
                            </div>
                          </div>

                          {/* Dismiss Info */}
                          <div className="pl-14 space-y-2">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className={`px-2 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400 text-xs rounded`}>
                                {metric.dismissed_category.replace('_', ' ')}
                              </span>
                              {metric.dismissed_notes?.includes('Migrated from legacy') && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Needs Recategorization
                                </span>
                              )}
                              {metric.gri_disclosure && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                  {metric.gri_disclosure}
                                </span>
                              )}
                              {metric.peer_adoption_percent && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  📊 {metric.peer_adoption_percent.toFixed(0)}% peer adoption
                                </span>
                              )}
                            </div>

                            {metric.dismissed_notes && (
                              <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-sm text-gray-700 dark:text-gray-300">
                                "{metric.dismissed_notes}"
                              </div>
                            )}

                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Dismissed on {new Date(metric.dismissed_at).toLocaleDateString()} by{' '}
                              {metric.dismissed_by}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openRecategorizeModal(
                              metric.id,
                              metric.metric_name,
                              metric.dismissed_category
                            )}
                            disabled={recategorizing === metric.id}
                            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Edit3 className="w-4 h-4" />
                            {recategorizing === metric.id ? 'Updating...' : 'Update Category'}
                          </button>
                          <button
                            onClick={() => handleReactivate(metric.id)}
                            disabled={reactivating === metric.id}
                            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {reactivating === metric.id ? 'Reactivating...' : 'Re-activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Not Material Section */}
          {dismissedMetrics.not_material.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Not Material to Business ({dismissedMetrics.not_material.length})
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    These metrics don't apply to your business and won't be recommended again.
                    This forms the basis of your GRI materiality assessment.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {dismissedMetrics.not_material.map((metric) => (
                  <div
                    key={metric.id}
                    className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {metric.metric_name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {metric.dismissed_notes || metric.recommendation_reason}
                        </p>
                        {metric.gri_disclosure && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {metric.gri_disclosure}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.total_dismissed === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No dismissed metrics yet. Start by reviewing your metric recommendations.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'materiality' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <Info className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <p className="text-blue-900 dark:text-blue-300 font-medium mb-2">
            GRI Materiality Assessment Coming Next
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            Navigate to{' '}
            <a href="/dashboard/gri/materiality" className="underline font-medium">
              /dashboard/gri/materiality
            </a>{' '}
            to view your auto-generated materiality assessment based on these dismissals.
          </p>
        </div>
      )}

      {/* Recategorize Modal */}
      {recategorizeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Dismissal Category
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {recategorizeModal.metricName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Category */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Category:</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {recategorizeModal.currentCategory.replace('_', ' ')}
                </p>
              </div>

              {/* Category Options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select new category:
                </p>
                {[
                  { value: 'not_material', label: 'Not Material to Business', icon: XCircle, color: 'red', desc: 'This metric does not apply to our business model' },
                  { value: 'not_priority', label: 'Not a Priority Now', icon: Clock, color: 'yellow', desc: 'We may track this later when resources allow' },
                  { value: 'already_tracking', label: 'Already Tracking Elsewhere', icon: CheckCircle, color: 'green', desc: 'We track this metric in another system' },
                  { value: 'data_not_available', label: 'Data Not Available', icon: AlertCircle, color: 'orange', desc: 'We cannot currently collect this data' },
                  { value: 'cost_prohibitive', label: 'Too Expensive to Track', icon: DollarSign, color: 'purple', desc: 'The cost outweighs the value for now' },
                  { value: 'other', label: 'Other Reason', icon: HelpCircle, color: 'gray', desc: 'None of the above categories fit' },
                ].map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const notes = prompt(`Optional notes for recategorization to "${option.label}":`)
                        if (notes !== null) {
                          handleRecategorize(option.value, notes)
                        }
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        recategorizeModal.currentCategory === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-${option.color}-100 dark:bg-${option.color}-900/30`}>
                          <Icon className={`w-5 h-5 text-${option.color}-600 dark:text-${option.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {option.desc}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setRecategorizeModal({ isOpen: false, metricId: '', metricName: '', currentCategory: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
