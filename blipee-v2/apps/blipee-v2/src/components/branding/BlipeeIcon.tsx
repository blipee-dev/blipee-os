interface BlipeeIconProps {
  size?: number
  variant?: 'default' | 'white' | 'gradient'
  className?: string
}

export function BlipeeIcon({ size = 40, variant = 'default', className = '' }: BlipeeIconProps) {
  const getColor = () => {
    switch (variant) {
      case 'white':
        return '#ffffff'
      case 'gradient':
        return 'url(#iconGradient)'
      default:
        return '#10b981'
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      
      {/* Robot Icon */}
      <rect x="8" y="10" width="24" height="22" rx="4" fill={getColor()} />
      <circle cx="16" cy="18" r="2.5" fill="#fff" />
      <circle cx="24" cy="18" r="2.5" fill="#fff" />
      <path d="M 16 25 Q 20 27 24 25" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="7" r="3" fill={getColor()} />
    </svg>
  )
}
