interface BlipeeLogoProps {
  size?: number
  variant?: 'default' | 'white' | 'gradient'
  className?: string
}

export function BlipeeLogo({ size = 120, variant = 'default', className = '' }: BlipeeLogoProps) {
  const getColor = () => {
    switch (variant) {
      case 'white':
        return '#ffffff'
      case 'gradient':
        return 'url(#logoGradient)'
      default:
        return '#10b981'
    }
  }

  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 120 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      
      {/* Robot Icon */}
      <rect x="2" y="10" width="20" height="25" rx="4" fill={getColor()} />
      <circle cx="9" cy="18" r="2" fill="#fff" />
      <circle cx="15" cy="18" r="2" fill="#fff" />
      <path d="M 9 24 Q 12 26 15 24" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="8" r="3" fill={getColor()} />
      
      {/* Text: blipee */}
      <text
        x="28"
        y="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill={getColor()}
      >
        blipee
      </text>
    </svg>
  )
}
