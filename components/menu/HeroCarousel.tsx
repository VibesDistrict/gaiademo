'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BRAND } from '@/lib/brand'
import { easeOut, useReducedMotion } from '@/lib/motion'

const AUTO_MS = 5600

type HeroCarouselProps = {
  openHours?: string
  storeClosed?: boolean
}

const SLIDES = [
  {
    id: 'hero',
    eyebrow: 'Edición casa',
    title: 'Pasta fresca, al instante',
    body: 'Dinner In con QR de mesa, delivery o pick up.',
    image: BRAND.productPath,
    cta: 'Pedir ahora',
    href: '#menu',
  },
  {
    id: 'dinein',
    eyebrow: 'Dinner In',
    title: 'Escanea, pide y disfruta',
    body: 'Tu pedido llega a caja con el número de mesa.',
    image: BRAND.neonPath,
    cta: 'Ver menú',
    href: '#menu',
  },
  {
    id: 'delivery',
    eyebrow: 'A domicilio',
    title: 'Gaia en tu mesa',
    body: 'Creamy pastas listas para llevar o recibir en casa.',
    image: BRAND.foodPath,
    cta: 'Armar pedido',
    href: '/cart',
  },
] as const

export function HeroCarousel({ openHours, storeClosed }: HeroCarouselProps) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const go = useCallback(
    (next: number) => {
      setIndex((next + SLIDES.length) % SLIDES.length)
      setProgress(0)
    },
    []
  )

  useEffect(() => {
    if (reduced) return
    const started = Date.now()
    const tick = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / AUTO_MS)
      setProgress(p)
      if (p >= 1) go(index + 1)
    }, 50)
    return () => window.clearInterval(tick)
  }, [index, go, reduced])

  const slide = SLIDES[index]

  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--gp-charcoal)] shadow-[0_20px_50px_rgba(28,20,16,0.22)]">
        <div className="gp-checker absolute inset-x-0 top-0 z-10 h-1.5" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.article
            key={slide.id}
            initial={reduced ? false : { opacity: 0.4, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -24 }}
            transition={easeOut}
            className="relative flex min-h-[11.5rem] items-stretch"
          >
            <div className="relative z-10 flex w-[58%] flex-col justify-center p-5 pr-2">
              <span className="inline-flex w-fit rounded-full bg-[var(--gp-yellow)]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--gp-yellow)]">
                {storeClosed ? 'Cerrado ahora' : slide.eyebrow}
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-[1.55rem] leading-[1.1] text-white">
                {slide.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/75">
                {slide.body}
              </p>
              {openHours ? (
                <p className="mt-1 text-[10px] text-white/50">{openHours}</p>
              ) : null}
              <Link
                href={slide.href}
                className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--gp-red)] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(227,27,35,0.4)]"
              >
                {slide.cta}
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px]"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </div>
            <div className="absolute inset-y-0 right-0 w-[48%]">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                className="object-cover object-center"
                sizes="220px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--gp-charcoal)] via-[var(--gp-charcoal)]/40 to-transparent" />
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {SLIDES.map((s, i) => {
          const active = i === index
          return (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className="relative h-1.5 overflow-hidden rounded-full bg-[var(--gp-ink)]/15 transition-all"
              style={{ width: active ? 22 : 7 }}
            >
              {active ? (
                <motion.span
                  className="absolute inset-0 origin-left rounded-full bg-[var(--gp-red)]"
                  style={{ scaleX: progress }}
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
