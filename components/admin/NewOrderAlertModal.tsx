'use client'

import { useEffect } from 'react'
import { adminOrderAlertMessage, fulfillmentLabel } from '@/lib/whatsapp'
import { formatUsd } from '@/lib/format'
import type { Order } from '@/lib/types'
import { PrimaryButton, SecondaryButton } from '@/components/ui'

export function NewOrderAlertModal({
  order,
  onClose,
  onView,
}: {
  order: Order
  onClose: () => void
  onView: (order: Order) => void
}) {
  const shortId = order.id.slice(0, 8).toUpperCase()

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouchAction
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--gp-ink)]/60 p-4 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-alert-title"
      style={{ touchAction: 'none' }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-2 ring-[var(--gp-yellow)]"
        style={{ touchAction: 'auto' }}
      >
        <div className="bg-gradient-to-r from-[var(--gp-red)] to-[#f06292] px-4 py-3 text-white">
          <p
            id="new-order-alert-title"
            className="font-[family-name:var(--font-display)] text-lg font-bold"
          >
            ¡Nuevo pedido!
          </p>
          <p className="text-sm text-white/90">Revisa el pago cuando puedas</p>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl bg-[var(--gp-yellow)]/25 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gp-muted)]">
              Pedido #{shortId}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--gp-ink)]">
              {adminOrderAlertMessage(order)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-[var(--gp-cream)] px-2.5 py-2">
              <dt className="text-[10px] font-bold uppercase text-[var(--gp-muted)]">
                Modalidad
              </dt>
              <dd className="font-semibold text-[var(--gp-ink)]">
                {fulfillmentLabel(order.fulfillment)}
              </dd>
            </div>
            <div className="rounded-lg bg-[var(--gp-cream)] px-2.5 py-2">
              <dt className="text-[10px] font-bold uppercase text-[var(--gp-muted)]">
                Total
              </dt>
              <dd className="font-semibold text-[var(--gp-red)]">
                {formatUsd(Number(order.total_usd))}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <SecondaryButton type="button" className="w-full" onClick={onClose}>
              Cerrar
            </SecondaryButton>
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => onView(order)}
            >
              Ver pedido
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
