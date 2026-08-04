'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  playOrderAlertSound,
  requestNotificationPermission,
  unlockAlertAudio,
} from '@/lib/notify'
import {
  ADMIN_ALERT_SOUNDS,
  getAdminAlertPreferences,
  onAdminAlertPreferencesChange,
  saveAdminAlertPreferences,
  type AdminAlertSound,
} from '@/lib/admin-alert-preferences'
import {
  fetchLiveBcvRate,
  mapSettingsToAdminForm,
  persistBcvRate,
  type AdminSettingsForm,
} from '@/lib/settings'
import { formatBcvUpdatedAt } from '@/lib/bcv-rate'
import { AdminCollapsibleSection } from '@/components/admin/AdminCollapsibleSection'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClassName,
} from '@/components/ui'

const defaults: AdminSettingsForm = {
  whatsapp: '',
  rate_bs: '36.50',
  auto_bcv_rate: true,
  rate_bs_updated_at: '',
  delivery_fee_usd: '2.00',
  min_order_usd: '5.00',
  open_hours: '',
  pickup_address: '',
  store_closed: false,
  instagram: '',
  tiktok: '',
  facebook: '',
}

export function AdminSettings({
  onStoreClosedChange,
}: {
  onStoreClosedChange?: (closed: boolean) => void
}) {
  const [form, setForm] = useState<AdminSettingsForm>(defaults)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncingRate, setSyncingRate] = useState(false)
  const [notifyPermission, setNotifyPermission] = useState<
    'default' | 'granted' | 'denied' | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported'
    }
    return Notification.permission
  })
  const [alertPrefs, setAlertPrefs] = useState(getAdminAlertPreferences)

  useEffect(() => {
    return onAdminAlertPreferencesChange(() => {
      setAlertPrefs(getAdminAlertPreferences())
    })
  }, [])

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
        const nextForm = mapSettingsToAdminForm(map)
        setForm(nextForm)

        if (nextForm.auto_bcv_rate) {
          fetchLiveBcvRate().then((live) => {
            if (!active || !live) return
            setForm((f) => ({
              ...f,
              rate_bs: live.rate.toFixed(4),
              rate_bs_updated_at: live.updatedAt,
            }))
          })
        }
      })
    return () => {
      active = false
    }
  }, [])

  async function syncBcvRateNow() {
    setSyncingRate(true)
    setError(null)
    setMessage(null)
    try {
      const live = await fetchLiveBcvRate()
      if (!live) {
        setError('No se pudo obtener la tasa BCV. Intenta más tarde.')
        return
      }
      await persistBcvRate(live.rate, live.updatedAt)
      setForm((f) => ({
        ...f,
        rate_bs: live.rate.toFixed(4),
        rate_bs_updated_at: live.updatedAt,
      }))
      setMessage(`Tasa BCV actualizada: Bs. ${live.rate.toFixed(2)} por USD`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar tasa BCV')
    } finally {
      setSyncingRate(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)

    let rateBs = form.rate_bs.trim()
    let rateUpdatedAt = form.rate_bs_updated_at.trim()

    if (form.auto_bcv_rate) {
      const live = await fetchLiveBcvRate()
      if (live) {
        rateBs = live.rate.toFixed(4)
        rateUpdatedAt = live.updatedAt
      }
    }

    const rows = [
      { key: 'whatsapp', value: form.whatsapp.trim() },
      { key: 'rate_bs', value: rateBs },
      { key: 'auto_bcv_rate', value: form.auto_bcv_rate ? 'true' : 'false' },
      { key: 'rate_bs_updated_at', value: rateUpdatedAt },
      { key: 'delivery_fee_usd', value: form.delivery_fee_usd.trim() },
      { key: 'min_order_usd', value: form.min_order_usd.trim() },
      { key: 'open_hours', value: form.open_hours.trim() },
      { key: 'pickup_address', value: form.pickup_address.trim() },
      { key: 'store_closed', value: form.store_closed ? 'true' : 'false' },
      { key: 'instagram', value: form.instagram.trim() },
      { key: 'tiktok', value: form.tiktok.trim() },
      { key: 'facebook', value: form.facebook.trim() },
    ].map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }))

    const { error: err } = await supabase.from('settings').upsert(rows)
    if (err) setError(err.message)
    else {
      setForm((f) => ({
        ...f,
        rate_bs: rateBs,
        rate_bs_updated_at: rateUpdatedAt,
      }))
      setMessage('Ajustes guardados.')
      onStoreClosedChange?.(form.store_closed)
    }
    setBusy(false)
  }

  async function enableBrowserNotifications() {
    const result = await requestNotificationPermission()
    setNotifyPermission(result === 'unsupported' ? 'unsupported' : result)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <AdminCollapsibleSection
        title="Contacto y WhatsApp"
        subtitle="Número para checkout y contacto del negocio"
        defaultOpen
      >
        <Field label="WhatsApp del negocio (código país, sin +)">
          <input
            className={inputClassName}
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            placeholder="584121234567"
          />
          <p className="text-xs text-[var(--gp-muted)]">
            Número para contacto y para que el cliente te escriba desde checkout.
          </p>
        </Field>
      </AdminCollapsibleSection>

      <AdminCollapsibleSection
        title="Avisos del panel"
        subtitle="Sonido y notificaciones cuando llega un pedido"
        badge={
          notifyPermission === 'granted' ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
              Activas
            </span>
          ) : null
        }
      >
        <p className="text-xs text-[var(--gp-muted)]">
          Con el panel abierto escucharás un sonido y verás un aviso en pantalla
          al instante. El sonido se guarda en este dispositivo.
        </p>

        <Field label="Sonido de nuevo pedido">
          <select
            className={inputClassName}
            value={alertPrefs.sound}
            onChange={(e) => {
              const sound = e.target.value as AdminAlertSound
              saveAdminAlertPreferences({ sound })
              setAlertPrefs(getAdminAlertPreferences())
            }}
          >
            {Object.entries(ADMIN_ALERT_SOUNDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Volumen (${Math.round(alertPrefs.volume * 100)}%)`}>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={Math.round(alertPrefs.volume * 100)}
            onChange={(e) => {
              const volume = Number(e.target.value) / 100
              saveAdminAlertPreferences({ volume })
              setAlertPrefs(getAdminAlertPreferences())
            }}
            className="w-full accent-[var(--gp-red)]"
          />
        </Field>

        <SecondaryButton
          type="button"
          className="w-full px-3 py-2 text-xs"
          onClick={() => {
            unlockAlertAudio()
            playOrderAlertSound()
          }}
        >
          Probar sonido de alerta
        </SecondaryButton>

        {notifyPermission === 'granted' ? (
          <p className="text-xs font-semibold text-green-700">
            Notificaciones del navegador activas
          </p>
        ) : notifyPermission === 'denied' ? (
          <p className="text-xs text-red-600">
            Notificaciones bloqueadas en el navegador. Actívalas en ajustes del
            sitio.
          </p>
        ) : notifyPermission === 'unsupported' ? (
          <p className="text-xs text-[var(--gp-muted)]">
            Este navegador no soporta notificaciones.
          </p>
        ) : (
          <SecondaryButton
            type="button"
            className="w-full px-3 py-2 text-xs"
            onClick={enableBrowserNotifications}
          >
            Activar notificaciones del navegador
          </SecondaryButton>
        )}
      </AdminCollapsibleSection>

      <AdminCollapsibleSection
        title="Tasa BCV"
        subtitle="Bs por 1 USD en menú, carrito y checkout"
        badge={
          form.auto_bcv_rate ? (
            <span className="rounded-full bg-[var(--gp-yellow)]/35 px-2 py-0.5 text-[10px] font-bold text-[var(--gp-ink)]">
              Auto
            </span>
          ) : null
        }
      >
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.auto_bcv_rate}
            onChange={(e) =>
              setForm((f) => ({ ...f, auto_bcv_rate: e.target.checked }))
            }
          />
          Actualizar tasa automáticamente desde el BCV
        </label>

        <Field label={form.auto_bcv_rate ? 'Tasa actual (BCV)' : 'Tasa manual'}>
          <input
            className={inputClassName}
            value={form.rate_bs}
            onChange={(e) =>
              setForm((f) => ({ ...f, rate_bs: e.target.value }))
            }
            disabled={form.auto_bcv_rate}
            readOnly={form.auto_bcv_rate}
          />
        </Field>

        {form.auto_bcv_rate && form.rate_bs_updated_at ? (
          <p className="text-xs text-[var(--gp-muted)]">
            Última actualización BCV:{' '}
            {formatBcvUpdatedAt(form.rate_bs_updated_at)}
          </p>
        ) : null}

        {form.auto_bcv_rate ? (
          <SecondaryButton
            type="button"
            className="w-full px-3 py-2 text-xs"
            disabled={syncingRate}
            onClick={syncBcvRateNow}
          >
            {syncingRate ? 'Consultando BCV...' : 'Actualizar tasa ahora'}
          </SecondaryButton>
        ) : null}
      </AdminCollapsibleSection>

      <AdminCollapsibleSection
        title="Pedidos y delivery"
        subtitle="Mínimos, horario, dirección y estado de la tienda"
        badge={
          form.store_closed ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
              Cerrada
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
              Abierta
            </span>
          )
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fee delivery USD">
            <input
              className={inputClassName}
              value={form.delivery_fee_usd}
              onChange={(e) =>
                setForm((f) => ({ ...f, delivery_fee_usd: e.target.value }))
              }
            />
          </Field>
          <Field label="Pedido mínimo USD">
            <input
              className={inputClassName}
              value={form.min_order_usd}
              onChange={(e) =>
                setForm((f) => ({ ...f, min_order_usd: e.target.value }))
              }
            />
          </Field>
        </div>
        <Field label="Horario">
          <input
            className={inputClassName}
            value={form.open_hours}
            onChange={(e) =>
              setForm((f) => ({ ...f, open_hours: e.target.value }))
            }
            placeholder="Martes a Domingo 4:00pm - 10:00pm"
          />
        </Field>
        <Field label="Dirección de Gaia Pasta (origen para Yummy)">
          <textarea
            className={`${inputClassName} min-h-20`}
            value={form.pickup_address}
            onChange={(e) =>
              setForm((f) => ({ ...f, pickup_address: e.target.value }))
            }
            placeholder="Urbanización, calle, referencia del local..."
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.store_closed}
            onChange={(e) =>
              setForm((f) => ({ ...f, store_closed: e.target.checked }))
            }
          />
          Tienda cerrada (no acepta pedidos)
        </label>
      </AdminCollapsibleSection>

      <AdminCollapsibleSection
        title="Redes sociales"
        subtitle="Aparecen en Contacto y el footer"
      >
        <Field label="Instagram">
          <input
            className={inputClassName}
            value={form.instagram}
            onChange={(e) =>
              setForm((f) => ({ ...f, instagram: e.target.value }))
            }
            placeholder="@gaiapasta o https://instagram.com/..."
          />
        </Field>
        <Field label="TikTok">
          <input
            className={inputClassName}
            value={form.tiktok}
            onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
            placeholder="@gaiapasta"
          />
        </Field>
        <Field label="Facebook">
          <input
            className={inputClassName}
            value={form.facebook}
            onChange={(e) =>
              setForm((f) => ({ ...f, facebook: e.target.value }))
            }
            placeholder="Gaia Pasta o enlace de la página"
          />
        </Field>
      </AdminCollapsibleSection>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <PrimaryButton type="submit" className="w-full" disabled={busy}>
        {busy ? 'Guardando...' : 'Guardar ajustes'}
      </PrimaryButton>
    </form>
  )
}
