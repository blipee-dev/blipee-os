export function CostSavingsAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#costGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#10b981" />
      <circle cx="120" cy="70" r="4" fill="#10b981" />
      <path d="M 85 90 Q 100 100 115 90" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="50" y="58" width="15" height="37" rx="7" fill="#10b981" opacity="0.6" />
      <rect x="135" y="58" width="15" height="37" rx="7" fill="#10b981" opacity="0.6" />
      <circle cx="100" cy="32" r="12" fill="#34d399" />
      <text x="100" y="38" fontSize="16" fontWeight="bold" fill="#fff" textAnchor="middle">$</text>
      <defs>
        <linearGradient id="costGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
  )
}
