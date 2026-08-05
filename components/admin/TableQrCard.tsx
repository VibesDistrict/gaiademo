'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { RestaurantTable } from '@/lib/types'
import { tableDeepLink } from '@/lib/table-url'

type Props = {
  table: RestaurantTable
  size?: number
  className?: string
}

export function TableQrCard({ table, size = 220, className = '' }: Props) {
  const url = tableDeepLink(table.code)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then((value) => {
        if (!cancelled) setDataUrl(value)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [url, size])

  return (
    <article
      className={`table-qr-card flex flex-col items-center rounded-2xl border border-[var(--gp-border)] bg-white p-5 text-center ${className}`}
      data-table-code={table.code}
    >
      <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wide text-[var(--gp-red)]">
        Gaia Pasta
      </p>
      <p className="mt-1 text-2xl font-bold text-[var(--gp-ink)]">
        Mesa {table.number}
      </p>
      {table.label && table.label !== `Mesa ${table.number}` ? (
        <p className="text-xs text-[var(--gp-muted)]">{table.label}</p>
      ) : null}
      <div className="mt-3 flex h-[220px] w-[220px] items-center justify-center bg-white">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR Mesa ${table.number}`}
            width={size}
            height={size}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-xs text-[var(--gp-muted)]">Generando QR…</span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--gp-ink)]">
        Escanea y pide desde tu mesa
      </p>
      <p className="mt-1 break-all text-[10px] leading-snug text-[var(--gp-muted)]">
        {url}
      </p>
    </article>
  )
}

export async function downloadTableQrPng(table: RestaurantTable) {
  const url = tableDeepLink(table.code)
  const dataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })

  // Compose branded card on canvas for download
  const canvas = document.createElement('canvas')
  const w = 640
  const h = 820
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#E31B23'
  ctx.font = 'bold 36px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('Gaia Pasta', w / 2, 70)

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.fillText(`Mesa ${table.number}`, w / 2, 140)

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('No se pudo cargar el QR'))
    img.src = dataUrl
  })
  const qrSize = 420
  ctx.drawImage(img, (w - qrSize) / 2, 180, qrSize, qrSize)

  ctx.fillStyle = '#1a1a1a'
  ctx.font = '600 22px system-ui, sans-serif'
  ctx.fillText('Escanea y pide desde tu mesa', w / 2, 660)

  ctx.fillStyle = '#666666'
  ctx.font = '14px system-ui, sans-serif'
  const short = url.replace(/^https?:\/\//, '')
  ctx.fillText(short, w / 2, 700)

  const link = document.createElement('a')
  link.download = `gaia-pasta-mesa-${table.number}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
