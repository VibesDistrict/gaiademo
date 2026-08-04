import { Suspense } from 'react'
import AuthPageClient from './AuthPageClient'

export default function AuthPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[var(--gp-muted)]">Cargando...</p>}
    >
      <AuthPageClient />
    </Suspense>
  )
}
