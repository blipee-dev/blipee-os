import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Blipee V2
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4">
          Enterprise Sustainability Platform
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">
          Built with Next.js 14, Server Components, and native Supabase SSR auth
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Link
            href="/signin"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">
              Sign In →
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Access your dashboard with Server Actions
            </p>
          </Link>

          <Link
            href="/signup"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">
              Sign Up →
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create account with native Supabase auth
            </p>
          </Link>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-left">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-200">
            🚀 V2 Architecture Highlights
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>✅ <strong>Server Components</strong> - Zero client JS for data fetching</li>
            <li>✅ <strong>Native Supabase SSR</strong> - Official auth patterns, no custom sessions</li>
            <li>✅ <strong>Server Actions</strong> - 93% fewer API routes</li>
            <li>✅ <strong>Row Level Security</strong> - Database-level auth enforcement</li>
            <li>✅ <strong>Enterprise Security</strong> - CSP, HSTS, X-Frame-Options headers</li>
            <li>✅ <strong>70% Cost Reduction</strong> - Optimized compute and queries</li>
          </ul>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>📚 Documentation in <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">docs/</code></p>
          <p>🎯 Start with <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">V2_QUICK_START.md</code></p>
        </div>
      </div>
    </div>
  )
}
