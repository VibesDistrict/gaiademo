'use client'

import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function ClientPortal({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    setContainer(document.body)
  }, [])

  if (!container) return null

  return createPortal(children, container)
}
