const FALLBACK_SITE_URL = 'https://gaia-pasta-iota.vercel.app'

/**
 * Deep link absoluto para QR de mesa.
 * Prioriza NEXT_PUBLIC_SITE_URL (luego fallback de producción)
 * para que los QR impresos abran la app real, no localhost.
 */
export function tableDeepLink(code: string): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const base = envBase || FALLBACK_SITE_URL
  return `${base}/m/${encodeURIComponent(code)}`
}
