'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  inputClassName,
} from '@/components/ui'

export default function AuthPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/orders'
  const { user, loading, refreshProfile } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace(next)
    }
  }, [loading, user, next, router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        await refreshProfile()
        router.replace(next)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })
      if (signUpError) throw signUpError

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
        })
      }

      if (data.session) {
        await refreshProfile()
        router.replace(next)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      await refreshProfile()
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo autenticar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gp-fade-in space-y-5">
      <SectionTitle
        title={mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
        subtitle="Guarda tus pedidos y paga más rápido"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-2xl py-2.5 text-sm font-bold ${
            mode === 'login'
              ? 'bg-[var(--gp-red)] text-white'
              : 'bg-white text-[var(--gp-ink)]'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`rounded-2xl py-2.5 text-sm font-bold ${
            mode === 'register'
              ? 'bg-[var(--gp-yellow)] text-[var(--gp-ink)]'
              : 'bg-white text-[var(--gp-ink)]'
          }`}
        >
          Registrarme
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        {mode === 'register' ? (
          <>
            <Field label="Nombre">
              <input
                className={inputClassName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input
                className={inputClassName}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0412..."
                required
              />
            </Field>
          </>
        ) : null}

        <Field label="Correo">
          <input
            type="email"
            className={inputClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            className={inputClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </Field>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <PrimaryButton type="submit" className="w-full" disabled={submitting}>
          {submitting
            ? 'Espera...'
            : mode === 'login'
              ? 'Entrar'
              : 'Crear cuenta'}
        </PrimaryButton>
      </form>

      <SecondaryButton
        type="button"
        className="w-full"
        onClick={() => router.push('/')}
      >
        Volver al menú
      </SecondaryButton>
    </div>
  )
}
