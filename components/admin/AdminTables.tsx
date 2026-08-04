'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RestaurantTable } from '@/lib/types'
import { CopyButton } from '@/components/brand/CopyButton'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'
import { AdminCollapsibleSection } from '@/components/admin/AdminCollapsibleSection'

function tableUrl(code: string) {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return `${base.replace(/\/$/, '')}/m/${code}`
}

export function AdminTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [number, setNumber] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true })
    if (qErr) {
      setError(qErr.message)
      setTables([])
    } else {
      setTables((data as RestaurantTable[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const nextNumber = useMemo(() => {
    if (!tables.length) return 1
    return Math.max(...tables.map((t) => t.number)) + 1
  }, [tables])

  async function addTable(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(number || nextNumber)
    if (!Number.isFinite(n) || n <= 0) {
      setError('Número de mesa inválido')
      return
    }
    setSaving(true)
    setError(null)
    const code = `mesa-${n}`
    const { error: insertErr } = await supabase.from('tables').insert({
      number: n,
      code,
      label: label.trim() || `Mesa ${n}`,
      active: true,
    })
    setSaving(false)
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    setNumber('')
    setLabel('')
    await load()
  }

  async function toggleActive(table: RestaurantTable) {
    const { error: upErr } = await supabase
      .from('tables')
      .update({ active: !table.active })
      .eq('id', table.id)
    if (upErr) {
      setError(upErr.message)
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <AdminCollapsibleSection
        title="Mesas Dinner In"
        subtitle="QR por mesa · el cliente escanea y pide"
        defaultOpen
      >
        <form onSubmit={addTable} className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Número">
            <input
              className={inputClassName}
              type="number"
              min={1}
              placeholder={String(nextNumber)}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </Field>
          <Field label="Etiqueta">
            <input
              className={inputClassName}
              placeholder={`Mesa ${number || nextNumber}`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando…' : 'Agregar mesa'}
            </PrimaryButton>
          </div>
        </form>

        {error ? (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[var(--gp-muted)]">Cargando mesas…</p>
        ) : tables.length === 0 ? (
          <p className="text-sm text-[var(--gp-muted)]">
            Aún no hay mesas. Agrega la primera o corre el seed SQL.
          </p>
        ) : (
          <div className="space-y-2">
            {tables.map((table) => {
              const url = tableUrl(table.code)
              return (
                <div
                  key={table.id}
                  className="flex flex-col gap-2 rounded-xl bg-[var(--gp-cream)] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-[var(--gp-ink)]">
                      Mesa {table.number}
                      {!table.active ? (
                        <span className="ml-2 text-xs font-semibold text-[var(--gp-muted)]">
                          (inactiva)
                        </span>
                      ) : null}
                    </p>
                    <p className="break-all text-xs text-[var(--gp-muted)]">
                      {url}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={url} label="Copiar link QR" />
                    <SecondaryButton
                      type="button"
                      onClick={() => toggleActive(table)}
                    >
                      {table.active ? 'Desactivar' : 'Activar'}
                    </SecondaryButton>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AdminCollapsibleSection>
    </div>
  )
}
