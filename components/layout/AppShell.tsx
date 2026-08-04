'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppBottomNav } from '@/components/layout/AppBottomNav'
import { SplashScreen } from '@/components/layout/SplashScreen'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { StoreSocialLinks } from '@/components/layout/StoreSocialLinks'
import { PageTransition } from '@/components/layout/PageTransition'
import { useStoreSettings } from '@/lib/settings-context'

const SPLASH_SEEN_KEY = 'gp-splash-seen'

export function AppShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const { settings } = useStoreSettings()

  useEffect(() => {
    if (!sessionStorage.getItem(SPLASH_SEEN_KEY)) {
      setShowSplash(true)
    }
  }, [])

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    setShowSplash(false)
  }, [])

  return (
    <div className="min-h-full bg-[var(--gp-cream)] text-[var(--gp-ink)]">
      {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : null}

      <div
        className={`transition-opacity duration-500 ${
          showSplash ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={showSplash}
      >
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.045]"
          style={{
            backgroundImage: "url('/brand/gaia-pattern.png')",
            backgroundSize: '320px',
          }}
          aria-hidden
        />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(227,27,35,0.05),_transparent_50%)]" />
        <div className="relative mx-auto flex min-h-full max-w-md flex-col">
          <AppHeader
            rateBs={settings?.rate_bs}
            rateBsUpdatedAt={settings?.rate_bs_updated_at}
            autoBcvRate={settings?.auto_bcv_rate ?? true}
          />
          <main className="flex-1 px-4 py-4 pb-32">
            <PageTransition>{children}</PageTransition>
          </main>
          <footer className="space-y-3 px-4 pb-32 pt-2 text-center text-xs text-[var(--gp-muted)]">
            <StoreSocialLinks settings={settings} />
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <Link href="/contacto" className="font-semibold text-[var(--gp-red)]">
                Contacto
              </Link>
              <span aria-hidden>·</span>
              <Link href="/sugerencias" className="font-semibold text-[var(--gp-red)]">
                Sugerencias
              </Link>
            </p>
            <p>Gaia Pasta · Italiana, elegante y fresca</p>
          </footer>
          <WhatsAppFloat whatsapp={settings?.whatsapp} />
          <AppBottomNav />
        </div>
      </div>
    </div>
  )
}
