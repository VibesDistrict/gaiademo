'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { mapSettings } from '@/lib/settings'
import type { Product } from '@/lib/types'
import {
  Field,
  PrimaryButton,
  inputClassName,
} from '@/components/ui'
import { AdminCollapsibleSection } from '@/components/admin/AdminCollapsibleSection'

type LoyaltyForm = {
  loyalty_enabled: boolean
  loyalty_min_subtotal_usd: string
  loyalty_stars_required: string
  loyalty_reward_product_id: string
}

const defaults: LoyaltyForm = {
  loyalty_enabled: false,
  loyalty_min_subtotal_usd: '20',
  loyalty_stars_required: '5',
  loyalty_reward_product_id: '',
}

export function AdminLoyalty() {
  const [form, setForm] = useState<LoyaltyForm>(defaults)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.from('settings').select('key, value'),
      supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    ]).then(([settingsRes, productsRes]) => {
      if (!active) return
      if (settingsRes.error) {
        setError(settingsRes.error.message)
        return
      }
      const map = Object.fromEntries(
        (settingsRes.data ?? []).map((row) => [row.key, row.value])
      ) as Record<string, string>
      const settings = mapSettings(map)
      setForm({
        loyalty_enabled: settings.loyalty_enabled,
        loyalty_min_subtotal_usd: String(settings.loyalty_min_subtotal_usd),
        loyalty_stars_required: String(settings.loyalty_stars_required),
        loyalty_reward_product_id: settings.loyalty_reward_product_id,
      })
      setProducts((productsRes.data as Product[]) ?? [])
    })

    return () => {
      active = false
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)

    const rows = [
      { key: 'loyalty_enabled', value: form.loyalty_enabled ? 'true' : 'false' },
      {
        key: 'loyalty_min_subtotal_usd',
        value: form.loyalty_min_subtotal_usd.trim() || '20',
      },
      {
        key: 'loyalty_stars_required',
        value: form.loyalty_stars_required.trim() || '5',
      },
      {
        key: 'loyalty_reward_product_id',
        value: form.loyalty_reward_product_id,
      },
    ].map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }))

    const { error: err } = await supabase.from('settings').upsert(rows)
    if (err) setError(err.message)
    else setMessage('Rewards guardados.')
    setBusy(false)
  }

  return (
    <AdminCollapsibleSection
      title="Gaia Pasta Rewards"
      subtitle="Estrellas por pedidos completados y regalo al acumular el objetivo"
      badge={
        form.loyalty_enabled ? (
          <span className="rounded-full bg-[var(--gp-yellow)]/35 px-2 py-0.5 text-[10px] font-bold text-[var(--gp-ink)]">
            Activo
          </span>
        ) : null
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.loyalty_enabled}
          onChange={(e) =>
            setForm((f) => ({ ...f, loyalty_enabled: e.target.checked }))
          }
        />
        Programa activo
      </label>

      <Field label="Subtotal mínimo por estrella (USD)">
        <input
          className={inputClassName}
          inputMode="decimal"
          value={form.loyalty_min_subtotal_usd}
          onChange={(e) =>
            setForm((f) => ({ ...f, loyalty_min_subtotal_usd: e.target.value }))
          }
        />
      </Field>

      <Field label="Estrellas para canjear">
        <input
          className={inputClassName}
          inputMode="numeric"
          value={form.loyalty_stars_required}
          onChange={(e) =>
            setForm((f) => ({ ...f, loyalty_stars_required: e.target.value }))
          }
        />
      </Field>

      <Field label="Producto regalo">
        <select
          className={inputClassName}
          value={form.loyalty_reward_product_id}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              loyalty_reward_product_id: e.target.value,
            }))
          }
        >
          <option value="">— Elige un producto —</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (${Number(product.price_usd).toFixed(2)})
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--gp-muted)]">
          El cliente lo recibe gratis al canjear sus estrellas en checkout.
        </p>
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <PrimaryButton type="submit" className="w-full" disabled={busy}>
        {busy ? 'Guardando...' : 'Guardar rewards'}
      </PrimaryButton>
      </form>
    </AdminCollapsibleSection>
  )
}
