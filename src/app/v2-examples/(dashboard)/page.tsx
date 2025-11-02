/**
 * Dashboard Page (V2)
 *
 * Example of a protected Server Component that:
 * - Checks authentication
 * - Fetches data server-side with RLS
 * - Uses React cache() for deduplication
 * - Redirects if not authenticated
 *
 * Pattern: Server Component → Server-side data fetch → Render
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/v2/server'
import { signOut } from '@/app/actions/v2/auth'
import { cache } from 'react'

/**
 * Fetch user metrics with caching
 * The cache() wrapper ensures this function is only called once per request,
 * even if called multiple times in the component tree
 */
const getUserMetrics = cache(async (userId: string) => {
  const supabase = await createClient()

  // This query uses RLS - user can only see their own data
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching metrics:', error)
    return []
  }

  return data
})

export default async function DashboardPage() {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to signin if not authenticated
  if (!user) {
    redirect('/signin')
  }

  // Fetch user data (with RLS enforced)
  const metrics = await getUserMetrics(user.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Welcome, {user.email}
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Metrics
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              User ID
            </h3>
            <p className="mt-2 text-sm font-mono text-gray-900 dark:text-white truncate">
              {user.id}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Account Status
            </h3>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              Active
            </p>
          </div>
        </div>

        {/* Recent metrics table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Metrics
            </h2>
          </div>

          <div className="overflow-x-auto">
            {metrics.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No metrics found. Start by adding your first metric.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.map((metric: any) => (
                    <tr key={metric.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {metric.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {metric.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {metric.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(metric.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            V2 Architecture Features
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>Server Component (zero client JS for data fetching)</li>
            <li>Native Supabase JWT auth (no custom session tokens)</li>
            <li>Row Level Security (RLS) enforced at database level</li>
            <li>React cache() for request-level deduplication</li>
            <li>Server Actions for mutations</li>
            <li>Automatic token refresh via middleware</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
