'use client'

import { RefObject, useEffect } from 'react'

export function useSmoothScroll(containerRef: RefObject<HTMLElement>, options: { offset?: number } = {}) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const anchors = Array.from(container.querySelectorAll('a[href^="#"]')) as HTMLAnchorElement[]
    if (!anchors.length) return

    const handleClick = (event: Event) => {
      const target = event.currentTarget as HTMLAnchorElement
      const href = target.getAttribute('href')
      if (!href || href === '#') return

      const element = container.querySelector<HTMLElement>(href)
      if (!element) return

      event.preventDefault()
      const navHeight = (container.querySelector('nav') as HTMLElement | null)?.clientHeight ?? 0
      const offset = options.offset ?? navHeight + 20
      const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset

      window.scrollTo({ top: targetPosition, behavior: 'smooth' })
    }

    anchors.forEach(anchor => anchor.addEventListener('click', handleClick))
    return () => anchors.forEach(anchor => anchor.removeEventListener('click', handleClick))
  }, [containerRef, options.offset])
}
