'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PaymentAccount, PaymentMethod } from '@/lib/types'
import { PAYMENT_METHOD_LABELS } from '@/lib/types'
import {
  formatPaymentAccountText,
  formatPaymentFieldText,
  PAYMENT_DETAIL_LABELS,
} from '@/lib/copy-text'
import { CopyButton } from '@/components/brand/CopyButton'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'

const METHODS: PaymentMethod[] = ['pago_movil', 'tarjeta', 'binance']

const DETAIL_FIELDS: Record<PaymentMethod, string[]> = {
  pago_movil: ['bank', 'phone', 'cedula', 'name'],
  tarjeta: ['bank', 'account', 'rif', 'name'],
  binance: ['network', 'wallet', 'note'],
}

export function AdminPayments() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('pago_movil')
  const [label, setLabel] = useState('')
  const [details, setDetails] = useState<Record<string, string>>({})
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error: err } = await supabase
      .from('payment_accounts')
      .select('*')
      .order('created_at', { ascending: true })
    if (err) setError(err.message)
    else setAccounts((data as PaymentAccount[]) ?? [])
  }

  useEffect(() => {
    let activeLoad = true
    supabase
      .from('payment_accounts')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (!activeLoad) return
        if (err) setError(err.message)
        else setAccounts((data as PaymentAccount[]) ?? [])
      })
    return () => {
      activeLoad = false
    }
  }, [])

  function startCreate() {
    setEditingId('new')
    setMethod('pago_movil')
    setLabel(PAYMENT_METHOD_LABELS.pago_movil)
    setDetails({})
    setActive(true)
    setError(null)
  }

  function startEdit(account: PaymentAccount) {
    setEditingId(account.id)
    setMethod(account.method)
    setLabel(account.label)
    setDetails(account.details || {})
    setActive(account.active)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const payload = {
      method,
      label: label.trim() || PAYMENT_METHOD_LABELS[method],
      details,
      active,
    }

    try {
      if (editingId === 'new') {
        const { error: insertError } = await supabase
          .from('payment_accounts')
          .insert(payload)
        if (insertError) throw insertError
      } else if (editingId) {
        const { error: updateError } = await supabase
          .from('payment_accounts')
          .update(payload)
          .eq('id', editingId)
        if (updateError) throw updateError
      }
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function removeAccount(account: PaymentAccount) {
    if (!window.confirm(`¿Eliminar ${account.label}?`)) return
    setBusy(true)
    const { error: err } = await supabase
      .from('payment_accounts')
      .delete()
      .eq('id', account.id)
    if (err) setError(err.message)
    else await load()
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">Métodos de pago</p>
          <p className="text-xs text-[var(--gp-muted)]">
            Datos que ve el cliente al pagar
          </p>
        </div>
        <PrimaryButton
          type="button"
          className="px-3 py-2 text-xs"
          onClick={startCreate}
        >
          + Nuevo
        </PrimaryButton>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {editingId ? (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
        >
          <Field label="Método">
            <select
              className={inputClassName}
              value={method}
              onChange={(e) => {
                const next = e.target.value as PaymentMethod
                setMethod(next)
                setLabel(PAYMENT_METHOD_LABELS[next])
              }}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Etiqueta">
            <input
              className={inputClassName}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </Field>
          {DETAIL_FIELDS[method].map((key) => (
            <Field key={key} label={key}>
              <input
                className={inputClassName}
                value={details[key] || ''}
                onChange={(e) =>
                  setDetails((d) => ({ ...d, [key]: e.target.value }))
                }
              />
            </Field>
          ))}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Activo en checkout
          </label>
          <div className="flex gap-2">
            <PrimaryButton type="submit" className="flex-1" disabled={busy}>
              {busy ? 'Guardando...' : 'Guardar'}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              className="flex-1"
              onClick={() => setEditingId(null)}
            >
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{account.label}</p>
                <p className="text-xs text-[var(--gp-muted)]">
                  {PAYMENT_METHOD_LABELS[account.method]} ·{' '}
                  {account.active ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <CopyButton
                  compact
                  text={formatPaymentAccountText(account)}
                  label="Copiar datos"
                  copiedLabel="Copiado"
                />
                <button
                  type="button"
                  className="text-xs font-bold text-[var(--gp-red)]"
                  onClick={() => startEdit(account)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="text-xs font-bold text-red-500"
                  disabled={busy}
                  onClick={() => removeAccount(account)}
                >
                  Eliminar
                </button>
              </div>
            </div>
            <dl className="mt-2 space-y-1 text-xs text-[var(--gp-muted)]">
              {Object.entries(account.details || {}).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <dt className="capitalize">
                    {PAYMENT_DETAIL_LABELS[key] ?? key}
                  </dt>
                  <dd className="flex min-w-0 items-start gap-2 text-right">
                    <span className="font-semibold text-[var(--gp-ink)]">
                      {value}
                    </span>
                    {value?.trim() ? (
                      <CopyButton
                        compact
                        text={formatPaymentFieldText(account.method, key, value)}
                        label="Copiar"
                        copiedLabel="Listo"
                      />
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {accounts.length === 0 && !editingId ? (
          <p className="text-sm text-[var(--gp-muted)]">
            No hay métodos de pago. Crea pago móvil, transferencia o Binance.
          </p>
        ) : null}
      </div>
    </div>
  )
}
