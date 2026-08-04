'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { mapSettings } from '@/lib/settings'
import {
  Field,
  PrimaryButton,
  inputClassName,
} from '@/components/ui'
import { AdminCollapsibleSection } from '@/components/admin/AdminCollapsibleSection'

type PromoForm = {
  promo_enabled: boolean
  promo_sponsor: string
  promo_title: string
  promo_subtitle: string
  promo_link: string
  promo_image_url: string
  promo_cta: string
}

const defaults: PromoForm = {
  promo_enabled: false,
  promo_sponsor: '',
  promo_title: '',
  promo_subtitle: '',
  promo_link: '',
  promo_image_url: '',
  promo_cta: 'Ver más',
}

export function AdminPromo() {
  const [form, setForm] = useState<PromoForm>(defaults)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('settings')
      .select('key, value')
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) {
          setError(err.message)
          return
        }
        const map = Object.fromEntries(
          (data ?? []).map((row) => [row.key, row.value])
        ) as Record<string, string>
        const settings = mapSettings(map)
        setForm({
          promo_enabled: settings.promo_enabled,
          promo_sponsor: settings.promo_sponsor,
          promo_title: settings.promo_title,
          promo_subtitle: settings.promo_subtitle,
          promo_link: settings.promo_link,
          promo_image_url: settings.promo_image_url,
          promo_cta: settings.promo_cta || defaults.promo_cta,
        })
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
      { key: 'promo_enabled', value: form.promo_enabled ? 'true' : 'false' },
      { key: 'promo_sponsor', value: form.promo_sponsor.trim() },
      { key: 'promo_title', value: form.promo_title.trim() },
      { key: 'promo_subtitle', value: form.promo_subtitle.trim() },
      { key: 'promo_link', value: form.promo_link.trim() },
      { key: 'promo_image_url', value: form.promo_image_url.trim() },
      { key: 'promo_cta', value: form.promo_cta.trim() || 'Ver más' },
    ].map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }))

    const { error: err } = await supabase.from('settings').upsert(rows)
    if (err) setError(err.message)
    else setMessage('Promo guardada.')
    setBusy(false)
  }

  return (
    <AdminCollapsibleSection
      title="Promo / patrocinador"
      subtitle="Banner nativo debajo del hero en el menú"
      badge={
        form.promo_enabled ? (
          <span className="rounded-full bg-[var(--gp-yellow)]/35 px-2 py-0.5 text-[10px] font-bold text-[var(--gp-ink)]">
            Visible
          </span>
        ) : null
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.promo_enabled}
          onChange={(e) =>
            setForm((f) => ({ ...f, promo_enabled: e.target.checked }))
          }
        />
        Mostrar promo en el menú
      </label>

      <Field label="Etiqueta (ej. Patrocinado por…)">
        <input
          className={inputClassName}
          value={form.promo_sponsor}
          onChange={(e) =>
            setForm((f) => ({ ...f, promo_sponsor: e.target.value }))
          }
          placeholder="Patrocinado por Bebidas XYZ"
        />
      </Field>

      <Field label="Título">
        <input
          className={inputClassName}
          value={form.promo_title}
          onChange={(e) =>
            setForm((f) => ({ ...f, promo_title: e.target.value }))
          }
          placeholder="2x1 en refrescos esta semana"
        />
      </Field>

      <Field label="Subtítulo (opcional)">
        <input
          className={inputClassName}
          value={form.promo_subtitle}
          onChange={(e) =>
            setForm((f) => ({ ...f, promo_subtitle: e.target.value }))
          }
          placeholder="Válido al pedir delivery"
        />
      </Field>

      <Field label="Enlace (opcional)">
        <input
          className={inputClassName}
          value={form.promo_link}
          onChange={(e) => setForm((f) => ({ ...f, promo_link: e.target.value }))}
          placeholder="https://instagram.com/..."
        />
      </Field>

      <Field label="Imagen URL (opcional)">
        <input
          className={inputClassName}
          value={form.promo_image_url}
          onChange={(e) =>
            setForm((f) => ({ ...f, promo_image_url: e.target.value }))
          }
          placeholder="https://..."
        />
      </Field>

      <Field label="Texto del botón">
        <input
          className={inputClassName}
          value={form.promo_cta}
          onChange={(e) => setForm((f) => ({ ...f, promo_cta: e.target.value }))}
          placeholder="Ver más"
        />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <PrimaryButton type="submit" className="w-full" disabled={busy}>
        {busy ? 'Guardando...' : 'Guardar promo'}
      </PrimaryButton>
      </form>
    </AdminCollapsibleSection>
  )
}
