'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RestaurantTable } from '@/lib/types'
import { tableDeepLink } from '@/lib/table-url'
import { CopyButton } from '@/components/brand/CopyButton'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'
import { AdminCollapsibleSection } from '@/components/admin/AdminCollapsibleSection'
import {
  TableQrCard,
  downloadTableQrPng,
} from '@/components/admin/TableQrCard'

export function AdminTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [number, setNumber] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [busyCode, setBusyCode] = useState<string | null>(null)

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

  const previewTable = useMemo(
    () => tables.find((t) => t.code === previewCode) ?? null,
    [tables, previewCode]
  )

  const activeTables = useMemo(
    () => tables.filter((t) => t.active),
    [tables]
  )

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

  async function handleDownload(table: RestaurantTable) {
    setBusyCode(table.code)
    setError(null)
    try {
      await downloadTableQrPng(table)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el QR')
    } finally {
      setBusyCode(null)
    }
  }

  function handlePrintAll() {
    window.print()
  }

  return (
    <div className="space-y-4">
      <AdminCollapsibleSection
        title="Mesas Dinner In"
        subtitle="El cliente escanea el QR → abre la app en esa mesa"
        defaultOpen
      >
        <div className="mb-4 rounded-xl border border-[var(--gp-border)] bg-white p-3 text-sm text-[var(--gp-ink)]">
          <p className="font-semibold">Flujo en salón</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[var(--gp-muted)]">
            <li>Imprimes o descargas el QR de cada mesa.</li>
            <li>El cliente abre la cámara y escanea.</li>
            <li>
              Se abre Gaia Pasta en Dinner In con esa mesa lista para pedir.
            </li>
          </ol>
        </div>

        <form
          onSubmit={addTable}
          className="mb-4 grid gap-3 print:hidden sm:grid-cols-3"
        >
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
          <p className="mb-3 text-sm text-red-600 print:hidden">{error}</p>
        ) : null}

        {!loading && activeTables.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2 print:hidden">
            <PrimaryButton type="button" onClick={handlePrintAll}>
              Imprimir todos los QR
            </PrimaryButton>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-[var(--gp-muted)] print:hidden">
            Cargando mesas…
          </p>
        ) : tables.length === 0 ? (
          <p className="text-sm text-[var(--gp-muted)] print:hidden">
            Aún no hay mesas. Agrega la primera o corre el seed SQL.
          </p>
        ) : (
          <div className="space-y-2 print:hidden">
            {tables.map((table) => {
              const url = tableDeepLink(table.code)
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
                    <SecondaryButton
                      type="button"
                      onClick={() =>
                        setPreviewCode(
                          previewCode === table.code ? null : table.code
                        )
                      }
                    >
                      {previewCode === table.code ? 'Ocultar QR' : 'Ver QR'}
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      disabled={busyCode === table.code}
                      onClick={() => void handleDownload(table)}
                    >
                      {busyCode === table.code ? 'Descargando…' : 'Descargar PNG'}
                    </SecondaryButton>
                    <CopyButton text={url} label="Copiar link" />
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

        {previewTable ? (
          <div className="mt-4 flex justify-center print:hidden">
            <TableQrCard table={previewTable} />
          </div>
        ) : null}

        {/* Hoja imprimible: solo mesas activas */}
        <div className="qr-print-sheet mt-6 hidden print:block">
          <div className="grid grid-cols-2 gap-4">
            {activeTables.map((table) => (
              <TableQrCard key={table.id} table={table} size={200} />
            ))}
          </div>
        </div>
      </AdminCollapsibleSection>
    </div>
  )
}
