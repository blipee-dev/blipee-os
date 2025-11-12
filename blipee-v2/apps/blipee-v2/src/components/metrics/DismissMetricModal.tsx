/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState } from 'react'
import {
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  HelpCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'

export type DismissCategory =
  | 'not_material'
  | 'not_priority'
  | 'already_tracking'
  | 'data_not_available'
  | 'cost_prohibitive'
  | 'other'

interface DismissOption {
  value: DismissCategory
  label: string
  description: string
  icon: any
  color: string
  reactivatable: boolean
  affects_materiality: boolean
  examples: string[]
}

interface DismissMetricModalProps {
  metric: {
    id: string
    name: string
    recommendation_reason: string
    peer_adoption_percent?: number
    gri_disclosure?: string
  }
  onDismiss: (data: {
    category: DismissCategory
    notes: string
    reactivatable: boolean
    affects_materiality: boolean
  }) => void
  onCancel: () => void
}

const DISMISS_OPTIONS: DismissOption[] = [
  {
    value: 'not_material',
    label: 'Not Material',
    description: 'This metric does not apply to our business operations',
    icon: XCircle,
    color: 'red',
    reactivatable: false,
    affects_materiality: true,
    examples: [
      "We don't have a vehicle fleet",
      "We don't use this type of material",
      'Not relevant to our industry sector',
    ],
  },
  {
    value: 'not_priority',
    label: 'Not a Priority Now',
    description: 'We want to track this, but not at this time',
    icon: Clock,
    color: 'yellow',
    reactivatable: true,
    affects_materiality: false,
    examples: [
      'Will track next fiscal year',
      'Need to implement data collection first',
      'Lower priority than other metrics',
    ],
  },
  {
    value: 'already_tracking',
    label: 'Already Tracking',
    description: 'We track this through another metric or system',
    icon: CheckCircle,
    color: 'green',
    reactivatable: false,
    affects_materiality: false,
    examples: [
      'Included in another metric category',
      'Tracked in different system',
      'Covered by parent metric',
    ],
  },
  {
    value: 'data_not_available',
    label: 'Data Not Available',
    description: 'We cannot obtain this data with current resources',
    icon: AlertCircle,
    color: 'orange',
    reactivatable: true,
    affects_materiality: false,
    examples: [
      "Suppliers don't provide this data",
      'No measurement system in place',
      'Would require significant investment',
    ],
  },
  {
    value: 'cost_prohibitive',
    label: 'Too Expensive to Track',
    description: 'The cost of tracking outweighs the benefit',
    icon: DollarSign,
    color: 'purple',
    reactivatable: true,
    affects_materiality: false,
    examples: [
      'Requires expensive sensors/equipment',
      'Would need dedicated FTE',
      'ROI not justified at this time',
    ],
  },
  {
    value: 'other',
    label: 'Other Reason',
    description: 'Different reason (please specify)',
    icon: HelpCircle,
    color: 'gray',
    reactivatable: true,
    affects_materiality: false,
    examples: [],
  },
]

export function DismissMetricModal({
  metric,
  onDismiss,
  onCancel,
}: DismissMetricModalProps) {
  const [selectedReason, setSelectedReason] = useState<DismissCategory | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')

  const selectedOption = DISMISS_OPTIONS.find((opt) => opt.value === selectedReason)

  const handleSubmit = () => {
    if (!selectedReason || !selectedOption) return

    onDismiss({
      category: selectedReason,
      notes: additionalNotes,
      reactivatable: selectedOption.reactivatable,
      affects_materiality: selectedOption.affects_materiality,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Why are you dismissing this metric?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Help us understand why <strong>{metric.name}</strong> isn't suitable. This helps
            improve future recommendations and builds your materiality assessment.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Metric Context */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Why we recommended this:
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  {metric.recommendation_reason}
                </div>
                {metric.peer_adoption_percent && (
                  <div className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                    📊 {metric.peer_adoption_percent.toFixed(0)}% of similar organizations
                    track this
                  </div>
                )}
                {metric.gri_disclosure && (
                  <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    🏷️ {metric.gri_disclosure}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dismiss Reasons */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select the main reason:
            </label>

            {DISMISS_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = selectedReason === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedReason(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg bg-${option.color}-100 dark:bg-${option.color}-900/30 flex-shrink-0`}
                    >
                      <Icon
                        className={`w-5 h-5 text-${option.color}-600 dark:text-${option.color}-400`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {option.label}
                        </span>

                        {/* Badges */}
                        {option.affects_materiality && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded whitespace-nowrap">
                            Affects Materiality
                          </span>
                        )}
                        {option.reactivatable && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded whitespace-nowrap">
                            Can Re-activate
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {option.description}
                      </p>

                      {/* Examples */}
                      {option.examples.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          <strong>Examples:</strong> {option.examples.join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* Radio indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? `border-${option.color}-500 bg-${option.color}-500`
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Additional Notes */}
          {selectedReason && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Additional context {selectedReason === 'other' ? '(required)' : '(optional)'}:
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional details that might help..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
          )}

          {/* Warning for Not Material */}
          {selectedReason === 'not_material' && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  Permanent Decision
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400">
                  Marking this as "Not Material" means it won't be recommended again. This will
                  be used for your GRI materiality assessment.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !selectedReason || (selectedReason === 'other' && !additionalNotes.trim())
            }
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Dismiss Metric
          </button>
        </div>
      </div>
    </div>
  )
}
