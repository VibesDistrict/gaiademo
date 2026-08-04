'use client'

import Link from 'next/link'
import type { StoreSettings } from '@/lib/types'
import { isPromoActive } from '@/lib/promo'

export function SponsoredPromo({ settings }: { settings: StoreSettings | null }) {
  if (!settings || !isPromoActive(settings)) return null

  const content = (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--gp-red)]/15 bg-gradient-to-br from-white via-[var(--gp-cream)]/80 to-[var(--gp-yellow)]/20 p-4 shadow-sm">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--gp-red)]/10"
        aria-hidden
      />
      <div className="relative flex items-center gap-3">
        {settings.promo_image_url ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.promo_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {(settings.promo_sponsor?.trim().length ?? 0) > 0 ? (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
              {settings.promo_sponsor.trim()}
            </p>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gp-muted)]">
              Patrocinado
            </p>
          )}
          <p className="font-[family-name:var(--font-display)] text-base leading-tight text-[var(--gp-ink)]">
            {settings.promo_title}
          </p>
          {(settings.promo_subtitle?.trim().length ?? 0) > 0 ? (
            <p className="mt-0.5 text-xs text-[var(--gp-muted)]">
              {settings.promo_subtitle}
            </p>
          ) : null}
        </div>
        {(settings.promo_link?.trim().length ?? 0) > 0 ? (
          <span className="shrink-0 rounded-full bg-[var(--gp-red)] px-3 py-1.5 text-[11px] font-bold text-white">
            {settings.promo_cta?.trim() || 'Ver más'}
          </span>
        ) : null}
      </div>
    </div>
  )

  const promoLink = settings.promo_link?.trim() ?? ''
  if (promoLink) {
    const href = promoLink
    const external = href.startsWith('http')
    return (
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className="block transition hover:brightness-[1.02]"
      >
        {content}
      </Link>
    )
  }

  return content
}
