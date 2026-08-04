'use client'

import { useEffect, useState } from 'react'
import type { Transition } from 'framer-motion'

export const springSnappy = { type: 'spring', stiffness: 520, damping: 34 } as const
export const springSoft = { type: 'spring', stiffness: 320, damping: 28 } as const
export const easeOut = { duration: 0.35, ease: [0.22, 1, 0.36, 1] } as Transition

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}

export function pageTransitionVariant(pathname: string, prevPath: string | null) {
  function depth(path: string) {
    if (path === '/') return 0
    if (path.startsWith('/checkout')) return 2
    if (path.startsWith('/cart')) return 1
    return 1
  }

  const current = depth(pathname)
  const previous = prevPath != null ? depth(prevPath) : current
  const forward = current >= previous

  return {
    initial: { opacity: 0, x: forward ? 24 : -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: forward ? -16 : 16 },
  }
}
