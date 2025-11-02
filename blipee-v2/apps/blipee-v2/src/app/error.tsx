'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error message */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Something went wrong!
          </h2>
          <p className="text-slate-400 mb-6">
            We encountered an unexpected error. Please try again.
          </p>

          {/* Error details (dev mode) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-xs text-red-400 font-mono text-left break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              Go home
            </a>
          </div>

          {/* Support link */}
          <p className="text-sm text-slate-500 mt-6">
            Need help?{' '}
            <a href="/contact" className="text-green-500 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
