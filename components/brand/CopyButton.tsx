'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

export function CopyButton({
  text,
  label = 'Copiar',
  copiedLabel = 'Copiado',
  className = '',
  compact = false,
  disabled,
}: {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
  compact?: boolean
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function onCopy() {
    setFailed(false)
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      return
    }
    setFailed(true)
    window.setTimeout(() => setFailed(false), 2500)
  }

  const baseClass = compact
    ? 'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold'
    : 'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold'

  const stateClass = copied
    ? 'bg-green-100 text-green-800'
    : failed
      ? 'bg-red-100 text-red-700'
      : 'bg-[var(--gp-cream)] text-[var(--gp-ink)] hover:bg-[var(--gp-yellow)]/40'

  return (
    <button
      type="button"
      disabled={disabled || !text.trim()}
      onClick={onCopy}
      className={`${baseClass} ${stateClass} transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      title={label}
    >
      <span aria-hidden>{copied ? '✓' : '📋'}</span>
      {copied ? copiedLabel : failed ? 'Error' : label}
    </button>
  )
}
