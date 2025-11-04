import React from 'react'

export interface BlipeeRobotProps {
  /** Variant of the robot logo */
  variant?: 'default' | 'with-blob' | 'maximized'
  /** Size of the logo (width and height) */
  size?: number | string
  /** Additional CSS class */
  className?: string
  /** Additional inline styles */
  style?: React.CSSProperties
}

/**
 * Blipee Robot Logo Component
 *
 * @example
 * // Default robot (landing page version)
 * <BlipeeRobot />
 *
 * @example
 * // Robot with blob background
 * <BlipeeRobot variant="with-blob" size={200} />
 *
 * @example
 * // Maximized robot (favicon version)
 * <BlipeeRobot variant="maximized" size="100%" />
 */
export function BlipeeRobot({
  variant = 'default',
  size = 120,
  className,
  style,
}: BlipeeRobotProps) {
  const sizeStyle = typeof size === 'number' ? `${size}px` : size

  if (variant === 'with-blob') {
    return (
      <svg
        width={sizeStyle}
        height={sizeStyle}
        viewBox="0 0 340 340"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <defs>
          <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="blobShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="20" />
            <feOffset dx="0" dy="30" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.45" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M 170,10 C 260,15 320,80 330,170 C 340,260 280,320 190,330 C 100,340 20,280 10,190 C 0,100 80,20 170,10 Z"
          fill="url(#blobGradient)"
          filter="url(#blobShadow)"
        />

        <g transform="translate(60, 60) scale(1.833)">
          <rect x="28" y="36" width="64" height="64" rx="20" fill="#10b981" />
          <circle cx="44" cy="60" r="10" fill="#fff" />
          <circle cx="76" cy="60" r="10" fill="#fff" />
          <circle cx="44" cy="60" r="4" fill="#047857" />
          <circle cx="76" cy="60" r="4" fill="#047857" />
          <path d="M50 84c6 6 18 6 24 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
          <rect x="50" y="22" width="20" height="18" rx="9" fill="#34d399" />
          <path d="M60 18v6" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="14" r="5" fill="#6ee7b7" />
          <rect x="31" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
          <rect x="63" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
          <rect x="55" y="60" width="10" height="8" rx="4" fill="#bbf7d0" />
          <circle cx="32" cy="92" r="6" fill="#22c55e" opacity="0.7" />
          <circle cx="88" cy="92" r="6" fill="#22c55e" opacity="0.7" />
        </g>
      </svg>
    )
  }

  if (variant === 'maximized') {
    return (
      <svg
        width={sizeStyle}
        height={sizeStyle}
        viewBox="20 5 80 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <rect x="28" y="36" width="64" height="64" rx="20" fill="#10b981" />
        <circle cx="44" cy="60" r="10" fill="#fff" />
        <circle cx="76" cy="60" r="10" fill="#fff" />
        <circle cx="44" cy="60" r="4" fill="#047857" />
        <circle cx="76" cy="60" r="4" fill="#047857" />
        <path d="M50 84c6 6 18 6 24 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="50" y="22" width="20" height="18" rx="9" fill="#34d399" />
        <path d="M60 18v6" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="14" r="5" fill="#6ee7b7" />
        <rect x="31" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
        <rect x="63" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
        <rect x="55" y="60" width="10" height="8" rx="4" fill="#bbf7d0" />
        <circle cx="32" cy="92" r="6" fill="#22c55e" opacity="0.7" />
        <circle cx="88" cy="92" r="6" fill="#22c55e" opacity="0.7" />
      </svg>
    )
  }

  // Default variant (landing page)
  return (
    <svg
      width={sizeStyle}
      height={sizeStyle}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect x="28" y="36" width="64" height="64" rx="20" fill="#10b981" />
      <circle cx="44" cy="60" r="10" fill="#fff" />
      <circle cx="76" cy="60" r="10" fill="#fff" />
      <circle cx="44" cy="60" r="4" fill="#047857" />
      <circle cx="76" cy="60" r="4" fill="#047857" />
      <path d="M50 84c6 6 18 6 24 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="50" y="22" width="20" height="18" rx="9" fill="#34d399" />
      <path d="M60 18v6" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="14" r="5" fill="#6ee7b7" />
      <rect x="31" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
      <rect x="63" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
      <rect x="55" y="60" width="10" height="8" rx="4" fill="#bbf7d0" />
      <circle cx="32" cy="92" r="6" fill="#22c55e" opacity="0.7" />
      <circle cx="88" cy="92" r="6" fill="#22c55e" opacity="0.7" />
    </svg>
  )
}
