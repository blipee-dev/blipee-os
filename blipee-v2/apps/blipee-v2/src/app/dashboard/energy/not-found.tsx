import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Energy Data Not Found</h2>
        <p className="text-slate-400 mb-4">Could not find energy data for your organization</p>
        <Link href="/dashboard" className="text-green-500 hover:text-green-400 underline">
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
