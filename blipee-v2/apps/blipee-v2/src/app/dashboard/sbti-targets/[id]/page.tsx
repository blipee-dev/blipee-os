import { getTarget } from '@/app/actions/sbti-targets'
import { TargetDetailClient } from './TargetDetailClient'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

export default async function TargetDetailPage({ params }: PageProps) {
  const result = await getTarget(params.id)

  if (result.error || !result.data) {
    notFound()
  }

  return <TargetDetailClient target={result.data} />
}
