'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { fetchSettingsMap, mapSettings } from '@/lib/settings'
import { isMissingArchiveColumnError } from '@/lib/orders-archive'
import {
  SectionTitle,
} from '@/components/ui'
import { AdminProducts } from '@/components/admin/AdminProducts'
import { AdminPayments } from '@/components/admin/AdminPayments'
import { AdminSettings } from '@/components/admin/AdminSettings'
import { AdminFeedback } from '@/components/admin/AdminFeedback'
import { AdminPromo } from '@/components/admin/AdminPromo'
import { AdminLoyalty } from '@/components/admin/AdminLoyalty'
import { AdminOrders } from '@/components/admin/AdminOrders'
import { AdminOrderAlerts } from '@/components/admin/AdminOrderAlerts'
import { AdminTables } from '@/components/admin/AdminTables'
import { unlockAlertAudio } from '@/lib/notify'
import type { Order } from '@/lib/types'

type AdminTab = 'orders' | 'menu' | 'payments' | 'feedback' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [tab, setTab] = useState<AdminTab>('orders')
  const [storeClosed, setStoreClosed] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('')
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth?next=/admin')
      return
    }
    if (profile && profile.role !== 'admin') {
      router.replace('/')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    let active = true

    fetchSettingsMap().then((map) => {
      if (!active) return
      const settings = mapSettings(map)
      setStoreClosed(settings.store_closed)
      setPickupAddress(settings.pickup_address)
    })

    async function loadPendingReviewCount() {
      let result = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('archived', false)
        .eq('status', 'payment_review')

      if (result.error && isMissingArchiveColumnError(result.error.message)) {
        result = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'payment_review')
      }

      if (!active || result.error) return
      setPendingReviewCount(result.count ?? 0)
    }

    void loadPendingReviewCount()

    supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('read_by_admin', false)
      .then(({ count, error: countErr }) => {
        if (!active || countErr) return
        setUnreadFeedbackCount(count ?? 0)
      })

    return () => {
      active = false
    }
  }, [profile?.role])

  useEffect(() => {
    if (profile?.role !== 'admin') return

    function unlock() {
      unlockAlertAudio()
    }

    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock, { passive: true })

    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [profile?.role])

  const handleNewOrderAlert = useCallback((order: Order) => {
    setPendingReviewCount((count) => count + 1)
    if (order.status === 'payment_review') {
      setFocusOrderId((current) => current ?? order.id)
    }
  }, [])

  const handleViewOrderAlert = useCallback((order: Order) => {
    setTab('orders')
    setFocusOrderId(order.id)
  }, [])

  const tabs: { id: AdminTab; label: string; badge?: number }[] = useMemo(
    () => [
      { id: 'orders', label: 'Pedidos', badge: pendingReviewCount },
      { id: 'menu', label: 'Menú' },
      { id: 'payments', label: 'Pagos' },
      { id: 'feedback', label: 'Opiniones', badge: unreadFeedbackCount },
      { id: 'settings', label: 'Ajustes' },
    ],
    [pendingReviewCount, unreadFeedbackCount]
  )

  if (loading || !user || profile?.role !== 'admin') {
    return <p className="text-sm text-[var(--gp-muted)]">Verificando acceso...</p>
  }

  return (
    <div className="gp-fade-in space-y-5">
      <AdminOrderAlerts
        enabled={profile?.role === 'admin'}
        onNewOrder={handleNewOrderAlert}
        onViewOrder={handleViewOrderAlert}
      />

      <SectionTitle
        title="Caja Gaia Pasta"
        subtitle="Pedidos, Dinner In, menú, pagos y ajustes"
      />

      <div className="grid grid-cols-5 gap-0.5 rounded-2xl bg-white p-1 shadow-sm">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`relative rounded-xl px-2 py-2 text-xs font-bold transition ${
              tab === item.id
                ? 'bg-[var(--gp-red)] text-white'
                : 'text-[var(--gp-ink)] hover:bg-[var(--gp-cream)]'
            }`}
          >
            {item.label}
            {item.badge && item.badge > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gp-yellow)] px-1 text-[10px] font-extrabold text-[var(--gp-ink)]">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <AdminOrders
          pickupAddress={pickupAddress}
          storeClosed={storeClosed}
          onStoreClosedChange={setStoreClosed}
          focusOrderId={focusOrderId}
          onFocusOrderHandled={() => setFocusOrderId(null)}
        />
      ) : null}

      {tab === 'menu' ? <AdminProducts /> : null}
      {tab === 'payments' ? <AdminPayments /> : null}
      {tab === 'feedback' ? <AdminFeedback /> : null}
      {tab === 'settings' ? (
        <div className="space-y-3">
          <AdminTables />
          <AdminLoyalty />
          <AdminPromo />
          <AdminSettings onStoreClosedChange={setStoreClosed} />
        </div>
      ) : null}
    </div>
  )
}
