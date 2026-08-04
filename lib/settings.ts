import { supabase } from '@/lib/supabase'
import { parseSettingNumber } from '@/lib/format'
import type { StoreSettings } from '@/lib/types'
import type { BcvRateResult } from '@/lib/bcv-rate'

const DEFAULTS: StoreSettings = {
  rate_bs: 36.5,
  auto_bcv_rate: true,
  rate_bs_updated_at: '',
  delivery_fee_usd: 2,
  min_order_usd: 5,
  store_closed: false,
  whatsapp: '',
  open_hours: 'Martes a Domingo 4:00pm - 10:00pm',
  auto_whatsapp_notify: true,
  pickup_address: '',
  notify_customer_on_status: true,
  instagram: '',
  tiktok: '',
  facebook: '',
  promo_enabled: false,
  promo_sponsor: '',
  promo_title: '',
  promo_subtitle: '',
  promo_link: '',
  promo_image_url: '',
  promo_cta: 'Ver más',
  loyalty_enabled: false,
  loyalty_min_subtotal_usd: 20,
  loyalty_stars_required: 5,
  loyalty_reward_product_id: '',
}

export type AdminSettingsForm = {
  whatsapp: string
  rate_bs: string
  auto_bcv_rate: boolean
  rate_bs_updated_at: string
  delivery_fee_usd: string
  min_order_usd: string
  open_hours: string
  pickup_address: string
  store_closed: boolean
  instagram: string
  tiktok: string
  facebook: string
}

export function normalizeStoreSettings(
  partial: Partial<StoreSettings> | null | undefined
): StoreSettings {
  if (!partial) return { ...DEFAULTS }
  return { ...DEFAULTS, ...partial }
}

export function mapSettings(map: Record<string, string>): StoreSettings {
  return {
    rate_bs: parseSettingNumber(map.rate_bs, DEFAULTS.rate_bs),
    auto_bcv_rate: (map.auto_bcv_rate ?? 'true').toLowerCase() !== 'false',
    rate_bs_updated_at: map.rate_bs_updated_at ?? DEFAULTS.rate_bs_updated_at,
    delivery_fee_usd: parseSettingNumber(
      map.delivery_fee_usd,
      DEFAULTS.delivery_fee_usd
    ),
    min_order_usd: parseSettingNumber(map.min_order_usd, DEFAULTS.min_order_usd),
    store_closed: (map.store_closed ?? 'false').toLowerCase() === 'true',
    whatsapp: map.whatsapp ?? DEFAULTS.whatsapp,
    open_hours: map.open_hours ?? DEFAULTS.open_hours,
    auto_whatsapp_notify:
      (map.auto_whatsapp_notify ?? 'true').toLowerCase() !== 'false',
    pickup_address: map.pickup_address ?? DEFAULTS.pickup_address,
    notify_customer_on_status:
      (map.notify_customer_on_status ?? 'true').toLowerCase() !== 'false',
    instagram: map.instagram ?? DEFAULTS.instagram,
    tiktok: map.tiktok ?? DEFAULTS.tiktok,
    facebook: map.facebook ?? DEFAULTS.facebook,
    promo_enabled: (map.promo_enabled ?? 'false').toLowerCase() === 'true',
    promo_sponsor: map.promo_sponsor ?? DEFAULTS.promo_sponsor,
    promo_title: map.promo_title ?? DEFAULTS.promo_title,
    promo_subtitle: map.promo_subtitle ?? DEFAULTS.promo_subtitle,
    promo_link: map.promo_link ?? DEFAULTS.promo_link,
    promo_image_url: map.promo_image_url ?? DEFAULTS.promo_image_url,
    promo_cta: map.promo_cta ?? DEFAULTS.promo_cta,
    loyalty_enabled: (map.loyalty_enabled ?? 'false').toLowerCase() === 'true',
    loyalty_min_subtotal_usd: parseSettingNumber(
      map.loyalty_min_subtotal_usd,
      DEFAULTS.loyalty_min_subtotal_usd
    ),
    loyalty_stars_required: parseSettingNumber(
      map.loyalty_stars_required,
      DEFAULTS.loyalty_stars_required
    ),
    loyalty_reward_product_id:
      map.loyalty_reward_product_id ?? DEFAULTS.loyalty_reward_product_id,
  }
}

export function mapSettingsToAdminForm(map: Record<string, string>): AdminSettingsForm {
  const settings = mapSettings(map)
  return {
    whatsapp: settings.whatsapp,
    rate_bs: map.rate_bs ?? settings.rate_bs.toFixed(4),
    auto_bcv_rate: settings.auto_bcv_rate,
    rate_bs_updated_at: settings.rate_bs_updated_at,
    delivery_fee_usd: map.delivery_fee_usd ?? settings.delivery_fee_usd.toFixed(2),
    min_order_usd: map.min_order_usd ?? settings.min_order_usd.toFixed(2),
    open_hours: settings.open_hours,
    pickup_address: settings.pickup_address,
    store_closed: settings.store_closed,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
    facebook: settings.facebook,
  }
}

export async function fetchSettingsMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error || !data) return {}
  return Object.fromEntries(data.map((row) => [row.key, row.value])) as Record<
    string,
    string
  >
}

export function buildBcvRateUpsertRows(rate: number, updatedAt: string) {
  const now = new Date().toISOString()
  return [
    { key: 'rate_bs', value: rate.toFixed(4), updated_at: now },
    { key: 'rate_bs_updated_at', value: updatedAt, updated_at: now },
  ]
}

export async function fetchLiveBcvRate(
  timeoutMs = 4000
): Promise<BcvRateResult | null> {
  if (typeof window === 'undefined') return null

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch('/api/bcv-rate', {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) return null
    return (await res.json()) as BcvRateResult
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

async function applyLiveBcvRate(settings: StoreSettings): Promise<StoreSettings> {
  if (!settings.auto_bcv_rate) return settings

  const live = await fetchLiveBcvRate()
  if (!live) return settings

  return {
    ...settings,
    rate_bs: live.rate,
    rate_bs_updated_at: live.updatedAt || settings.rate_bs_updated_at,
  }
}

export async function fetchStoreSettingsBase(): Promise<StoreSettings> {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error || !data) return DEFAULTS

  const map = Object.fromEntries(data.map((row) => [row.key, row.value])) as Record<
    string,
    string
  >

  return mapSettings(map)
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  return applyLiveBcvRate(await fetchStoreSettingsBase())
}

export async function persistBcvRate(rate: number, updatedAt: string) {
  const { error } = await supabase
    .from('settings')
    .upsert(buildBcvRateUpsertRows(rate, updatedAt))

  if (error) throw error
}
