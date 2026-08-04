'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatBcvUpdatedAt } from '@/lib/bcv-rate'
import { formatBsAmount, formatBsRateNumber, formatUsd } from '@/lib/format'
import { useReducedMotion } from '@/lib/motion'

function parseUsdInput(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function parseBsInput(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function BcvRateSheet({
  open,
  onClose,
  rate,
  updatedAt,
  autoBcvRate,
}: {
  open: boolean
  onClose: () => void
  rate: number
  updatedAt: string
  autoBcvRate: boolean
}) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [usd, setUsd] = useState('1')
  const [bs, setBs] = useState('')
  const [lastEdited, setLastEdited] = useState<'usd' | 'bs'>('usd')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || rate <= 0) return
    setUsd('1')
    setBs((1 * rate).toFixed(2))
    setLastEdited('usd')
  }, [open, rate])

  function onUsdChange(raw: string) {
    setUsd(raw)
    setLastEdited('usd')
    const amount = parseUsdInput(raw)
    setBs(amount > 0 ? (amount * rate).toFixed(2) : '')
  }

  function onBsChange(raw: string) {
    setBs(raw)
    setLastEdited('bs')
    const amount = parseBsInput(raw)
    setUsd(amount > 0 && rate > 0 ? (amount / rate).toFixed(2) : '')
  }

  function swapAmounts() {
    if (lastEdited === 'usd') {
      const amount = parseUsdInput(usd)
      setBs(amount > 0 ? (amount * rate).toFixed(2) : '')
    } else {
      const amount = parseBsInput(bs)
      setUsd(amount > 0 && rate > 0 ? (amount / rate).toFixed(2) : '')
    }
  }

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar tasa BCV"
            className="fixed inset-0 z-[60] bg-[var(--gp-ink)]/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bcv-sheet-title"
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-md"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            <div className="overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-20px_60px_rgba(227,27,35,0.18)]">
              <div className="h-1.5 bg-gradient-to-r from-[var(--gp-red)] via-[#f06292] to-[var(--gp-yellow)]" />
              <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10" />
                <h2
                  id="bcv-sheet-title"
                  className="text-center font-[family-name:var(--font-display)] text-xl text-[var(--gp-ink)]"
                >
                  Tasa BCV
                </h2>
                <p className="mt-1 text-center text-sm text-[var(--gp-muted)]">
                  {formatBsRateNumber(rate)} por cada dólar
                </p>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
                      USD
                    </span>
                    <div className="rounded-2xl border border-[var(--gp-red)]/15 bg-[var(--gp-cream)]/50 px-3 py-3 ring-1 ring-white">
                      <input
                        inputMode="decimal"
                        value={usd}
                        onChange={(e) => onUsdChange(e.target.value)}
                        className="w-full bg-transparent text-lg font-bold text-[var(--gp-ink)] outline-none"
                        placeholder="1.00"
                      />
                      {parseUsdInput(usd) > 0 ? (
                        <p className="mt-0.5 text-[10px] text-[var(--gp-muted)]">
                          {formatUsd(parseUsdInput(usd))}
                        </p>
                      ) : null}
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={swapAmounts}
                    aria-label="Recalcular conversión"
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gp-red)] to-[#f06292] text-white shadow-[0_6px_16px_rgba(227,27,35,0.35)]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
                    </svg>
                  </button>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
                      Bs
                    </span>
                    <div className="rounded-2xl border border-[var(--gp-yellow)]/30 bg-[var(--gp-yellow)]/10 px-3 py-3 ring-1 ring-white">
                      <input
                        inputMode="decimal"
                        value={bs}
                        onChange={(e) => onBsChange(e.target.value)}
                        className="w-full bg-transparent text-lg font-bold text-[var(--gp-ink)] outline-none"
                        placeholder="0,00"
                      />
                      {parseBsInput(bs) > 0 ? (
                        <p className="mt-0.5 text-[10px] text-[var(--gp-muted)]">
                          {formatBsAmount(parseBsInput(bs))}
                        </p>
                      ) : null}
                    </div>
                  </label>
                </div>

                <p className="mt-5 text-center text-xs leading-relaxed text-[var(--gp-muted)]">
                  Tasa oficial según el{' '}
                  <span className="font-semibold text-[var(--gp-ink)]">
                    Banco Central de Venezuela
                  </span>
                  {autoBcvRate ? ' · se actualiza automáticamente' : ''}
                </p>
                {updatedAt ? (
                  <p className="mt-1 text-center text-[10px] text-[var(--gp-muted)]">
                    Actualizado: {formatBcvUpdatedAt(updatedAt)}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

