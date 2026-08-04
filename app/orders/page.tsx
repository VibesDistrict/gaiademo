'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRequireAuth } from '@/lib/use-require-auth'
import { formatUsd } from '@/lib/format'
import { fulfillmentLabel } from '@/lib/whatsapp'
import type { Order } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'
import { LoadingMessage, SectionTitle } from '@/components/ui'

export default function OrdersPage() {
  const { user, loading } = useRequireAuth('/orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) setError(err.message)
        else setOrders((data as Order[]) ?? [])
        setFetching(false)
      })

    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Order
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          )
        }
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [user])

  if (loading || !user) {
    return <LoadingMessage />
  }

  return (
    <div className="gp-fade-in space-y-4">
      <SectionTitle
        title="Mis pedidos"
        subtitle="Sigue el estado de cada orden"
      />

      {fetching ? (
        <p className="text-sm text-[var(--gp-muted)]">Cargando pedidos...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white p-5 text-sm text-[var(--gp-muted)] shadow-sm">
          Aún no tienes pedidos.{' '}
          <Link href="/" className="font-semibold text-[var(--gp-red)]">
            Ir al menú
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-[var(--gp-muted)]">
                    {fulfillmentLabel(order.fulfillment)} ·{' '}
                    {new Date(order.created_at).toLocaleString('es-VE')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[var(--gp-red)]">
                    {formatUsd(Number(order.total_usd))}
                  </p>
                  <p className="mt-1 rounded-full bg-[var(--gp-cream)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--gp-brown)]">
                    {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
