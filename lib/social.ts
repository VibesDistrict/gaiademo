import type { StoreSettings } from '@/lib/types'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook'

export function normalizeSocialUrl(
  platform: SocialPlatform,
  value: string
): string | null {
  const raw = value.trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw

  const handle = raw.replace(/^@/, '')

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'tiktok':
      return `https://tiktok.com/@${handle}`
    case 'facebook':
      return handle.includes('.')
        ? `https://${handle}`
        : `https://facebook.com/${handle}`
    default:
      return null
  }
}

export function getStoreSocialLinks(settings: Pick<
  StoreSettings,
  'instagram' | 'tiktok' | 'facebook'
>) {
  return (
    [
      { id: 'instagram' as const, label: 'Instagram', value: settings.instagram },
      { id: 'tiktok' as const, label: 'TikTok', value: settings.tiktok },
      { id: 'facebook' as const, label: 'Facebook', value: settings.facebook },
    ]
      .map((item) => ({
        ...item,
        href: normalizeSocialUrl(item.id, item.value),
      }))
      .filter((item): item is typeof item & { href: string } => !!item.href)
  )
}

export function storeContactWhatsAppUrl(whatsapp: string) {
  return buildWhatsAppUrl(
    whatsapp,
    '¡Hola Gaia Pasta! Quiero hacer una consulta 🧀'
  )
}
