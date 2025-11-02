'use client'

import { RefObject, useEffect } from 'react'

export function useParallax(ref: RefObject<HTMLElement>, factor = 0.5) {
  useEffect(() => {
    const node = ref.current
    if (!node) return

    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset
        node.style.transform = `translate(-50%, -50%) translateY(${scrolled * factor}px)`
        ticking = false
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [ref, factor])
}
