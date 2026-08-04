export type LoyaltyLevel = {
  level: number
  name: string
  minRedemptions: number
}

export const LOYALTY_LEVELS: LoyaltyLevel[] = [
  { level: 1, name: 'Nuevo', minRedemptions: 0 },
  { level: 2, name: 'Fan', minRedemptions: 1 },
  { level: 3, name: 'Pastaficionado', minRedemptions: 3 },
  { level: 4, name: 'VIP', minRedemptions: 6 },
]

export function getLoyaltyLevel(rewardsCount: number): LoyaltyLevel {
  let current = LOYALTY_LEVELS[0]
  for (const tier of LOYALTY_LEVELS) {
    if (rewardsCount >= tier.minRedemptions) current = tier
  }
  return current
}

export function getLoyaltyProgress(stars: number, starsRequired: number) {
  const safeRequired = Math.max(1, starsRequired)
  const filled = Math.min(Math.max(0, stars), safeRequired)
  const canRedeem = stars >= safeRequired
  return { filled, starsRequired: safeRequired, canRedeem }
}

export function isLoyaltyActive(settings: {
  loyalty_enabled?: boolean
  loyalty_reward_product_id?: string
}) {
  return (
    !!settings.loyalty_enabled &&
    (settings.loyalty_reward_product_id?.trim().length ?? 0) > 0
  )
}
