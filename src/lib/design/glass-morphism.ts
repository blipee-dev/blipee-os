import { premiumTheme } from './theme'

// Glass morphism base styles
export const glassBase = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundColor: premiumTheme.colors.background.glass,
  border: `1px solid ${premiumTheme.colors.background.glassBorder}`,
}

// Glass morphism with subtle shadow
export const glassSoft = {
  ...glassBase,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
}

// Glass morphism with stronger presence
export const glassStrong = {
  ...glassBase,
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2)',
}

// Glass morphism with gradient accent
export const glassGradient = (gradientType: keyof typeof premiumTheme.colors.gradients) => ({
  ...glassBase,
  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: premiumTheme.colors.gradients[gradientType],
    opacity: 0.1,
    zIndex: -1,
  },
})

// Tailwind class strings for glass morphism
export const glassClasses = {
  base: 'backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]',
  soft: 'backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
  strong: 'backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.2)]',
  hover: 'hover:bg-white/[0.04] hover:border-white/[0.1] hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)]',
  focus: 'focus:border-white/[0.15] focus:shadow-[0_8px_40px_rgba(139,92,246,0.15)]',
}

// Animation variants for framer-motion
export const glassAnimations = {
  fadeIn: {
    initial: { opacity: 0, backdropFilter: 'blur(0px)' },
    animate: { opacity: 1, backdropFilter: 'blur(20px)' },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  slideUp: {
    initial: { opacity: 0, y: 20, backdropFilter: 'blur(0px)' },
    animate: { opacity: 1, y: 0, backdropFilter: 'blur(20px)' },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95, backdropFilter: 'blur(0px)' },
    animate: { opacity: 1, scale: 1, backdropFilter: 'blur(20px)' },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Gradient text helper
export const gradientTextClasses = {
  primary: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
  blue: 'bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent',
  success: 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent',
  brand: 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent',
}

// Glow effects
export const glowEffects = {
  purple: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
  blue: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]',
  pink: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
  brand: 'shadow-[0_0_32px_rgba(139,92,246,0.25)]',
}