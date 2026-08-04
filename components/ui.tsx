import type { ReactNode } from 'react'

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--gp-ink)]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-[var(--gp-muted)]">{subtitle}</p>
      ) : null}
    </div>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl bg-[var(--gp-red)] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(227,27,35,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl border border-[var(--gp-red)]/25 bg-white px-4 py-3 text-sm font-semibold text-[var(--gp-ink)] transition hover:bg-[var(--gp-red)]/5 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputClassName =
  'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base outline-none ring-[var(--gp-red)] focus:ring-2'

export function LoadingMessage({
  children = 'Cargando...',
}: {
  children?: ReactNode
}) {
  return <p className="text-sm text-[var(--gp-muted)]">{children}</p>
}
