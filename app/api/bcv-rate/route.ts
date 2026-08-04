import { fetchFreshBcvRate, syncBcvRateToDatabase } from '@/lib/bcv-sync-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await fetchFreshBcvRate()

    void syncBcvRateToDatabase().catch(() => {
      // La respuesta al cliente no debe fallar si la persistencia falla.
    })

    return Response.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al consultar tasa BCV'
    return Response.json({ error: message }, { status: 502 })
  }
}
