export function ESGAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#esgGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#0ea5e9" />
      <circle cx="120" cy="70" r="4" fill="#0ea5e9" />
      <rect x="85" y="90" width="30" height="4" rx="2" fill="#fff" />
      <rect x="50" y="60" width="15" height="35" rx="7" fill="#0ea5e9" opacity="0.6" />
      <rect x="135" y="60" width="15" height="35" rx="7" fill="#0ea5e9" opacity="0.6" />
      <circle cx="70" cy="35" r="8" fill="#10b981" />
      <circle cx="100" cy="30" r="10" fill="#10b981" />
      <circle cx="130" cy="35" r="8" fill="#10b981" />
      <defs>
        <linearGradient id="esgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  )
}
