'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTableSession } from '@/lib/table-session'
import { useCart } from '@/lib/cart'
import type { RestaurantTable } from '@/lib/types'
import { LoadingMessage, PrimaryButton, SectionTitle } from '@/components/ui'

export default function TableQrPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const router = useRouter()
  const { setTable } = useTableSession()
  const { setFulfillment } = useCart()
  const [error, setError] = useState<string | null>(null)
  const [table, setLocalTable] = useState<RestaurantTable | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setError(null)
      const { data, error: qErr } = await supabase
        .from('tables')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle()

      if (!active) return
      if (qErr) {
        setError(qErr.message)
        return
      }
      if (!data) {
        setError('Mesa no encontrada o inactiva. Pide ayuda al personal.')
        return
      }

      const row = data as RestaurantTable
      setLocalTable(row)
      setTable({
        id: row.id,
        number: row.number,
        code: row.code,
        label: row.label,
      })
      setFulfillment('dine_in')
      router.replace('/?dine_in=1')
    }
    load()
    return () => {
      active = false
    }
  }, [code, router, setFulfillment, setTable])

  if (error) {
    return (
      <div className="gp-fade-in space-y-4">
        <SectionTitle title="QR de mesa" subtitle="No pudimos abrir la sesión" />
        <div className="rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
        </div>
        <PrimaryButton onClick={() => router.replace('/')}>
          Ir al menú
        </PrimaryButton>
      </div>
    )
  }

  return (
    <div className="gp-fade-in space-y-3 py-10 text-center">
      <LoadingMessage>
        {table
          ? `Abriendo Dinner In · Mesa ${table.number}…`
          : 'Escaneando mesa…'}
      </LoadingMessage>
    </div>
  )
}
