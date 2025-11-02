export function DataInsightsAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#dataGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#6366f1" />
      <circle cx="120" cy="70" r="4" fill="#6366f1" />
      <path d="M 90 95 Q 100 90 110 95" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="50" y="53" width="15" height="42" rx="7" fill="#6366f1" opacity="0.6" />
      <rect x="135" y="53" width="15" height="42" rx="7" fill="#6366f1" opacity="0.6" />
      <rect x="85" y="28" width="8" height="15" fill="#818cf8" />
      <rect x="95" y="23" width="8" height="20" fill="#818cf8" />
      <rect x="105" y="30" width="8" height="13" fill="#818cf8" />
      <defs>
        <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  )
}
