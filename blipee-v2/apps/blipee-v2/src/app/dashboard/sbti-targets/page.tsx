import { getTargets, getTargetsSummary } from '@/app/actions/sbti-targets'
import { SBTiTargetsClient } from './SBTiTargetsClient'

export default async function SBTiTargetsPage() {
  const [targetsResult, summaryResult] = await Promise.all([
    getTargets(),
    getTargetsSummary(),
  ])

  if (targetsResult.error || summaryResult.error) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Error</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {targetsResult.error || summaryResult.error}
        </p>
      </div>
    )
  }

  return (
    <SBTiTargetsClient
      initialTargets={targetsResult.data || []}
      summary={summaryResult.data || {
        total_targets: 0,
        validated_targets: 0,
        submitted_targets: 0,
        draft_targets: 0,
        active_targets: 0,
        scope_1_2_coverage: null,
        scope_3_coverage: null,
        on_track_count: 0,
        at_risk_count: 0,
        off_track_count: 0,
      }}
    />
  )
}
