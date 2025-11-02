export function MaintenanceAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#maintenanceGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#06b6d4" />
      <circle cx="120" cy="70" r="4" fill="#06b6d4" />
      <path d="M 85 95 Q 100 105 115 95" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="50" y="52" width="15" height="43" rx="7" fill="#06b6d4" opacity="0.6" />
      <rect x="135" y="52" width="15" height="43" rx="7" fill="#06b6d4" opacity="0.6" />
      <path d="M 90 28 L 95 35 L 105 35 L 110 28 L 105 28 L 105 22 L 95 22 L 95 28 Z" fill="#22d3ee" />
      <circle cx="100" cy="32" r="2" fill="#fff" />
      <defs>
        <linearGradient id="maintenanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  )
}
