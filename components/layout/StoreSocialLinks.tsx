'use client'

import type { StoreSettings } from '@/lib/types'
import { getStoreSocialLinks } from '@/lib/social'

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  )
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 5.5c-.9 1.4-2.2 2.4-3.8 2.7v8.6a4.2 4.2 0 1 1-3.6-4.15V9.9a6.8 6.8 0 0 0-1.2-.1 6.7 6.7 0 1 0 6.7 6.7v-7.2c1.2-.3 2.2-.9 3.1-1.8l-1.2-2.1Z" />
    </svg>
  )
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 8.5h2.5l-.5 3H14v8.5h-3.5V11.5H9V8.5h1.5V6.5c0-2 1.2-3.5 3.8-3.5H14v3Z" />
    </svg>
  )
}

const ICONS = {
  instagram: IconInstagram,
  tiktok: IconTikTok,
  facebook: IconFacebook,
} as const

export function StoreSocialLinks({
  settings,
  variant = 'row',
}: {
  settings: Pick<StoreSettings, 'instagram' | 'tiktok' | 'facebook'> | null
  variant?: 'row' | 'cards'
}) {
  if (!settings) return null

  const links = getStoreSocialLinks(settings)
  if (!links.length) return null

  if (variant === 'cards') {
    return (
      <div className="grid gap-2">
        {links.map((link) => {
          const Icon = ICONS[link.id]
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gp-cream)] text-[var(--gp-red)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-bold">{link.label}</span>
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {links.map((link) => {
        const Icon = ICONS[link.id]
        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--gp-red)] shadow-sm ring-1 ring-[var(--gp-red)]/10 transition hover:bg-[var(--gp-red)]/5"
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
    </div>
  )
}
