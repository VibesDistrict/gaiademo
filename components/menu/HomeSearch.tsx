'use client'

export function HomeSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 shadow-[0_8px_24px_rgba(28,20,16,0.06)] ring-1 ring-black/[0.04]">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-[var(--gp-muted)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca tu pasta favorita…"
        className="w-full bg-transparent text-sm font-medium text-[var(--gp-ink)] outline-none placeholder:text-[var(--gp-muted)]"
      />
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--gp-cream)] text-[var(--gp-red)]"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 7h16M7 12h10M10 17h4" />
        </svg>
      </span>
    </label>
  )
}
