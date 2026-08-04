'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  createCustomerAddress,
  fetchCustomerAddresses,
  formatCustomerAddress,
} from '@/lib/addresses'
import type { CustomerAddress } from '@/lib/types'
import {
  Field,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'

type Mode = 'saved' | 'custom'

function findMatchingAddress(rows: CustomerAddress[], value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  return (
    rows.find((row) => formatCustomerAddress(row) === trimmed) ??
    rows.find((row) => row.address.trim() === trimmed) ??
    null
  )
}

export function DeliveryAddressPicker({
  userId,
  value,
  onChange,
  ready,
}: {
  userId: string | null
  value: string
  onChange: (address: string) => void
  ready?: boolean
}) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(!!userId)
  const [mode, setMode] = useState<Mode>('custom')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveLabel, setSaveLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const load = useCallback(async () => {
    if (!userId) {
      setAddresses([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const rows = await fetchCustomerAddresses(userId)
      setAddresses(rows)
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!ready || loading || initialized) return

    if (addresses.length === 0) {
      setMode('custom')
      setSelectedId(null)
      setInitialized(true)
      return
    }

    const match = findMatchingAddress(addresses, value)
    if (match) {
      setMode('saved')
      setSelectedId(match.id)
      setInitialized(true)
      return
    }

    if (value.trim()) {
      setMode('custom')
      setSelectedId(null)
      setInitialized(true)
      return
    }

    const defaultRow =
      addresses.find((row) => row.is_default) ?? addresses[0]
    if (defaultRow) {
      setMode('saved')
      setSelectedId(defaultRow.id)
      onChange(formatCustomerAddress(defaultRow))
    }
    setInitialized(true)
  }, [ready, loading, initialized, addresses, value, onChange])

  function selectSaved(row: CustomerAddress) {
    setMode('saved')
    setSelectedId(row.id)
    onChange(formatCustomerAddress(row))
    setSaveMessage(null)
  }

  function switchToCustom() {
    setMode('custom')
    setSelectedId(null)
    setSaveMessage(null)
  }

  async function saveCurrentAddress() {
    if (!userId || !value.trim()) return
    setSaving(true)
    setSaveMessage(null)
    try {
      const row = await createCustomerAddress({
        userId,
        label: saveLabel.trim() || 'Dirección',
        address: value.trim(),
        isDefault: addresses.length === 0,
      })
      setAddresses((prev) => [...prev, row])
      setMode('saved')
      setSelectedId(row.id)
      setSaveLabel('')
      setSaveMessage('Dirección guardada en tu cuenta.')
    } catch {
      setSaveMessage('No se pudo guardar. Inténtalo desde Mi cuenta.')
    } finally {
      setSaving(false)
    }
  }

  if (!userId) {
    return (
      <Field label="Dirección de entrega">
        <textarea
          className={`${inputClassName} min-h-24`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Urbanización, calle, punto de referencia..."
        />
        <p className="text-xs text-[var(--gp-muted)]">
          <Link href="/auth?next=/cart" className="font-semibold text-[var(--gp-red)]">
            Inicia sesión
          </Link>{' '}
          para guardar direcciones y reutilizarlas.
        </p>
      </Field>
    )
  }

  if (loading || !ready) {
    return (
      <Field label="Dirección de entrega">
        <p className="text-sm text-[var(--gp-muted)]">Cargando direcciones...</p>
      </Field>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-muted)]">
          Dirección de entrega
        </p>
        <Link href="/cuenta" className="text-xs font-semibold text-[var(--gp-red)]">
          Administrar
        </Link>
      </div>

      {addresses.length > 0 ? (
        <div className="space-y-2">
          {addresses.map((row) => {
            const selected = mode === 'saved' && selectedId === row.id
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => selectSaved(row)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                  selected
                    ? 'bg-[var(--gp-red)] text-white shadow-md'
                    : 'bg-white text-[var(--gp-ink)]'
                }`}
              >
                <p className="font-bold">
                  {row.label.trim() || 'Dirección'}
                  {row.is_default ? (
                    <span
                      className={`ml-2 text-[10px] font-bold uppercase tracking-wide ${
                        selected ? 'text-white/80' : 'text-[var(--gp-red)]'
                      }`}
                    >
                      · Predeterminada
                    </span>
                  ) : null}
                </p>
                <p
                  className={`mt-1 whitespace-pre-wrap ${
                    selected ? 'text-white/90' : 'text-[var(--gp-muted)]'
                  }`}
                >
                  {row.address}
                </p>
              </button>
            )
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={switchToCustom}
        className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
          mode === 'custom'
            ? 'bg-[var(--gp-yellow)]/30 ring-2 ring-[var(--gp-yellow)]'
            : 'bg-white text-[var(--gp-ink)]'
        }`}
      >
        {addresses.length ? 'Usar otra dirección' : 'Escribir dirección'}
      </button>

      {mode === 'custom' ? (
        <div className="space-y-3">
          <textarea
            className={`${inputClassName} min-h-24`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Urbanización, calle, punto de referencia..."
          />
          {value.trim() ? (
            <div className="space-y-2 rounded-xl bg-[var(--gp-cream)]/70 p-3">
              <p className="text-xs font-semibold text-[var(--gp-muted)]">
                Guardar en mi cuenta para próximos pedidos
              </p>
              <input
                className={inputClassName}
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Nombre (Casa, Trabajo...)"
              />
              <SecondaryButton
                type="button"
                className="w-full py-2 text-xs"
                disabled={saving}
                onClick={saveCurrentAddress}
              >
                {saving ? 'Guardando...' : 'Guardar dirección'}
              </SecondaryButton>
              {saveMessage ? (
                <p className="text-xs text-green-700">{saveMessage}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
