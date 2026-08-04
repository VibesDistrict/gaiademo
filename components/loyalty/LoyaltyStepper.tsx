'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { getLoyaltyProgress } from '@/lib/loyalty'

function RewardStarIcon({ size }: { size: 'sm' | 'md' }) {
  const px = size === 'sm' ? 26 : 32
  return (
    <Image
      src="/brand/gaia-food.png"
      alt=""
      width={px}
      height={px}
      className="scale-110 object-contain drop-shadow-sm"
      aria-hidden
    />
  )
}

export function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C9.5 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C14.5 2 12 7 12 7z"
      />
    </svg>
  )
}

export function LoyaltyStepper({
  stars,
  starsRequired,
  size = 'md',
  className = '',
}: {
  stars: number
  starsRequired: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const { filled } = getLoyaltyProgress(stars, starsRequired)
  const steps = Array.from({ length: starsRequired }, (_, i) => i + 1)
  const nodeClass = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const numClass = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--gp-cream)]"
        aria-hidden
      />
      <motion.div
        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--gp-yellow)]"
        aria-hidden
        initial={false}
        animate={{
          width:
            starsRequired <= 1
              ? '100%'
              : `${Math.max(0, (filled - 1) / (starsRequired - 1)) * 100}%`,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />

      <ol className="relative flex justify-between" aria-label="Progreso de estrellas">
        {steps.map((step) => {
          const done = step <= filled
          const isGift = step === starsRequired

          return (
            <li key={step} className="flex flex-col items-center">
              <motion.span
                initial={false}
                animate={{ scale: done ? 1 : 0.92 }}
                className={`relative z-10 flex ${nodeClass} items-center justify-center overflow-hidden rounded-full border-2 transition-colors ${
                  done
                    ? isGift
                      ? 'border-[var(--gp-yellow)] bg-[var(--gp-yellow)] text-[var(--gp-ink)] shadow-[0_4px_12px_rgba(245,192,80,0.35)]'
                      : 'border-[var(--gp-yellow)] bg-[var(--gp-yellow)]/15 shadow-[0_4px_12px_rgba(245,192,80,0.35)]'
                    : 'border-[var(--gp-cream)] bg-white text-[var(--gp-muted)]'
                }`}
              >
                {done ? (
                  isGift ? (
                    <GiftIcon className={iconClass} />
                  ) : (
                    <RewardStarIcon size={size} />
                  )
                ) : isGift ? (
                  <GiftIcon className={`${iconClass} opacity-50`} />
                ) : (
                  <span className={`${numClass} font-extrabold`}>{step}</span>
                )}
              </motion.span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
