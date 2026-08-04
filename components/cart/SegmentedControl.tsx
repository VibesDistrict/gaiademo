'use client'

import { motion } from 'framer-motion'
import { springSnappy } from '@/lib/motion'

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  layoutId = 'gp-segment-bg',
  className = '',
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  layoutId?: string
  className?: string
}) {
  const activeIndex = options.findIndex((o) => o.value === value)

  return (
    <div
      className={`relative grid gap-1 rounded-2xl bg-white/80 p-1 shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="group"
    >
      <motion.span
        layoutId={layoutId}
        className="absolute inset-y-1 rounded-xl bg-[var(--gp-red)] shadow-[0_4px_14px_rgba(227,27,35,0.3)]"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem) / ${options.length}))`,
        }}
        transition={springSnappy}
        aria-hidden
      />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative z-10 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
              active ? 'text-white' : 'text-[var(--gp-ink)]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
