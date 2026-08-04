'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useRequireAuth } from '@/lib/use-require-auth'
import { resolvePaymentProofUrl } from '@/lib/storage-urls'
import { formatBs, formatUsd } from '@/lib/format'
import { fulfillmentLabel } from '@/lib/whatsapp'
import {
  customerStatusNotificationBody,
  isTerminalStatus,
} from '@/lib/order-timeline'
import type { Feedback, Order, OrderItem, OrderStatus } from '@/lib/types'
import {
  canReviewOrder,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/types'
import { OrderTimeline } from '@/components/orders/OrderTimeline'
import { OrderReviewForm, StarDisplay } from '@/components/orders/OrderReviewForm'
import {
  playCustomerAlertSound,
  requestNotificationPermission,
  showOrderNotification,
} from '@/lib/notify'
import { LoadingMessage, SecondaryButton, SectionTitle } from '@/components/ui'

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { user, loading } = useRequireAuth(`/orders/${params.id}`)
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [existingReview, setExistingReview] = useState<Feedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [statusBanner, setStatusBanner] = useState<string | null>(null)
  const prevStatusRef = useRef<OrderStatus | null>(null)

  useEffect(() => {
    void requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (!user || !params.id) return

    async function load() {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      if (orderError || !orderData) {
        setError(orderError?.message ?? 'Pedido no encontrado')
        return
      }

      const row = orderData as Order
      setOrder(row)
      prevStatusRef.current = row.status

      const { data: itemData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', params.id)
      setItems((itemData as OrderItem[]) ?? [])

      const { data: reviewData } = await supabase
        .from('feedback')
        .select('*')
        .eq('order_id', params.id)
        .eq('type', 'review')
        .maybeSingle()
      setExistingReview((reviewData as Feedback) ?? null)

      setProofUrl(await resolvePaymentProofUrl(row.payment_proof_url))
    }

    load()

    const channel = supabase
      .channel(`order-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          const updated = payload.new as Order
          const previous = prevStatusRef.current

          setOrder(updated)

          if (previous && previous !== updated.status) {
            const label = ORDER_STATUS_LABELS[updated.status]
            setStatusBanner(label)
            playCustomerAlertSound()
            showOrderNotification(
              'Gaia Pasta · Actualización de pedido',
              customerStatusNotificationBody(updated.id, updated.status),
              `gaiapasta-order-${updated.id}`
            )
            window.setTimeout(() => setStatusBanner(null), 5000)
          }

          prevStatusRef.current = updated.status
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, params.id])

  if (loading || !user) {
    return <LoadingMessage />
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!order) {
    return <p className="text-sm text-[var(--gp-muted)]">Cargando pedido...</p>
  }

  return (
    <div className="gp-fade-in space-y-4">
      <SectionTitle
        title={`Pedido #${order.id.slice(0, 8).toUpperCase()}`}
        subtitle={
          isTerminalStatus(order.status)
            ? ORDER_STATUS_LABELS[order.status]
            : 'Sigue tu pedido en tiempo real'
        }
      />

      <AnimatePresence>
        {statusBanner ? (
          <motion.div
            key="status-banner"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl bg-[var(--gp-yellow)]/25 px-4 py-3 text-sm font-bold text-[var(--gp-ink)] ring-1 ring-[var(--gp-yellow)]/40"
          >
            Actualización: {statusBanner}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <OrderTimeline status={order.status} fulfillment={order.fulfillment} />

      <div className="rounded-2xl bg-white p-4 text-sm shadow-sm space-y-2">
        <p>
          <span className="text-[var(--gp-muted)]">Modalidad:</span>{' '}
          <strong>{fulfillmentLabel(order.fulfillment)}</strong>
        </p>
        {order.address ? (
          <p>
            <span className="text-[var(--gp-muted)]">Dirección:</span>{' '}
            {order.address}
          </p>
        ) : null}
        {order.payment_method ? (
          <p>
            <span className="text-[var(--gp-muted)]">Pago:</span>{' '}
            {PAYMENT_METHOD_LABELS[order.payment_method]}
          </p>
        ) : null}
        {order.payment_ref ? (
          <p>
            <span className="text-[var(--gp-muted)]">Referencia:</span>{' '}
            {order.payment_ref}
          </p>
        ) : null}
        {order.notes ? (
          <p>
            <span className="text-[var(--gp-muted)]">Notas:</span> {order.notes}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gp-muted)]">
          Detalle
        </p>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.qty}x {item.name_snapshot}
              </span>
              <span className="font-semibold">
                {formatUsd(Number(item.unit_price_usd) * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-black/5 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatUsd(Number(order.subtotal_usd))}</span>
          </div>
          <div className="flex justify-between text-[var(--gp-muted)]">
            <span>Delivery</span>
            <span>{formatUsd(Number(order.delivery_fee_usd))}</span>
          </div>
          <div className="mt-2 flex justify-between font-extrabold">
            <span>Total</span>
            <span className="text-[var(--gp-red)]">
              {formatUsd(Number(order.total_usd))}
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-[var(--gp-muted)]">
            {formatBs(Number(order.total_usd), Number(order.rate_bs))}
          </p>
        </div>
      </div>

      {proofUrl ? (
        <a
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl bg-[var(--gp-yellow)]/20 px-4 py-3 text-center text-sm font-bold text-[var(--gp-ink)]"
        >
          Ver comprobante
        </a>
      ) : null}

      {canReviewOrder(order.status) ? (
        existingReview ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold">Tu review</p>
            {existingReview.rating ? (
              <div className="mt-2">
                <StarDisplay rating={existingReview.rating} />
              </div>
            ) : null}
            {existingReview.message ? (
              <p className="mt-2 text-sm text-[var(--gp-muted)]">
                {existingReview.message}
              </p>
            ) : null}
          </div>
        ) : user ? (
          <OrderReviewForm
            orderId={order.id}
            userId={user.id}
            customerName={
              profile?.full_name?.trim() ||
              order.customer_name?.trim() ||
              'Cliente'
            }
            onSubmitted={({ rating, message }) =>
              setExistingReview({
                id: 'submitted',
                user_id: user.id,
                order_id: order.id,
                type: 'review',
                rating,
                message,
                customer_name: profile?.full_name ?? '',
                read_by_admin: false,
                created_at: new Date().toISOString(),
              })
            }
          />
        ) : null
      ) : null}

      <Link href="/orders">
        <SecondaryButton type="button" className="w-full">
          Volver a mis pedidos
        </SecondaryButton>
      </Link>
    </div>
  )
}
