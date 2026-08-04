'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { shouldAlertAdminForOrder } from '@/lib/admin-order-alert'
import { isMissingArchiveColumnError } from '@/lib/orders-archive'
import { syncSupabaseRealtimeAuth } from '@/lib/realtime-auth'
import { adminOrderAlertMessage } from '@/lib/whatsapp'
import {
  playOrderAlertSound,
  requestNotificationPermission,
  showOrderNotification,
  unlockAlertAudio,
} from '@/lib/notify'
import type { Order } from '@/lib/types'
import { ClientPortal } from '@/components/brand/ClientPortal'
import { NewOrderAlertModal } from '@/components/admin/NewOrderAlertModal'

const POLL_MS = 5_000

export function AdminOrderAlerts({
  enabled,
  onNewOrder,
  onViewOrder,
}: {
  enabled: boolean
  onNewOrder: (order: Order) => void
  onViewOrder: (order: Order) => void
}) {
  const { session } = useAuth()
  const [alertQueue, setAlertQueue] = useState<Order[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())
  const seededRef = useRef(false)

  const alertOrder = alertQueue[0] ?? null

  const enqueueAlert = useCallback((order: Order) => {
    setAlertQueue((queue) => {
      if (queue.some((item) => item.id === order.id)) return queue
      return [...queue, order]
    })
  }, [])

  const dismissAlert = useCallback(() => {
    setAlertQueue((queue) => queue.slice(1))
  }, [])

  const handleNewOrder = useCallback(
    (order: Order) => {
      if (
        !shouldAlertAdminForOrder(
          order,
          seenIdsRef.current,
          seededRef.current
        )
      ) {
        return
      }

      seenIdsRef.current.add(order.id)
      unlockAlertAudio()
      playOrderAlertSound()
      showOrderNotification(
        'Gaia Pasta · Nuevo pedido',
        adminOrderAlertMessage(order),
        `gaiapasta-new-${order.id}`
      )
      enqueueAlert(order)
      onNewOrder(order)
    },
    [enqueueAlert, onNewOrder]
  )

  useEffect(() => {
    if (!enabled || !session?.access_token) return

    void requestNotificationPermission()
  }, [enabled, session?.access_token])

  useEffect(() => {
    if (!enabled || !session?.access_token) return

    let active = true
    seededRef.current = false
    seenIdsRef.current.clear()

    async function seedExistingOrders() {
      let query = supabase
        .from('orders')
        .select('id')
        .eq('status', 'payment_review')
        .order('created_at', { ascending: false })
        .limit(60)

      let { data, error } = await query.eq('archived', false)

      if (error && isMissingArchiveColumnError(error.message)) {
        const retry = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'payment_review')
          .order('created_at', { ascending: false })
          .limit(60)
        data = retry.data
        error = retry.error
      }

      if (!active) return

      for (const row of data ?? []) {
        seenIdsRef.current.add(row.id)
      }

      seededRef.current = true
    }

    void seedExistingOrders()

    return () => {
      active = false
    }
  }, [enabled, session?.access_token, session?.user?.id])

  useEffect(() => {
    if (!enabled || !session?.access_token) return

    let cancelled = false
    let channel: RealtimeChannel | null = null

    async function subscribeRealtime() {
      await syncSupabaseRealtimeAuth(session)
      if (cancelled) return

      const userId = session!.user.id
      channel = supabase
        .channel(`admin-new-order-alerts-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            handleNewOrder(payload.new as Order)
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            handleNewOrder(payload.new as Order)
          }
        )
        .subscribe()
    }

    void subscribeRealtime()

    return () => {
      cancelled = true
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [enabled, session?.access_token, session?.user?.id, handleNewOrder])

  useEffect(() => {
    if (!enabled || !session?.access_token) return

    async function pollRecentOrders() {
      if (!seededRef.current) return

      let query = supabase
        .from('orders')
        .select('*')
        .eq('status', 'payment_review')
        .order('created_at', { ascending: false })
        .limit(12)

      let { data, error } = await query.eq('archived', false)

      if (error && isMissingArchiveColumnError(error.message)) {
        const retry = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'payment_review')
          .order('created_at', { ascending: false })
          .limit(12)
        data = retry.data
        error = retry.error
      }

      if (error || !data?.length) return

      for (const order of [...(data as Order[])].reverse()) {
        handleNewOrder(order)
      }
    }

    void pollRecentOrders()

    const interval = window.setInterval(() => {
      void pollRecentOrders()
    }, POLL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [enabled, session?.access_token, handleNewOrder])

  return (
    <>
      {alertOrder ? (
        <ClientPortal>
          <NewOrderAlertModal
            order={alertOrder}
            onClose={dismissAlert}
            onView={(order) => {
              dismissAlert()
              onViewOrder(order)
            }}
          />
        </ClientPortal>
      ) : null}
    </>
  )
}
