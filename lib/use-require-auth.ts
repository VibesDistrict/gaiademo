'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export function useRequireAuth(nextPath: string) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`)
    }
  }, [loading, user, router, nextPath])

  return { user, profile, loading, ready: !loading && !!user }
}
