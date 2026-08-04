'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRequireAuth } from '@/lib/use-require-auth'
import { Field, LoadingMessage, PrimaryButton, SectionTitle, inputClassName } from '@/components/ui'

export default function SugerenciasPage() {
  const { user, profile, loading } = useRequireAuth('/sugerencias')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading || !user) {
    return <LoadingMessage />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const text = message.trim()
    if (text.length < 5) {
      setError('Escribe al menos unas palabras.')
      return
    }

    setBusy(true)
    setError(null)

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user.id,
      type: 'suggestion',
      message: text,
      customer_name: profile?.full_name?.trim() || 'Cliente',
    })

    if (insertError) {
      setError(insertError.message)
      setBusy(false)
      return
    }

    setMessage('')
    setSuccess(true)
    setBusy(false)
    window.setTimeout(() => setSuccess(false), 4000)
  }

  if (loading || !user) {
    return <p className="text-sm text-[var(--gp-muted)]">Cargando...</p>
  }

  return (
    <div className="gp-fade-in space-y-5">
      <SectionTitle
        title="Sugerencias"
        subtitle="Ideas, críticas o lo que quieras contarnos"
      />

      <div className="rounded-2xl bg-white p-4 text-sm text-[var(--gp-muted)] shadow-sm">
        ¿Extra de salsa? ¿Nuevo sabor? ¿Algo falló en tu pedido? Escríbenos con
        confianza — leemos todo.
      </div>

      {success ? (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          ¡Gracias! Recibimos tu sugerencia.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <Field label="Tu mensaje">
          <textarea
            className={`${inputClassName} min-h-32`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos qué te gustaría ver en Gaia Pasta..."
            maxLength={800}
            required
            disabled={busy}
          />
        </Field>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <PrimaryButton type="submit" className="w-full" disabled={busy}>
          {busy ? 'Enviando...' : 'Enviar sugerencia'}
        </PrimaryButton>
      </form>

      <p className="text-center text-xs text-[var(--gp-muted)]">
        También puedes dejar una review cuando completes un pedido.{' '}
        <Link href="/orders" className="font-semibold text-[var(--gp-red)]">
          Mis pedidos
        </Link>
      </p>
    </div>
  )
}
