export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner with gradient */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-green-500 border-r-blue-500 animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm font-medium">Loading</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
