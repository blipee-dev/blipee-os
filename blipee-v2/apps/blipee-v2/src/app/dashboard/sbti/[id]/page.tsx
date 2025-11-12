import { notFound } from 'next/navigation'
import { getOrganizationForUser } from '@/lib/data/organizations'
import { getSBTITarget, getSBTIProgress } from '@/app/actions/sbti'
import { TargetDetailsView } from './TargetDetailsView'
import styles from '../sbti.module.css'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Objetivo SBTi | Blipee`,
    description: 'Detalhes do objetivo baseado em ciência',
  }
}

export default async function SBTITargetDetailPage({ params }: PageProps) {
  const org = await getOrganizationForUser()

  if (!org) {
    notFound()
  }

  const [targetResult, progressResult] = await Promise.all([
    getSBTITarget(params.id),
    getSBTIProgress(params.id),
  ])

  if (targetResult.error || !targetResult.data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          Objetivo não encontrado ou você não tem permissão para visualizá-lo.
        </div>
        <a href="/dashboard/sbti" className={styles.backLink}>
          ← Voltar aos Objetivos
        </a>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <TargetDetailsView
        target={targetResult.data}
        progress={progressResult.data || []}
        organizationId={org.id}
      />
    </div>
  )
}
