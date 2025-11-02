export function RegulatoryAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#regulatoryGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#ef4444" />
      <circle cx="120" cy="70" r="4" fill="#ef4444" />
      <path d="M 90 95 L 110 95" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <rect x="50" y="55" width="15" height="40" rx="7" fill="#ef4444" opacity="0.6" />
      <rect x="135" y="55" width="15" height="40" rx="7" fill="#ef4444" opacity="0.6" />
      <rect x="90" y="25" width="20" height="20" rx="3" fill="none" stroke="#f87171" strokeWidth="3" />
      <path d="M 98 30 L 102 35 L 95 38" stroke="#f87171" strokeWidth="2" fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="regulatoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
      </defs>
    </svg>
  )
}
