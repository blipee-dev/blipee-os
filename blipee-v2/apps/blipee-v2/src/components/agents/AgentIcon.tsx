import { ReactNode } from 'react'

export type AgentIconProps = {
  variant: 'esg-chief' | 'compliance' | 'carbon' | 'supply-chain' | 'cost-saving' | 'maintenance' | 'optimizer' | 'regulatory'
  className?: string
}

const icons: Record<AgentIconProps['variant'], ReactNode> = {
  'esg-chief': (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="60" height="50" rx="8" fill="#10b981" />
      <circle cx="35" cy="45" r="6" fill="#fff" />
      <circle cx="65" cy="45" r="6" fill="#fff" />
      <rect x="40" y="60" width="20" height="3" rx="1.5" fill="#fff" />
      <rect x="45" y="15" width="4" height="12" rx="2" fill="#059669" />
      <circle cx="47" cy="13" r="4" fill="#34d399" />
    </svg>
  ),
  compliance: (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="60" height="50" rx="8" fill="#3b82f6" />
      <rect x="30" y="40" width="12" height="10" rx="2" fill="#fff" />
      <rect x="58" y="40" width="12" height="10" rx="2" fill="#fff" />
      <rect x="40" y="60" width="20" height="4" rx="2" fill="#fff" />
      <rect x="35" y="15" width="6" height="12" rx="3" fill="#1d4ed8" />
      <rect x="59" y="15" width="6" height="12" rx="3" fill="#1d4ed8" />
      <rect x="37" y="12" width="26" height="4" rx="2" fill="#60a5fa" />
    </svg>
  ),
  carbon: (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="60" height="50" rx="8" fill="#8b5cf6" />
      <circle cx="35" cy="45" r="7" fill="#fff" />
      <circle cx="65" cy="45" r="7" fill="#fff" />
      <circle cx="35" cy="45" r="3" fill="#6d28d9" />
      <circle cx="65" cy="45" r="3" fill="#6d28d9" />
      <path d="M40 62 L50 58 L60 62" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="35" cy="18" r="5" fill="#a78bfa" />
      <circle cx="65" cy="18" r="5" fill="#a78bfa" />
      <line x1="35" y1="23" x2="35" y2="25" stroke="#7c3aed" strokeWidth="3" />
      <line x1="65" y1="23" x2="65" y2="25" stroke="#7c3aed" strokeWidth="3" />
    </svg>
  ),
  'supply-chain': (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="60" height="50" rx="8" fill="#f97316" />
      <circle cx="35" cy="42" r="5" fill="#fff" />
      <circle cx="65" cy="42" r="5" fill="#fff" />
      <ellipse cx="35" cy="52" rx="6" ry="4" fill="#fff" opacity="0.6" />
      <ellipse cx="65" cy="52" rx="6" ry="4" fill="#fff" opacity="0.6" />
      <rect x="42" y="60" width="16" height="3" rx="1.5" fill="#fff" />
      <polygon points="50,15 45,25 55,25" fill="#ea580c" />
      <rect x="48" y="12" width="4" height="6" rx="2" fill="#fb923c" />
    </svg>
  ),
  'cost-saving': (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="30" width="64" height="46" rx="10" fill="#facc15" />
      <circle cx="36" cy="54" r="8" fill="#fff8db" />
      <circle cx="64" cy="46" r="10" fill="#fde047" stroke="#f59e0b" strokeWidth="3" />
      <path d="M61 46h6" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 43v6" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
      <rect x="44" y="38" width="12" height="20" rx="2" fill="#fef9c3" stroke="#d97706" strokeWidth="2" />
      <path d="M30 68h40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  maintenance: (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="28" width="60" height="44" rx="10" fill="#0ea5e9" />
      <circle cx="50" cy="50" r="16" stroke="#f8fafc" strokeWidth="4" />
      <path d="M50 36v8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 50h8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 58v8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 50h8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 14l8 10h-16l8-10Z" fill="#38bdf8" />
      <rect x="46" y="10" width="8" height="6" rx="2" fill="#bae6fd" />
    </svg>
  ),
  optimizer: (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="60" height="60" rx="12" fill="#6366f1" />
      <rect x="28" y="28" width="44" height="44" rx="8" fill="#4338ca" />
      <rect x="36" y="36" width="28" height="28" rx="6" fill="#eef2ff" />
      <rect x="42" y="42" width="16" height="16" rx="4" fill="#6366f1" />
      <path d="M50 28v8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 64v8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 50h8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 50h8" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 40 70 30" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 60 30 70" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  regulatory: (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="28" width="64" height="44" rx="12" fill="#3b82f6" opacity="0.85" />
      <path d="M18 50s12-22 32-22 32 22 32 22-12 22-32 22-32-22-32-22Z" fill="none" stroke="#bfdbfe" strokeWidth="4" />
      <circle cx="50" cy="50" r="10" fill="#bfdbfe" />
      <circle cx="50" cy="50" r="4" fill="#1d4ed8" />
      <path d="M50 18l6 10h-12l6-10Z" fill="#60a5fa" />
      <path d="M72 70l8 12" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
}

export function AgentIcon({ variant, className = '' }: AgentIconProps) {
  return (
    <div className={className}>
      {icons[variant]}
    </div>
  )
}
