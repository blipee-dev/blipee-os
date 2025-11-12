import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { getInitiative } from '@/app/actions/initiatives'
import { getMetricsForTracking } from '@/app/actions/gri/metricTracking'
import { AddMetricsForm } from './AddMetricsForm'
import styles from '../../initiatives.module.css'

export const dynamic = 'force-dynamic'

export default async function AddMetricsPage({
  params,
}: {
  params: { id: string }
}) {
  const org = await getOrganizationForUser()

  if (!org) {
    redirect('/signin')
  }

  const [initiativeResult, metricsResult] = await Promise.all([
    getInitiative(params.id),
    getMetricsForTracking(),
  ])

  if (initiativeResult.error || !initiativeResult.data) {
    notFound()
  }

  if (metricsResult.error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          Error loading metrics: {metricsResult.error}
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div>Loading metrics...</div>
        </div>
      }
    >
      <AddMetricsForm
        initiative={initiativeResult.data}
        availableMetrics={metricsResult.data || []}
      />
    </Suspense>
  )
}
