'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Feedback, FeedbackType } from '@/lib/types'
import { FEEDBACK_TYPE_LABELS } from '@/lib/types'
import { StarDisplay } from '@/components/orders/OrderReviewForm'
import { SecondaryButton } from '@/components/ui'

type Filter = 'all' | FeedbackType

export function AdminFeedback() {
  const [items, setItems] = useState<Feedback[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error: err } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setItems((data as Feedback[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [items, filter])

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read_by_admin).length,
    [items]
  )

  async function markRead(id: string, read: boolean) {
    setBusy(true)
    const { error: err } = await supabase
      .from('feedback')
      .update({ read_by_admin: read })
      .eq('id', id)
    if (err) setError(err.message)
    else await load()
    setBusy(false)
  }

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este mensaje?')) return
    setBusy(true)
    const { error: err } = await supabase.from('feedback').delete().eq('id', id)
    if (err) setError(err.message)
    else await load()
    setBusy(false)
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'review', label: 'Reviews' },
    { id: 'suggestion', label: 'Sugerencias' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="font-bold">Opiniones y sugerencias</p>
        <p className="text-xs text-[var(--gp-muted)]">
          {unreadCount > 0
            ? `${unreadCount} sin leer`
            : 'Reviews de pedidos y mensajes de clientes'}
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-[var(--gp-cream)] p-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${
              filter === item.id
                ? 'bg-white text-[var(--gp-red)] shadow-sm'
                : 'text-[var(--gp-muted)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--gp-muted)]">
            No hay mensajes todavía.
          </p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl p-4 shadow-sm ${
                item.read_by_admin ? 'bg-white' : 'bg-[var(--gp-yellow)]/15 ring-1 ring-[var(--gp-yellow)]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--gp-red)]">
                    {FEEDBACK_TYPE_LABELS[item.type]}
                    {!item.read_by_admin ? ' · Nuevo' : ''}
                  </p>
                  <p className="mt-1 font-bold">{item.customer_name}</p>
                  <p className="text-xs text-[var(--gp-muted)]">
                    {new Date(item.created_at).toLocaleString('es-VE')}
                  </p>
                </div>
                {item.type === 'review' && item.rating ? (
                  <StarDisplay rating={item.rating} />
                ) : null}
              </div>

              {item.order_id ? (
                <p className="mt-2 text-xs text-[var(--gp-muted)]">
                  Pedido #{item.order_id.slice(0, 8).toUpperCase()}
                </p>
              ) : null}

              {item.message ? (
                <p className="mt-2 text-sm whitespace-pre-wrap">{item.message}</p>
              ) : item.type === 'review' ? (
                <p className="mt-2 text-sm italic text-[var(--gp-muted)]">
                  Sin comentario adicional
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {!item.read_by_admin ? (
                  <SecondaryButton
                    type="button"
                    className="px-3 py-1.5 text-xs"
                    disabled={busy}
                    onClick={() => markRead(item.id, true)}
                  >
                    Marcar leído
                  </SecondaryButton>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-bold text-[var(--gp-muted)]"
                    disabled={busy}
                    onClick={() => markRead(item.id, false)}
                  >
                    Marcar no leído
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs font-bold text-red-500"
                  disabled={busy}
                  onClick={() => remove(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
