import { Suspense } from 'react'
import { getGRIMateriality } from '@/lib/data/initiatives'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { GRIMaterialityClient } from './GRIMaterialityClient'

export const metadata = {
  title: 'GRI Materiality Assessment | Blipee',
  description: 'Auto-generated GRI materiality assessment based on your metric tracking decisions',
}

export default async function GRIMaterialityPage() {
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

  const materialityData = await getGRIMateriality(org.id)

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <GRIMaterialityClient
        materialityData={materialityData}
        organizationId={org.id}
        organizationName={org.name}
        industry={org.industry_sector || 'Professional Services'}
      />
    </Suspense>
  )
}
