import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { getInitiatives, getInitiativesSummary } from '@/app/actions/initiatives'
import { InitiativesSummaryCards } from './InitiativesSummaryCards'
import { InitiativesMainContent } from './InitiativesMainContent'
import styles from './initiatives.module.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Initiatives Tracker | Blipee',
  description: 'Track and manage your sustainability initiatives',
}

export default async function InitiativesPage() {
  const org = await getOrganizationForUser()

  if (!org) {
    notFound()
  }

  const [initiativesResult, summaryResult] = await Promise.all([
    getInitiatives(),
    getInitiativesSummary(),
  ])

  if (initiativesResult.error || summaryResult.error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          Error loading initiatives: {initiativesResult.error || summaryResult.error}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Summary Cards */}
      <Suspense
        fallback={
          <div style={{ padding: '1.5rem' }}>
            <div>Loading summary...</div>
          </div>
        }
      >
        <InitiativesSummaryCards summary={summaryResult.data!} />
      </Suspense>

      {/* Main Content */}
      <Suspense
        fallback={
          <div style={{ padding: '1.5rem' }}>
            <div>Loading initiatives...</div>
          </div>
        }
      >
        <InitiativesMainContent
          initiatives={initiativesResult.data || []}
          organizationId={org.id}
        />
      </Suspense>
    </>
  )
}
