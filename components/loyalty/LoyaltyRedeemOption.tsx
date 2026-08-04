'use client'

const STORAGE_KEY = 'td-use-loyalty-reward'

export function readUseLoyaltyReward() {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

export function writeUseLoyaltyReward(value: boolean) {
  if (typeof window === 'undefined') return
  if (value) sessionStorage.setItem(STORAGE_KEY, '1')
  else sessionStorage.removeItem(STORAGE_KEY)
}

export function LoyaltyRedeemOption({
  checked,
  onChange,
  rewardProductName,
  stars,
  starsRequired,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  rewardProductName: string
  stars: number
  starsRequired: number
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--gp-yellow)]/40 bg-gradient-to-br from-[var(--gp-yellow)]/15 to-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[var(--gp-ink)]">Usar recompensa</p>
        <p className="mt-1 text-sm text-[var(--gp-muted)]">
          {rewardProductName} gratis · −{starsRequired} estrellas (tienes {stars})
        </p>
      </div>
    </label>
  )
}
