'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-slate-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md w-full mx-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              {/* Critical error icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Error message */}
              <h1 className="text-3xl font-bold text-white mb-3">
                Critical Error
              </h1>
              <p className="text-slate-400 mb-6">
                A critical error occurred. The application needs to be reloaded.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={reset}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Reload application
                </button>
                <a
                  href="/"
                  className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors inline-block"
                >
                  Return to home
                </a>
              </div>

              {/* Support */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-sm text-slate-500">
                  If this problem persists, please{' '}
                  <a
                    href="mailto:support@blipee.com"
                    className="text-green-500 hover:underline"
                  >
                    contact our support team
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
