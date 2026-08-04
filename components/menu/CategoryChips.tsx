'use client'

import Image from 'next/image'
import { MENU_CATEGORIES, type MenuCategoryId } from '@/lib/brand'

export function CategoryChips({
  active,
  onChange,
}: {
  active: MenuCategoryId
  onChange: (id: MenuCategoryId) => void
}) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
      {MENU_CATEGORIES.map((cat) => {
        const selected = cat.id === active
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={`relative flex h-[3.6rem] w-[3.6rem] items-center justify-center overflow-hidden rounded-full transition ${
                selected
                  ? 'bg-[var(--gp-red)] shadow-[0_8px_20px_rgba(227,27,35,0.35)] ring-2 ring-[var(--gp-yellow)]'
                  : 'bg-white shadow-[0_6px_16px_rgba(28,20,16,0.06)] ring-1 ring-black/[0.04]'
              }`}
            >
              <Image
                src={cat.image}
                alt=""
                width={48}
                height={48}
                className={`h-11 w-11 object-cover ${
                  cat.id === 'all' ? 'rounded-full object-contain p-1' : 'rounded-full'
                }`}
              />
            </span>
            <span
              className={`text-[11px] font-bold ${
                selected ? 'text-[var(--gp-red)]' : 'text-[var(--gp-muted)]'
              }`}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
