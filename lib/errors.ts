export function formatSupabaseError(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const e = err as {
      message?: string
      details?: string
      hint?: string
      code?: string
      statusCode?: string
      error?: string
    }
    const parts = [e.message, e.details, e.hint, e.code, e.error]
      .filter(Boolean)
      .map(String)
    if (parts.length) return parts.join(' · ')
  }
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err.trim()
  return fallback
}

export function stepError(step: string, err: unknown, fallback: string) {
  const detail = formatSupabaseError(err, fallback)
  return `${step}: ${detail}`
}
