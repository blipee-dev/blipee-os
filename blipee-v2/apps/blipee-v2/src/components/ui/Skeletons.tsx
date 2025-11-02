/**
 * Skeleton Components
 * 
 * Loading placeholders for use with React Suspense boundaries
 * following Vercel best practices
 */

export function ChartSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-1/3 mb-6"></div>
      <div className="space-y-3">
        <div className="h-48 bg-slate-800 rounded"></div>
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-1/4 mb-6"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 bg-slate-800 rounded flex-1"></div>
            <div className="h-12 bg-slate-800 rounded flex-1"></div>
            <div className="h-12 bg-slate-800 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-slate-800 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-800 rounded"></div>
        <div className="h-4 bg-slate-800 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-800 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-slate-800 rounded w-1/4"></div>
    </div>
  )
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-slate-800 rounded w-1/4 mb-2"></div>
            <div className="h-12 bg-slate-800 rounded"></div>
          </div>
        ))}
        <div className="h-12 bg-slate-800 rounded w-1/3"></div>
      </div>
    </div>
  )
}

export function DashboardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}
