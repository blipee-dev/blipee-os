export function EnergyAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#energyGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#f59e0b" />
      <circle cx="120" cy="70" r="4" fill="#f59e0b" />
      <path d="M 85 95 Q 100 100 115 95" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="50" y="55" width="15" height="45" rx="7" fill="#f59e0b" opacity="0.6" />
      <rect x="135" y="55" width="15" height="45" rx="7" fill="#f59e0b" opacity="0.6" />
      <path d="M 95 25 L 100 35 L 97 35 L 102 45 L 95 37 L 98 37 Z" fill="#fbbf24" />
      <defs>
        <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  )
}
