'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useStoreSettings } from '@/lib/settings-context'
import { supabase } from '@/lib/supabase'
import { isLoyaltyActive } from '@/lib/loyalty'
import { LoadingMessage, SecondaryButton } from '@/components/ui'
import { AddressManager } from '@/components/cart/AddressManager'
import { LoyaltyProgress } from '@/components/loyalty/LoyaltyProgress'
import { ProfileHeader } from '@/components/brand/ProfileHeader'

export default function CuentaPage() {
  const { profile, signOut } = useAuth()
  const { settings } = useStoreSettings()
  const { user, loading } = useRequireAuth('/cuenta')
  const [rewardProductName, setRewardProductName] = useState<string | null>(null)

  const loyaltyActive = settings ? isLoyaltyActive(settings) : false

  useEffect(() => {
    if (!settings?.loyalty_reward_product_id) {
      setRewardProductName(null)
      return
    }
    let active = true
    supabase
      .from('products')
      .select('name')
      .eq('id', settings.loyalty_reward_product_id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRewardProductName(data?.name ?? null)
      })
    return () => {
      active = false
    }
  }, [settings?.loyalty_reward_product_id])

  if (loading || !user) {
    return <LoadingMessage />
  }

  const stars = profile?.loyalty_stars ?? 0
  const rewardsCount = profile?.loyalty_rewards_count ?? 0
  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || 'Cliente'

  return (
    <div className="gp-fade-in space-y-4">
      <ProfileHeader
        name={displayName}
        email={user.email}
        phone={profile?.phone}
        rewardsCount={rewardsCount}
        showLevel={loyaltyActive}
      />

      {loyaltyActive ? (
        <LoyaltyProgress
          stars={stars}
          starsRequired={settings?.loyalty_stars_required ?? 5}
          rewardsCount={rewardsCount}
          rewardProductName={rewardProductName}
          minSubtotalUsd={settings?.loyalty_min_subtotal_usd ?? 20}
          enabled
        />
      ) : null}

      <AddressManager userId={user.id} collapsible />

      <div className="grid gap-2">
        <Link
          href="/orders"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-[var(--gp-ink)] shadow-sm ring-1 ring-black/5"
        >
          Mis pedidos
          <span className="text-[var(--gp-red)]">→</span>
        </Link>
        <Link
          href="/contacto"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-[var(--gp-ink)] shadow-sm ring-1 ring-black/5"
        >
          Contacto y redes
          <span className="text-[var(--gp-red)]">→</span>
        </Link>
        <Link
          href="/sugerencias"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-[var(--gp-ink)] shadow-sm ring-1 ring-black/5"
        >
          Enviar sugerencia
          <span className="text-[var(--gp-red)]">→</span>
        </Link>
      </div>

      <SecondaryButton
        type="button"
        className="w-full"
        onClick={() => signOut()}
      >
        Cerrar sesión
      </SecondaryButton>
    </div>
  )
}
