export default function ProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        {/* Animated profile icon */}
        <div className="relative w-20 h-20">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>

          {/* Rotating gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>

          {/* Inner pulsing circle */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-slate-300 font-semibold">Loading Profile</p>
          <p className="text-slate-500 text-sm mt-1">Retrieving your account information...</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 mt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}
