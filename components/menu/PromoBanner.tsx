'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-[1.6rem] bg-[var(--gp-charcoal)] text-white shadow-[0_16px_40px_rgba(28,20,16,0.18)]">
      <div className="gp-checker absolute inset-x-0 top-0 h-1 opacity-90" aria-hidden />
      <div className="relative flex items-center gap-3 p-4 pr-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--gp-yellow)]">
            Oferta exclusiva
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight">
            Hasta 20% en combos
          </p>
          <p className="mt-1 text-xs text-white/70">
            Dinner In, delivery o pick up · solo hoy
          </p>
          <Link
            href="/cart"
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--gp-red)] px-3.5 py-1.5 text-xs font-bold text-white"
          >
            Pedir ahora
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="relative h-24 w-24 shrink-0">
          <div className="absolute inset-0 rounded-full bg-[var(--gp-yellow)]/20" />
          <Image
            src={BRAND.productPath}
            alt=""
            fill
            className="rounded-full object-cover p-1"
            sizes="96px"
          />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--gp-red)] px-2 py-1 text-[10px] font-extrabold shadow-lg">
            −20%
          </span>
        </div>
      </div>
    </section>
  )
}
