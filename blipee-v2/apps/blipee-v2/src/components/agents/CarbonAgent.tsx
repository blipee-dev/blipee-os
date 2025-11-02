export function CarbonAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#carbonGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#10b981" />
      <circle cx="120" cy="70" r="4" fill="#10b981" />
      <path d="M 85 95 Q 100 105 115 95" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="50" y="50" width="15" height="40" rx="7" fill="#10b981" opacity="0.6" />
      <rect x="135" y="50" width="15" height="40" rx="7" fill="#10b981" opacity="0.6" />
      <circle cx="100" cy="35" r="12" fill="#0ea5e9" />
      <path d="M 95 33 L 100 28 L 105 33" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="carbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  )
}
