'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getLoyaltyLevel, getLoyaltyProgress, isLoyaltyActive } from '@/lib/loyalty'
import type { StoreSettings } from '@/lib/types'
import { LoyaltyStepper } from '@/components/loyalty/LoyaltyStepper'

export function LoyaltyHomeTeaser({
  settings,
  rewardProductName,
}: {
  settings: StoreSettings | null
  rewardProductName?: string | null
}) {
  const { user, profile } = useAuth()

  if (!settings || !isLoyaltyActive(settings)) return null

  const starsRequired = settings.loyalty_stars_required
  const minSubtotal = settings.loyalty_min_subtotal_usd
  const stars = profile?.loyalty_stars ?? 0
  const rewardsCount = profile?.loyalty_rewards_count ?? 0
  const level = getLoyaltyLevel(rewardsCount)
  const { filled, canRedeem } = getLoyaltyProgress(stars, starsRequired)

  if (!user) {
    return (
      <Link
        href="/auth?next=/cuenta"
        className="block rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[var(--gp-red)]/10 transition hover:ring-[var(--gp-red)]/25"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gp-yellow)]/25 text-lg text-[var(--gp-red)]">
            ★
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
              Gaia Pasta Rewards
            </p>
            <p className="font-bold text-[var(--gp-ink)]">
              Acumula estrellas y gana regalos
            </p>
            <p className="text-xs text-[var(--gp-muted)]">
              {starsRequired} pedidos desde ${minSubtotal.toFixed(0)} → recompensa
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold text-[var(--gp-red)]">→</span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href="/cuenta"
      className="block rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[var(--gp-red)]/10 transition hover:ring-[var(--gp-red)]/25"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
            Gaia Pasta Rewards
          </p>
          <p className="text-sm font-bold text-[var(--gp-ink)]">
            Nivel {level.level} · {level.name}
          </p>
        </div>
        {canRedeem ? (
          <span className="rounded-full bg-[var(--gp-yellow)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--gp-ink)]">
            ¡Canje listo!
          </span>
        ) : (
          <span className="text-xs font-semibold text-[var(--gp-muted)]">
            {filled}/{starsRequired}
          </span>
        )}
      </div>

      <LoyaltyStepper stars={stars} starsRequired={starsRequired} size="sm" />

      {rewardProductName ? (
        <p className="mt-2.5 text-center text-[11px] text-[var(--gp-muted)]">
          Próximo regalo: {rewardProductName}
        </p>
      ) : null}
    </Link>
  )
}
