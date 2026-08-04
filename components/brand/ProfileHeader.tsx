'use client'

import Image from 'next/image'
import { getLoyaltyLevel } from '@/lib/loyalty'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TD'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function ProfileHeader({
  name,
  email,
  phone,
  rewardsCount,
  showLevel,
}: {
  name: string
  email?: string | null
  phone?: string | null
  rewardsCount: number
  showLevel: boolean
}) {
  const initials = getInitials(name)
  const level = getLoyaltyLevel(rewardsCount)

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--gp-red)]/10">
      <div className="bg-gradient-to-br from-[var(--gp-red)]/10 via-[var(--gp-cream)] to-[var(--gp-yellow)]/15 px-4 py-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--gp-red)] to-[#f06292] text-xl font-extrabold text-white shadow-md ring-4 ring-white">
              {initials}
            </div>
            <Image
              src="/brand/gaia-logo.png"
              alt=""
              width={28}
              height={28}
              className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full border-2 border-white bg-white object-cover shadow-sm"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-[family-name:var(--font-display)] text-xl leading-tight text-[var(--gp-ink)]">
              {name}
            </h1>
            {showLevel ? (
              <p className="mt-1 inline-flex items-center rounded-full bg-[var(--gp-yellow)]/35 px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--gp-ink)]">
                Nivel {level.level} · {level.name}
              </p>
            ) : null}
            {email ? (
              <p className="mt-1.5 truncate text-sm text-[var(--gp-muted)]">{email}</p>
            ) : null}
            {phone ? (
              <p className="truncate text-sm text-[var(--gp-muted)]">{phone}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
