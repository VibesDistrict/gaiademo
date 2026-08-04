'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatUsd } from '@/lib/format'
import {
  buildWhatsAppUrl,
  customerOrderStatusMessage,
  fulfillmentLabel,
} from '@/lib/whatsapp'
import {
  ORDER_STATUS_STYLES,
  TERMINAL_ORDER_STATUSES,
} from '@/lib/order-status-styles'
import { formatYummyRidesText, deliveryAddress } from '@/lib/copy-text'
import { resolvePaymentProofUrl } from '@/lib/storage-urls'
import type { Order, OrderItem, OrderStatus } from '@/lib/types'
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/types'
import { CopyButton } from '@/components/brand/CopyButton'
import { PrimaryButton, SecondaryButton } from '@/components/ui'
import { isMissingArchiveColumnError } from '@/lib/orders-archive'

type ViewMode = 'active' | 'archived'
type StatusFilter = 'all' | 'payment_review' | 'kitchen' | 'ready' | 'done'

const STATUS_FLOW: OrderStatus[] = [
  'payment_review',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'picked_up',
]

function nextStatuses(order: Order): OrderStatus[] {
  if (order.status === 'payment_review') return ['confirmed', 'cancelled']
  if (order.status === 'confirmed') return ['preparing', 'cancelled']
  if (order.status === 'preparing') return ['ready', 'cancelled']
  if (order.status === 'ready') {
    return order.fulfillment === 'pickup'
      ? ['picked_up', 'cancelled']
      : ['delivered', 'cancelled']
  }
  return []
}

function matchesFilter(order: Order, filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'payment_review') return order.status === 'payment_review'
  if (filter === 'kitchen')
    return order.status === 'confirmed' || order.status === 'preparing'
  if (filter === 'ready') return order.status === 'ready'
  if (filter === 'done') return TERMINAL_ORDER_STATUSES.includes(order.status)
  return true
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString('es-VE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminOrders({
  pickupAddress,
  storeClosed,
  onStoreClosedChange,
  focusOrderId,
  onFocusOrderHandled,
}: {
  pickupAddress: string
  storeClosed: boolean
  onStoreClosedChange: (closed: boolean) => void
  focusOrderId?: string | null
  onFocusOrderHandled?: () => void
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [proofUrls, setProofUrls] = useState<Record<string, string | null>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('active')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [archiveSupported, setArchiveSupported] = useState<boolean | null>(null)

  async function applyOrderRows(rows: Order[]) {
    setOrders(rows)
    if (rows.length) {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .in(
          'order_id',
          rows.map((o) => o.id)
        )
      const map: Record<string, OrderItem[]> = {}
      for (const item of (items as OrderItem[]) ?? []) {
        map[item.order_id] = map[item.order_id] || []
        map[item.order_id].push(item)
      }
      setItemsByOrder(map)
    } else {
      setItemsByOrder({})
    }
  }

  async function loadOrders(mode: ViewMode = viewMode) {
    setError(null)

    if (archiveSupported === false && mode === 'archived') {
      setOrders([])
      setItemsByOrder({})
      return
    }

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (archiveSupported !== false) {
      query = query.eq('archived', mode === 'archived')
    }

    const { data, error: err } = await query

    if (err) {
      if (isMissingArchiveColumnError(err.message)) {
        setArchiveSupported(false)
        if (mode === 'archived') {
          setOrders([])
          setItemsByOrder({})
          return
        }
        const retry = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (retry.error) {
          setError(retry.error.message)
          return
        }
        await applyOrderRows((retry.data as Order[]) ?? [])
        return
      }
      setError(err.message)
      return
    }

    setArchiveSupported(true)
    await applyOrderRows((data as Order[]) ?? [])
  }

  useEffect(() => {
    void loadOrders(viewMode)
  }, [viewMode])

  useEffect(() => {
    if (!focusOrderId) return
    setViewMode('active')
    setStatusFilter('payment_review')
    setExpandedId(focusOrderId)
    onFocusOrderHandled?.()
  }, [focusOrderId, onFocusOrderHandled])

  useEffect(() => {
    async function attachItems(orderId: string) {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
      if (!items?.length) return
      setItemsByOrder((prev) => ({
        ...prev,
        [orderId]: items as OrderItem[],
      }))
    }

    const channel = supabase
      .channel('admin-orders-panel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as Order
          if (order.archived) return
          setOrders((prev) => {
            if (viewMode !== 'active') return prev
            if (prev.some((o) => o.id === order.id)) return prev
            return [order, ...prev]
          })
          void attachItems(order.id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as Order
          if (viewMode === 'active' && order.archived) {
            setOrders((prev) => prev.filter((o) => o.id !== order.id))
            return
          }
          if (viewMode === 'archived' && !order.archived) {
            setOrders((prev) => prev.filter((o) => o.id !== order.id))
            return
          }
          setOrders((prev) =>
            prev.map((o) => (o.id === order.id ? order : o))
          )
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [viewMode])

  useEffect(() => {
    if (!expandedId) return
    const order = orders.find((o) => o.id === expandedId)
    if (!order?.payment_proof_url) return
    if (proofUrls[expandedId] !== undefined) return

    let active = true
    resolvePaymentProofUrl(order.payment_proof_url).then((url) => {
      if (active) {
        setProofUrls((prev) => ({ ...prev, [expandedId]: url }))
      }
    })
    return () => {
      active = false
    }
  }, [expandedId, orders, proofUrls])

  const statusCounts = useMemo(() => {
    const counts = {
      payment_review: 0,
      kitchen: 0,
      ready: 0,
      done: 0,
    }
    for (const order of orders) {
      if (order.status === 'payment_review') counts.payment_review++
      if (order.status === 'confirmed' || order.status === 'preparing')
        counts.kitchen++
      if (order.status === 'ready') counts.ready++
      if (TERMINAL_ORDER_STATUSES.includes(order.status)) counts.done++
    }
    return counts
  }, [orders])

  const visibleOrders = useMemo(() => {
    const priority = (status: OrderStatus) => {
      const idx = STATUS_FLOW.indexOf(status)
      return idx === -1 ? 99 : idx
    }
    return [...orders]
      .filter((o) => matchesFilter(o, statusFilter))
      .sort((a, b) => {
        const p = priority(a.status) - priority(b.status)
        if (p !== 0) return p
        return +new Date(b.created_at) - +new Date(a.created_at)
      })
  }, [orders, statusFilter])

  async function updateStatus(orderId: string, status: OrderStatus) {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    if (err) {
      setError(err.message)
    } else {
      await loadOrders()
    }
    setBusy(false)
  }

  async function toggleStoreClosed() {
    setBusy(true)
    const next = !storeClosed
    const { error: err } = await supabase.from('settings').upsert({
      key: 'store_closed',
      value: next ? 'true' : 'false',
      updated_at: new Date().toISOString(),
    })
    if (err) setError(err.message)
    else onStoreClosedChange(next)
    setBusy(false)
  }

  async function archiveOrder(orderId: string) {
    if (!archiveSupported) {
      setError('Ejecuta supabase/promo_and_archive.sql en Supabase para archivar pedidos.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: err } = await supabase
      .from('orders')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    if (err) setError(err.message)
    else {
      if (expandedId === orderId) setExpandedId(null)
      await loadOrders()
    }
    setBusy(false)
  }

  async function restoreOrder(orderId: string) {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase
      .from('orders')
      .update({ archived: false, archived_at: null })
      .eq('id', orderId)
    if (err) setError(err.message)
    else await loadOrders()
    setBusy(false)
  }

  async function deleteOrder(orderId: string) {
    if (
      !window.confirm(
        '¿Eliminar este pedido permanentemente? No se puede deshacer.'
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.from('orders').delete().eq('id', orderId)
    if (err) setError(err.message)
    else {
      if (expandedId === orderId) setExpandedId(null)
      await loadOrders()
    }
    setBusy(false)
  }

  async function archiveCompleted() {
    if (!archiveSupported) {
      setError('Ejecuta supabase/promo_and_archive.sql en Supabase para archivar pedidos.')
      return
    }
    if (
      !window.confirm(
        '¿Archivar todos los pedidos completados o cancelados visibles?'
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    const ids = orders
      .filter((o) => TERMINAL_ORDER_STATUSES.includes(o.status))
      .map((o) => o.id)
    if (!ids.length) {
      setBusy(false)
      return
    }
    const { error: err } = await supabase
      .from('orders')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
      })
      .in('id', ids)
    if (err) setError(err.message)
    else await loadOrders()
    setBusy(false)
  }

  const filterChips: { id: StatusFilter; label: string; count?: number }[] =
    viewMode === 'active'
      ? [
          { id: 'all', label: 'Todos' },
          {
            id: 'payment_review',
            label: 'Revisar pago',
            count: statusCounts.payment_review,
          },
          { id: 'kitchen', label: 'En cocina', count: statusCounts.kitchen },
          { id: 'ready', label: 'Listos', count: statusCounts.ready },
          { id: 'done', label: 'Completados', count: statusCounts.done },
        ]
      : [{ id: 'all', label: 'Todos' }]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <p className="font-bold">Estado de la tienda</p>
          <p className="text-xs text-[var(--gp-muted)]">
            {storeClosed ? 'Cerrada · no acepta pedidos' : 'Abierta'}
          </p>
        </div>
        <SecondaryButton
          type="button"
          disabled={busy}
          onClick={toggleStoreClosed}
          className="px-3 py-2 text-xs"
        >
          {storeClosed ? 'Abrir' : 'Cerrar'}
        </SecondaryButton>
      </div>

      {archiveSupported === false ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Migración pendiente en Supabase</p>
          <p className="mt-1">
            Para archivar pedidos, ejecuta{' '}
            <code className="rounded bg-white px-1">supabase/promo_and_archive.sql</code>{' '}
            en el SQL Editor. Mientras tanto, los pedidos se muestran normalmente.
          </p>
        </div>
      ) : null}

      {archiveSupported !== false ? (
      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setViewMode('active')
            setStatusFilter('all')
          }}
          className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
            viewMode === 'active'
              ? 'bg-[var(--gp-red)] text-white'
              : 'text-[var(--gp-muted)] hover:bg-[var(--gp-cream)]'
          }`}
        >
          Activos{viewMode === 'active' ? ` (${orders.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('archived')
            setStatusFilter('all')
          }}
          className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
            viewMode === 'archived'
              ? 'bg-[var(--gp-red)] text-white'
              : 'text-[var(--gp-muted)] hover:bg-[var(--gp-cream)]'
          }`}
        >
          Archivados{viewMode === 'archived' ? ` (${orders.length})` : ''}
        </button>
      </div>
      ) : null}

      {viewMode === 'active' ? (
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                statusFilter === chip.id
                  ? 'bg-[var(--gp-ink)] text-white'
                  : 'bg-white text-[var(--gp-muted)] shadow-sm'
              }`}
            >
              {chip.label}
              {chip.count != null && chip.count > 0 ? ` (${chip.count})` : ''}
            </button>
          ))}
          {statusCounts.done > 0 && archiveSupported ? (
            <SecondaryButton
              type="button"
              className="ml-auto px-3 py-1 text-[11px]"
              disabled={busy}
              onClick={archiveCompleted}
            >
              Archivar completados
            </SecondaryButton>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        {visibleOrders.length === 0 ? (
          <p className="text-sm text-[var(--gp-muted)]">
            {viewMode === 'archived'
              ? 'No hay pedidos archivados.'
              : 'No hay pedidos en esta vista.'}
          </p>
        ) : (
          visibleOrders.map((order) => {
            const expanded = expandedId === order.id
            const styles = ORDER_STATUS_STYLES[order.status]
            const items = itemsByOrder[order.id] || []
            const destination = deliveryAddress(order)
            const proofUrl = proofUrls[order.id]
            const yummyCopyText =
              order.fulfillment === 'delivery'
                ? formatYummyRidesText({
                    order,
                    items,
                    pickupAddress,
                  })
                : ''
            const customerWhatsAppUrl = order.customer_phone?.trim()
              ? buildWhatsAppUrl(
                  order.customer_phone.trim(),
                  customerOrderStatusMessage({ order })
                )
              : null

            return (
              <div
                key={order.id}
                className={`overflow-hidden rounded-2xl border-l-4 bg-white shadow-sm ${styles.border}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((id) => (id === order.id ? null : order.id))
                  }
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                          aria-hidden
                        />
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--gp-muted)]">
                      {fulfillmentLabel(order.fulfillment)}
                      {order.fulfillment === 'dine_in' && order.address
                        ? ` · ${order.address}`
                        : ''}{' '}
                      · {formatOrderDate(order.created_at)}
                      {order.customer_name ? ` · ${order.customer_name}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="font-extrabold text-[var(--gp-red)]">
                      {formatUsd(Number(order.total_usd))}
                    </p>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`h-4 w-4 text-[var(--gp-muted)] transition ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 7.5l5 5 5-5"
                      />
                    </svg>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-black/5 px-4 pb-4 pt-3 text-sm">
                        {order.customer_name ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Cliente: {order.customer_name}</span>
                            <CopyButton
                              compact
                              text={order.customer_name}
                              label="Copiar nombre"
                              copiedLabel="Listo"
                            />
                          </div>
                        ) : null}
                        {order.customer_phone ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Tel: {order.customer_phone}</span>
                            <CopyButton
                              compact
                              text={order.customer_phone}
                              label="Copiar tel"
                              copiedLabel="Listo"
                            />
                            {customerWhatsAppUrl ? (
                              <a
                                href={customerWhatsAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-[#25D366]/10 px-2.5 py-1 text-[11px] font-bold text-[#128C7E]"
                              >
                                WhatsApp
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                        {destination ? (
                          <div className="flex flex-wrap items-start gap-2">
                            <span className="min-w-0 flex-1">
                              Dirección: {destination}
                            </span>
                            <CopyButton
                              compact
                              text={destination}
                              label="Copiar dirección"
                              copiedLabel="Listo"
                            />
                          </div>
                        ) : null}
                        {order.payment_status ? (
                          <p className="text-[var(--gp-muted)]">
                            Pago:{' '}
                            {PAYMENT_STATUS_LABELS[order.payment_status] ??
                              order.payment_status}
                          </p>
                        ) : null}
                        {order.payment_method ? (
                          <p>
                            {PAYMENT_METHOD_LABELS[order.payment_method]}
                            {order.payment_ref
                              ? ` · Ref ${order.payment_ref}`
                              : ''}
                          </p>
                        ) : null}
                        {order.notes?.trim() ? (
                          <div className="flex flex-wrap items-start gap-2">
                            <span className="min-w-0 flex-1">
                              Notas: {order.notes.trim()}
                            </span>
                            <CopyButton
                              compact
                              text={order.notes.trim()}
                              label="Copiar notas"
                              copiedLabel="Listo"
                            />
                          </div>
                        ) : null}
                        <ul className="space-y-1">
                          {items.map((item) => (
                            <li key={item.id}>
                              {item.qty}x {item.name_snapshot}
                            </li>
                          ))}
                        </ul>

                        {order.fulfillment === 'delivery' ? (
                          <div className="space-y-2 rounded-xl bg-[var(--gp-cream)] p-3">
                            <p className="text-sm font-bold">Yummy / Mandaditos</p>
                            <CopyButton
                              text={yummyCopyText}
                              label="Copiar todo para Yummy"
                              copiedLabel="Copiado"
                              className="w-full justify-center"
                            />
                          </div>
                        ) : null}

                        {proofUrl ? (
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proofUrl}
                              alt="Comprobante de pago"
                              className="max-h-48 w-full rounded-xl object-contain bg-[var(--gp-cream)]"
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2 pt-1">
                          {nextStatuses(order).map((status) => (
                            <PrimaryButton
                              key={status}
                              type="button"
                              disabled={busy}
                              className={`px-3 py-2 text-xs ${
                                status === 'cancelled'
                                  ? 'bg-red-500 shadow-none'
                                  : status === 'confirmed'
                                    ? ''
                                    : 'bg-[var(--gp-brown)] shadow-none'
                              }`}
                              onClick={() => updateStatus(order.id, status)}
                            >
                              {status === 'confirmed'
                                ? 'Confirmar pago'
                                : ORDER_STATUS_LABELS[status]}
                            </PrimaryButton>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-black/5 pt-3">
                          {archiveSupported && viewMode === 'active' ? (
                            <SecondaryButton
                              type="button"
                              className="px-3 py-1.5 text-xs"
                              disabled={busy}
                              onClick={() => archiveOrder(order.id)}
                            >
                              Archivar
                            </SecondaryButton>
                          ) : archiveSupported && viewMode === 'archived' ? (
                            <>
                              <SecondaryButton
                                type="button"
                                className="px-3 py-1.5 text-xs"
                                disabled={busy}
                                onClick={() => restoreOrder(order.id)}
                              >
                                Restaurar
                              </SecondaryButton>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-bold text-red-500"
                                disabled={busy}
                                onClick={() => deleteOrder(order.id)}
                              >
                                Eliminar
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
