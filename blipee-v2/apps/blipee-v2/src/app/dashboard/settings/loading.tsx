export default function SettingsLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        {/* Animated settings icon */}
        <div className="relative w-20 h-20">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>

          {/* Rotating gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-400 border-r-slate-600 animate-spin"></div>

          {/* Inner pulsing circle */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 opacity-20 animate-pulse"></div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-slate-300 font-semibold">Loading Settings</p>
          <p className="text-slate-500 text-sm mt-1">Preparing your preferences...</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 mt-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}
