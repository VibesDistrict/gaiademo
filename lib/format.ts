export function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatBs(amountUsd: number, rateBs: number) {
  const bs = amountUsd * rateBs
  return formatBsAmount(bs)
}

export function formatBsAmount(bs: number) {
  return `Bs. ${bs.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatBsRate(rateBs: number) {
  return formatBsAmount(rateBs)
}

export function formatBsRateNumber(rateBs: number) {
  return rateBs.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseSettingNumber(value: string | undefined, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
