'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BcvRateSheet } from '@/components/layout/BcvRateSheet'
import { formatBsRate } from '@/lib/format'

export function HeaderBcvRate({
  rate,
  updatedAt,
  autoBcvRate,
}: {
  rate: number
  updatedAt: string
  autoBcvRate: boolean
}) {
  const [open, setOpen] = useState(false)

  if (rate <= 0) return null

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Tasa BCV: ${formatBsRate(rate)} por dólar. Ver conversor`}
        whileTap={{ scale: 0.98 }}
        className="group relative shrink-0 overflow-hidden rounded-xl bg-white/80 px-2 py-1.5 text-right shadow-sm ring-1 ring-black/[0.06] transition hover:bg-white hover:ring-[var(--gp-red)]/15"
      >
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--gp-red)]/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
        <div className="relative flex items-center gap-1">
          <div className="min-w-0">
            <p className="flex items-center justify-end gap-1 text-[8px] font-semibold uppercase tracking-wider text-[var(--gp-muted)]">
              {autoBcvRate ? (
                <span className="inline-flex h-1 w-1 rounded-full bg-[#25D366]" aria-hidden />
              ) : null}
              Tasa BCV
            </p>
            <p className="whitespace-nowrap text-[11px] font-semibold leading-tight tabular-nums text-[var(--gp-red)]">
              {formatBsRate(rate)}
            </p>
          </div>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-3 w-3 shrink-0 text-[var(--gp-red)]/70"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5l5 5-5 5" />
          </svg>
        </div>
      </motion.button>

      <BcvRateSheet
        open={open}
        onClose={() => setOpen(false)}
        rate={rate}
        updatedAt={updatedAt}
        autoBcvRate={autoBcvRate}
      />
    </>
  )
}
