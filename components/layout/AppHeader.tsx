'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HeaderBcvRate } from '@/components/layout/HeaderBcvRate'
import { BRAND } from '@/lib/brand'
import { useCart } from '@/lib/cart'
import { useTableSession } from '@/lib/table-session'
import { useReducedMotion } from '@/lib/motion'

export function AppHeader({
  rateBs,
  rateBsUpdatedAt,
  autoBcvRate = true,
}: {
  rateBs?: number
  rateBsUpdatedAt?: string
  autoBcvRate?: boolean
}) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const { table, clearTable } = useTableSession()
  const { itemCount } = useCart()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showBcv = mounted && rateBs != null && rateBs > 0

  return (
    <header className="sticky top-0 z-20 bg-[var(--gp-cream)]/92 backdrop-blur-md">
      <div className="gp-checker h-1 w-full" aria-hidden />
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/cuenta"
          aria-label="Cuenta"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--gp-ink)] shadow-sm ring-1 ring-black/[0.04]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path strokeLinecap="round" d="M4 7h16M4 12h12M4 17h16" />
          </svg>
        </Link>

        <Link href="/" className="flex min-w-0 flex-col items-center">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <Image
              src={BRAND.logoPath}
              alt={BRAND.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl bg-white object-contain p-0.5 shadow-sm"
              priority
            />
            <div className="text-center leading-none">
              <p className="font-[family-name:var(--font-script)] text-[1.45rem]">
                <span className="text-[var(--gp-red)]">Gaia</span>{' '}
                <span className="text-[var(--gp-yellow)]">Pasta</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-wide text-[var(--gp-muted)]">
                {table
                  ? `Dinner In · Mesa ${table.number}`
                  : BRAND.tagline}
              </p>
            </div>
          </motion.div>
        </Link>

        <div className="flex items-center gap-1.5">
          {showBcv ? (
            <HeaderBcvRate
              rate={rateBs}
              updatedAt={rateBsUpdatedAt ?? ''}
              autoBcvRate={autoBcvRate}
            />
          ) : null}
          <Link
            href="/cart"
            aria-label="Carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--gp-ink)] shadow-sm ring-1 ring-black/[0.04]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2" />
              <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gp-red)] px-1 text-[9px] font-extrabold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {table ? (
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pb-2">
          <p className="text-xs font-bold text-[var(--gp-red)]">
            Sesión Dinner In activa
          </p>
          <button
            type="button"
            onClick={clearTable}
            className="text-xs font-semibold text-[var(--gp-muted)] underline"
          >
            Salir de mesa
          </button>
        </div>
      ) : null}
    </header>
  )
}
