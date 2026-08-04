'use client'

import Link from 'next/link'
import { getLoyaltyLevel, getLoyaltyProgress } from '@/lib/loyalty'
import { PrimaryButton } from '@/components/ui'
import { writeUseLoyaltyReward } from '@/components/loyalty/LoyaltyRedeemOption'
import { GiftIcon, LoyaltyStepper } from '@/components/loyalty/LoyaltyStepper'

export function LoyaltyProgress({
  stars,
  starsRequired,
  rewardsCount,
  rewardProductName,
  minSubtotalUsd,
  enabled,
}: {
  stars: number
  starsRequired: number
  rewardsCount: number
  rewardProductName?: string | null
  minSubtotalUsd: number
  enabled: boolean
}) {
  if (!enabled) return null

  const level = getLoyaltyLevel(rewardsCount)
  const { filled, canRedeem } = getLoyaltyProgress(stars, starsRequired)

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--gp-red)]/10">
      <div className="border-b border-black/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
              Gaia Pasta Rewards
            </p>
            <p className="font-[family-name:var(--font-display)] text-lg leading-tight text-[var(--gp-ink)]">
              {filled} de {starsRequired} estrellas
            </p>
          </div>
          <span className="rounded-full bg-[var(--gp-yellow)]/30 px-2.5 py-1 text-[11px] font-extrabold text-[var(--gp-ink)]">
            {rewardsCount} canje{rewardsCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="px-4 py-5">
        <LoyaltyStepper
          stars={stars}
          starsRequired={starsRequired}
          size="md"
          className="mx-2"
        />

        <p className="mt-4 text-center text-sm text-[var(--gp-muted)]">
          {canRedeem ? (
            <span className="font-semibold text-[var(--gp-ink)]">
              ¡Listo para canjear tu regalo!
            </span>
          ) : (
            <>
              Sube a <span className="font-semibold text-[var(--gp-ink)]">{level.name}</span>{' '}
              con más canjes · pedidos desde ${minSubtotalUsd.toFixed(0)}
            </>
          )}
        </p>

        {rewardProductName ? (
          <p className="mt-1 text-center text-xs text-[var(--gp-muted)]">
            Recompensa: {rewardProductName}
          </p>
        ) : null}
      </div>

      {canRedeem ? (
        <div className="border-t border-black/5 bg-gradient-to-br from-[var(--gp-yellow)]/15 via-white to-[var(--gp-red)]/5 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--gp-yellow)]/25 text-[var(--gp-red)]">
              <GiftIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[var(--gp-ink)]">¡Ganaste un regalo!</p>
              <p className="text-xs text-[var(--gp-muted)]">
                Canjéalo en tu próximo pedido.
              </p>
            </div>
          </div>
          <Link
            href="/cart"
            className="mt-3 block"
            onClick={() => writeUseLoyaltyReward(true)}
          >
            <PrimaryButton type="button" className="w-full">
              Usar recompensa
            </PrimaryButton>
          </Link>
        </div>
      ) : null}
    </div>
  )
}
