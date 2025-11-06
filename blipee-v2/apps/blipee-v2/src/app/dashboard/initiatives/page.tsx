import { Suspense } from 'react'
import { getDismissedMetrics, getInitiativesStats, getDismissedBreakdown } from '@/lib/data/initiatives'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { InitiativesClient } from './InitiativesClient'

export default async function InitiativesPage() {
  const org = await getOrganizationForUser()

  if (!org) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            No organization found. Please set up your organization first.
          </p>
        </div>
      </div>
    )
  }

  const [dismissedMetrics, stats, breakdown] = await Promise.all([
    getDismissedMetrics(org.id),
    getInitiativesStats(org.id),
    getDismissedBreakdown(org.id),
  ])

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <InitiativesClient
        dismissedMetrics={dismissedMetrics}
        stats={stats}
        breakdown={breakdown}
        organizationId={org.id}
      />
    </Suspense>
  )
}
