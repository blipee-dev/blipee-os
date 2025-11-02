/**
 * 404 Not Found Page
 * Ultra-simplified for deployment debugging
 */

// Force dynamic rendering to avoid prerender error
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
        <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>Page Not Found</p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '2rem',
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
