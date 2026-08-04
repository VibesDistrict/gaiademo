'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BRAND } from '@/lib/brand'
import { springSoft, useReducedMotion } from '@/lib/motion'

const MIN_VISIBLE_MS = 2200
const EXIT_MS = 650

type SplashScreenProps = {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), MIN_VISIBLE_MS)
    const doneTimer = window.setTimeout(
      () => onComplete(),
      MIN_VISIBLE_MS + EXIT_MS
    )
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[var(--gp-cream)]"
      aria-hidden={exiting}
      aria-label={`Cargando ${BRAND.name}`}
      initial={false}
      animate={
        exiting
          ? reduced
            ? { opacity: 0 }
            : { opacity: 0, scale: 1.04 }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: exiting ? 0.55 : 0.35 }}
    >
      <Image
        src={BRAND.neonPath}
        alt=""
        fill
        className="object-cover opacity-25"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--gp-cream)]/40 via-[var(--gp-cream)]/85 to-[var(--gp-cream)]" />
      <div className="gp-checker absolute inset-x-0 top-0 h-2" aria-hidden />
      <div className="gp-checker absolute inset-x-0 bottom-0 h-2" aria-hidden />

      <motion.div
        className="relative flex flex-col items-center px-6"
        initial={reduced ? false : { opacity: 0, scale: 0.9, y: 12 }}
        animate={exiting ? { opacity: 0 } : { opacity: 1, scale: 1, y: 0 }}
        transition={springSoft}
      >
        <div className="relative h-36 w-36 overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(227,27,35,0.2)] ring-1 ring-black/5">
          <Image
            src={BRAND.productPath}
            alt={BRAND.name}
            fill
            className="object-cover"
            priority
          />
        </div>
        <p className="mt-6 font-[family-name:var(--font-script)] text-5xl leading-none">
          <span className="text-[var(--gp-red)]">Gaia</span>{' '}
          <span className="text-[var(--gp-yellow)]">Pasta</span>
        </p>
        <p className="mt-2 text-sm font-semibold tracking-wide text-[var(--gp-muted)]">
          Italiana · elegante · fresca
        </p>
      </motion.div>
    </motion.div>
  )
}
