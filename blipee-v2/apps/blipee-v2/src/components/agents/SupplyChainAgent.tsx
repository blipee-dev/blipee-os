export function SupplyChainAgent() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="80" height="100" rx="15" fill="url(#supplyGradient)" />
      <circle cx="80" cy="70" r="8" fill="#fff" />
      <circle cx="120" cy="70" r="8" fill="#fff" />
      <circle cx="80" cy="70" r="4" fill="#8b5cf6" />
      <circle cx="120" cy="70" r="4" fill="#8b5cf6" />
      <circle cx="100" cy="95" r="3" fill="#fff" />
      <rect x="50" y="50" width="15" height="50" rx="7" fill="#8b5cf6" opacity="0.6" />
      <rect x="135" y="50" width="15" height="50" rx="7" fill="#8b5cf6" opacity="0.6" />
      <circle cx="75" cy="30" r="6" fill="#a78bfa" />
      <circle cx="100" cy="25" r="8" fill="#a78bfa" />
      <circle cx="125" cy="30" r="6" fill="#a78bfa" />
      <line x1="75" y1="30" x2="100" y2="25" stroke="#a78bfa" strokeWidth="2" />
      <line x1="100" y1="25" x2="125" y2="30" stroke="#a78bfa" strokeWidth="2" />
      <defs>
        <linearGradient id="supplyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  )
}
