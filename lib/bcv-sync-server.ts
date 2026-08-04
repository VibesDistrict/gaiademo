import { fetchBcvRateFromSource, type BcvRateResult } from '@/lib/bcv-rate'
import { buildBcvRateUpsertRows } from '@/lib/settings'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

type SyncResult =
  | { ok: true; rate: number; updatedAt: string; persisted: boolean }
  | { skipped: true; reason: string; rate?: number; updatedAt?: string }

function parseStoredRate(value: string | undefined) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function syncBcvRateToDatabase(options?: {
  force?: boolean
}): Promise<SyncResult> {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return { skipped: true, reason: 'missing_service_role' }
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['auto_bcv_rate', 'rate_bs', 'rate_bs_updated_at'])

  if (settingsError) {
    throw new Error(settingsError.message)
  }

  const autoEnabled =
    (settingsRows?.find((row) => row.key === 'auto_bcv_rate')?.value ?? 'true') !==
    'false'

  if (!autoEnabled) {
    return { skipped: true, reason: 'auto_bcv_rate_disabled' }
  }

  const bcv = await fetchBcvRateFromSource({ fresh: true })
  const currentRate = parseStoredRate(
    settingsRows?.find((row) => row.key === 'rate_bs')?.value
  )
  const currentUpdatedAt =
    settingsRows?.find((row) => row.key === 'rate_bs_updated_at')?.value ?? ''

  const unchanged =
    !options?.force &&
    currentUpdatedAt === bcv.updatedAt &&
    Math.abs(currentRate - bcv.rate) < 0.0001

  if (unchanged) {
    return {
      skipped: true,
      reason: 'unchanged',
      rate: bcv.rate,
      updatedAt: bcv.updatedAt,
    }
  }

  const { error } = await supabase
    .from('settings')
    .upsert(buildBcvRateUpsertRows(bcv.rate, bcv.updatedAt))

  if (error) {
    throw new Error(error.message)
  }

  return {
    ok: true,
    rate: bcv.rate,
    updatedAt: bcv.updatedAt,
    persisted: true,
  }
}

export async function fetchFreshBcvRate(): Promise<BcvRateResult> {
  return fetchBcvRateFromSource({ fresh: true })
}
