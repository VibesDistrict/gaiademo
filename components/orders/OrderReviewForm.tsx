'use client'

import { FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { PrimaryButton } from '@/components/ui'
import { inputClassName } from '@/components/ui'
import { springSnappy } from '@/lib/motion'
import { hapticLight } from '@/lib/haptics'

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        return (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => {
              hapticLight()
              onChange(star)
            }}
            whileTap={{ scale: 0.85 }}
            animate={{ scale: filled ? 1.1 : 1 }}
            transition={springSnappy}
            className={`text-2xl disabled:opacity-50 ${
              filled ? 'text-[var(--gp-yellow)]' : 'text-black/15'
            }`}
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          >
            ★
          </motion.button>
        )
      })}
    </div>
  )
}

export function OrderReviewForm({
  orderId,
  userId,
  customerName,
  onSubmitted,
}: {
  orderId: string
  userId: string
  customerName: string
  onSubmitted?: (review: { rating: number; message: string }) => void
}) {
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      setError('Elige de 1 a 5 estrellas.')
      return
    }

    setBusy(true)
    setError(null)

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: userId,
      order_id: orderId,
      type: 'review',
      rating,
      message: message.trim(),
      customer_name: customerName.trim() || 'Cliente',
    })

    if (insertError) {
      setError(insertError.message)
      setBusy(false)
      return
    }

    setDone(true)
    setBusy(false)
    onSubmitted?.({ rating, message: message.trim() })
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springSnappy}
        className="rounded-2xl bg-[var(--gp-yellow)]/20 p-4 text-center text-sm"
      >
        <p className="font-bold text-[var(--gp-ink)]">¡Gracias por tu opinión!</p>
        <p className="mt-1 text-[var(--gp-muted)]">
          Nos ayuda mucho a seguir mejorando.
        </p>
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div>
        <p className="font-bold">¿Cómo estuvo tu pedido?</p>
        <p className="mt-1 text-xs text-[var(--gp-muted)]">
          Tu review nos ayuda a mejorar
        </p>
      </div>

      <StarPicker value={rating} onChange={setRating} disabled={busy} />

      <textarea
        className={`${inputClassName} min-h-20`}
        placeholder="Comentario opcional..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        disabled={busy}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <PrimaryButton type="submit" className="w-full" disabled={busy}>
        {busy ? 'Enviando...' : 'Enviar review'}
      </PrimaryButton>
    </form>
  )
}

export function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-[var(--gp-yellow)]" aria-label={`${rating} de 5`}>
      {'★'.repeat(rating)}
      <span className="text-black/15">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}
