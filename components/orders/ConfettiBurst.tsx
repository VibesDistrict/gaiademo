'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/lib/motion'

const COLORS = ['#e91e63', '#ffb300', '#f06292', '#ffca28', '#c47a2c']

type Particle = {
  id: number
  x: number
  y: number
  color: string
  rotate: number
  size: number
}

export function ConfettiBurst({ active }: { active: boolean }) {
  const reduced = useReducedMotion()
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active || reduced) return
    setParticles(
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 280,
        y: -(80 + Math.random() * 160),
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      }))
    )
    const timer = window.setTimeout(() => setParticles([]), 1200)
    return () => window.clearTimeout(timer)
  }, [active, reduced])

  if (!active || reduced || particles.length === 0) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-24 z-[55] mx-auto flex h-0 max-w-md justify-center"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            rotate: p.rotate,
          }}
          transition={{ duration: 0.95, ease: 'easeOut' }}
        />
      ))}
    </div>,
    document.body
  )
}
