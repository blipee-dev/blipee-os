interface BlipeeWordmarkProps {
  size?: number
  variant?: 'default' | 'white' | 'gradient'
  className?: string
}

export function BlipeeWordmark({ size = 80, variant = 'default', className = '' }: BlipeeWordmarkProps) {
  const getColor = () => {
    switch (variant) {
      case 'white':
        return '#ffffff'
      case 'gradient':
        return 'url(#wordmarkGradient)'
      default:
        return '#10b981'
    }
  }

  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 80 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="wordmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      
      {/* Text: blipee */}
      <text
        x="0"
        y="24"
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
