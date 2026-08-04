import type { StoreSettings } from '@/lib/types'

export function isPromoActive(settings: StoreSettings | null | undefined) {
  if (!settings?.promo_enabled) return false
  return (settings.promo_title?.trim().length ?? 0) > 0
}
