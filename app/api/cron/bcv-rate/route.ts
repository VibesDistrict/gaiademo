import { syncBcvRateToDatabase } from '@/lib/bcv-sync-server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncBcvRateToDatabase()

    if ('skipped' in result && result.skipped) {
      return Response.json(result)
    }

    return Response.json({
      ok: true,
      rate: result.rate,
      updatedAt: result.updatedAt,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al sincronizar tasa BCV'
    return Response.json({ error: message }, { status: 502 })
  }
}
