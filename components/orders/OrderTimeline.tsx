'use client'

import { motion } from 'framer-motion'
import type { Fulfillment, OrderStatus } from '@/lib/types'
import {
  getOrderTimelineSteps,
  getTimelineStepState,
  type TimelineStepState,
} from '@/lib/order-timeline'
import { springSoft, useReducedMotion } from '@/lib/motion'

function dotClass(state: TimelineStepState) {
  if (state === 'done') {
    return 'bg-[var(--gp-red)] text-white shadow-[0_0_0_4px_rgba(227,27,35,0.15)]'
  }
  if (state === 'current') {
    return 'bg-[var(--gp-yellow)] text-[var(--gp-ink)] shadow-[0_0_0_4px_rgba(245,192,80,0.25)]'
  }
  if (state === 'cancelled') {
    return 'bg-red-100 text-red-600'
  }
  return 'bg-[var(--gp-cream)] text-[var(--gp-muted)] ring-2 ring-black/5'
}

export function OrderTimeline({
  status,
  fulfillment,
}: {
  status: OrderStatus
  fulfillment: Fulfillment
}) {
  const steps = getOrderTimelineSteps(fulfillment)
  const cancelled = status === 'cancelled'
  const reduced = useReducedMotion()

  if (cancelled) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm"
      >
        <p className="font-bold text-red-700">Pedido cancelado</p>
        <p className="mt-1 text-red-600/90">
          Si tienes dudas, escríbenos por WhatsApp.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.ol
      className="rounded-2xl bg-white p-4 shadow-sm"
      initial={reduced ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--gp-muted)]">
        Estado del pedido
      </p>
      {steps.map((step, index) => {
        const state = getTimelineStepState(step.status, status, steps)
        const isLast = index === steps.length - 1

        return (
          <motion.li
            key={step.status}
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: { opacity: 1, x: 0, transition: springSoft },
            }}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {!isLast ? (
              <motion.span
                className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-0.5"
                initial={false}
                animate={{
                  backgroundColor:
                    state === 'done'
                      ? 'var(--gp-red)'
                      : 'rgba(0,0,0,0.08)',
                }}
                transition={{ duration: 0.5 }}
                aria-hidden
              />
            ) : null}

            <motion.span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${dotClass(state)}`}
              animate={
                state === 'current' && !reduced
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={
                state === 'current'
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : springSoft
              }
            >
              {state === 'done' ? '✓' : index + 1}
            </motion.span>

            <motion.div
              className={`min-w-0 flex-1 pt-0.5 ${
                state === 'upcoming' ? 'opacity-45' : 'opacity-100'
              }`}
              layout
            >
              <p
                className={`text-sm font-bold ${
                  state === 'current'
                    ? 'text-[var(--gp-red)]'
                    : 'text-[var(--gp-ink)]'
                }`}
              >
                {step.label}
              </p>
              {state === 'current' && step.hint ? (
                <motion.p
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-xs text-[var(--gp-muted)]"
                >
                  {step.hint}
                </motion.p>
              ) : null}
            </motion.div>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}
