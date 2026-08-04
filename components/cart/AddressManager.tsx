'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  createCustomerAddress,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  updateCustomerAddress,
} from '@/lib/addresses'
import type { CustomerAddress } from '@/lib/types'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'

type AddressForm = {
  label: string
  address: string
  isDefault: boolean
}

const emptyForm: AddressForm = {
  label: '',
  address: '',
  isDefault: false,
}

export function AddressManager({
  userId,
  collapsible = true,
}: {
  userId: string
  collapsible?: boolean
}) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchCustomerAddresses(userId)
      setAddresses(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las direcciones')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const defaultAddress = addresses.find((row) => row.is_default) ?? addresses[0]

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.address.trim()) {
      setError('Escribe la dirección completa.')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      if (editingId) {
        await updateCustomerAddress(editingId, {
          label: form.label,
          address: form.address,
          isDefault: form.isDefault,
        })
        setMessage('Dirección actualizada.')
      } else {
        await createCustomerAddress({
          userId,
          label: form.label,
          address: form.address,
          isDefault: form.isDefault || addresses.length === 0,
        })
        setMessage('Dirección guardada.')
      }
      resetForm()
      setExpanded(true)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la dirección')
    } finally {
      setBusy(false)
    }
  }

  async function onSetDefault(id: string) {
    setBusy(true)
    setError(null)
    try {
      await updateCustomerAddress(id, { isDefault: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar como predeterminada')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('¿Eliminar esta dirección?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteCustomerAddress(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la dirección')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(row: CustomerAddress) {
    setEditingId(row.id)
    setForm({
      label: row.label,
      address: row.address,
      isDefault: row.is_default,
    })
    setShowForm(true)
    setExpanded(true)
    setMessage(null)
    setError(null)
  }

  function startAdd() {
    resetForm()
    setShowForm(true)
    setExpanded(true)
  }

  const summary = loading
    ? 'Cargando...'
    : addresses.length === 0
      ? 'Sin direcciones guardadas'
      : defaultAddress
        ? `${addresses.length} guardada${addresses.length === 1 ? '' : 's'} · ${defaultAddress.label.trim() || 'Predeterminada'}`
        : `${addresses.length} guardada${addresses.length === 1 ? '' : 's'}`

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => (collapsible ? setExpanded((v) => !v) : undefined)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={collapsible ? expanded : true}
      >
        <div className="min-w-0">
          <p className="font-bold text-[var(--gp-ink)]">Mis direcciones</p>
          <p className="mt-0.5 truncate text-xs text-[var(--gp-muted)]">{summary}</p>
        </div>
        {collapsible ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 shrink-0 text-[var(--gp-muted)] transition ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5l5 5 5-5" />
          </svg>
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {(!collapsible || expanded) ? (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-black/5 px-4 pb-4 pt-3">
              {!loading && addresses.length > 0 ? (
                <ul className="space-y-2">
                  {addresses.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-black/5 bg-[var(--gp-cream)]/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold">
                          {row.label.trim() || 'Dirección'}
                          {row.is_default ? (
                            <span className="ml-2 rounded-full bg-[var(--gp-red)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--gp-red)]">
                              Default
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--gp-muted)]">
                          {row.address}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {!row.is_default ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onSetDefault(row.id)}
                            className="text-xs font-semibold text-[var(--gp-red)]"
                          >
                            Predeterminada
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(row)}
                          className="text-xs font-semibold text-[var(--gp-ink)]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDelete(row.id)}
                          className="text-xs font-semibold text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {!showForm ? (
                <SecondaryButton
                  type="button"
                  className="w-full px-3 py-2 text-xs"
                  onClick={startAdd}
                >
                  {addresses.length === 0 ? 'Agregar dirección' : 'Nueva dirección'}
                </SecondaryButton>
              ) : (
                <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-[var(--gp-cream)]/30 p-3">
                  <p className="text-sm font-bold">
                    {editingId ? 'Editar dirección' : 'Nueva dirección'}
                  </p>
                  <Field label="Nombre (opcional)">
                    <input
                      className={inputClassName}
                      value={form.label}
                      onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                      placeholder="Casa, Trabajo..."
                    />
                  </Field>
                  <Field label="Dirección">
                    <textarea
                      className={`${inputClassName} min-h-20`}
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Urbanización, calle, referencia..."
                      required
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isDefault: e.target.checked }))
                      }
                    />
                    Predeterminada
                  </label>

                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                  {message ? <p className="text-sm text-green-700">{message}</p> : null}

                  <div className="flex flex-col gap-2">
                    <PrimaryButton type="submit" className="w-full" disabled={busy}>
                      {busy ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                    </PrimaryButton>
                    <SecondaryButton
                      type="button"
                      className="w-full"
                      disabled={busy}
                      onClick={resetForm}
                    >
                      Cancelar
                    </SecondaryButton>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
