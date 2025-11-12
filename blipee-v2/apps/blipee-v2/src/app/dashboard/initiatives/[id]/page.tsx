import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { getInitiative } from '@/app/actions/initiatives'
import { InitiativeDetailContent } from './InitiativeDetailContent'
import styles from '../initiatives.module.css'

export const dynamic = 'force-dynamic'

export default async function InitiativeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const org = await getOrganizationForUser()

  if (!org) {
    redirect('/signin')
  }

  const { data: initiative, error } = await getInitiative(params.id)

  if (error || !initiative) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div>Loading initiative details...</div>
        </div>
      }
    >
      <InitiativeDetailContent initiative={initiative} organizationId={org.id} />
    </Suspense>
  )
}
