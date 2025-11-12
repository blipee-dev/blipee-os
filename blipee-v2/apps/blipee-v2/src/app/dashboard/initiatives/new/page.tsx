import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { NewInitiativeForm } from './NewInitiativeForm'
import styles from '../initiatives.module.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'New Initiative | Blipee',
  description: 'Create a new sustainability initiative',
}

export default async function NewInitiativePage() {
  const org = await getOrganizationForUser()

  if (!org) {
    redirect('/signin')
  }

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div>Loading form...</div>
        </div>
      }
    >
      <NewInitiativeForm organizationId={org.id} />
    </Suspense>
  )
}
