const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'

export type BcvRateResult = {
  rate: number
  source: string
  updatedAt: string
}

type DolarApiResponse = {
  promedio?: number | null
  venta?: number | null
  compra?: number | null
  fechaActualizacion?: string
  fuente?: string
}

export async function fetchBcvRateFromSource(options?: {
  fresh?: boolean
}): Promise<BcvRateResult> {
  const res = await fetch(BCV_API_URL, {
    headers: { Accept: 'application/json' },
    ...(options?.fresh
      ? { cache: 'no-store' as const }
      : { next: { revalidate: 3600 } }),
  })

  if (!res.ok) {
    throw new Error(`No se pudo obtener la tasa BCV (${res.status})`)
  }

  const data = (await res.json()) as DolarApiResponse
  const rate = Number(data.promedio ?? data.venta ?? data.compra)

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('La API del BCV devolvió una tasa inválida')
  }

  return {
    rate,
    source: data.fuente ?? 'bcv-oficial',
    updatedAt: data.fechaActualizacion ?? new Date().toISOString(),
  }
}

export function formatBcvUpdatedAt(iso: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
