import { redirect } from 'next/navigation'
import { getInitiativeByToken } from '@/app/actions/initiative-participants'
import { InitiativePublicView } from './InitiativePublicView'

interface PageProps {
  params: {
    token: string
  }
  searchParams: {
    action?: 'accept' | 'reject'
  }
}

export default async function InitiativePublicPage({ params, searchParams }: PageProps) {
  const { token } = params
  const { action } = searchParams

  // Get initiative data by access token
  const result = await getInitiativeByToken(token)

  if (result.error || !result.data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          padding: '20px',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
            Invalid Access Link
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {result.error || 'The link you followed is invalid or has expired.'}
          </p>
          <a
            href="https://v2.blipee.io"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--gradient-primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to blipee
          </a>
        </div>
      </div>
    )
  }

  return (
    <InitiativePublicView
      initiative={result.data.initiative}
      participant={result.data.participant}
      organization={result.data.organization}
      accessToken={token}
      initialAction={action}
    />
  )
}
