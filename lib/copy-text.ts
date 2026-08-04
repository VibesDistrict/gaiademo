import { formatUsd } from '@/lib/format'
import type { Order, OrderItem, PaymentAccount, PaymentMethod } from '@/lib/types'
import { PAYMENT_METHOD_LABELS } from '@/lib/types'

export const PAYMENT_DETAIL_LABELS: Record<string, string> = {
  bank: 'Banco',
  phone: 'Teléfono',
  cedula: 'Cédula',
  name: 'Titular',
  account: 'Cuenta',
  rif: 'RIF',
  network: 'Red',
  wallet: 'Wallet',
  note: 'Nota',
}

type OrderLine = { name: string; qty: number }

function orderLines(
  items: OrderItem[] | undefined,
  legacyItems: Order['items']
): OrderLine[] {
  if (items?.length) {
    return items.map((item) => ({
      name: item.name_snapshot,
      qty: item.qty,
    }))
  }

  if (!Array.isArray(legacyItems)) return []

  return legacyItems
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const row = raw as Record<string, unknown>
      const name =
        typeof row.name === 'string'
          ? row.name
          : typeof row.name_snapshot === 'string'
            ? row.name_snapshot
            : null
      const qty = typeof row.qty === 'number' ? row.qty : Number(row.qty)
      if (!name || !Number.isFinite(qty) || qty <= 0) return null
      return { name, qty }
    })
    .filter((line): line is OrderLine => line != null)
}

function deliveryAddress(order: Pick<Order, 'delivery_address' | 'address'>) {
  return (
    order.delivery_address?.trim() ||
    order.address?.trim() ||
    ''
  )
}

export { deliveryAddress }

export function formatYummyRidesText(input: {
  order: Order
  items?: OrderItem[]
  pickupAddress?: string
}) {
  const { order } = input
  const shortId = order.id.slice(0, 8).toUpperCase()
  const address = deliveryAddress(order)
  const lines = orderLines(input.items, order.items)
  const itemText =
    lines.length > 0
      ? lines.map((item) => `${item.qty}x ${item.name}`).join(', ')
      : 'Pedido Gaia Pasta'

  return [
    `ENVÍO GAIA PASTA · Pedido #${shortId}`,
    '',
    input.pickupAddress?.trim()
      ? `Origen:\n${input.pickupAddress.trim()}`
      : 'Origen:\nGaia Pasta',
    '',
    address ? `Destino:\n${address}` : null,
    order.customer_name ? `Recibe: ${order.customer_name}` : null,
    order.customer_phone ? `Teléfono: ${order.customer_phone}` : null,
    '',
    'Descripción del envío:',
    `Pastas · ${itemText}`,
    order.notes?.trim() ? `\nNotas del cliente:\n${order.notes.trim()}` : null,
    order.payment_ref ? `\nRef. pago: ${order.payment_ref}` : null,
    `\nTotal pedido: ${formatUsd(Number(order.total_usd))}`,
  ]
    .filter((line) => line != null && line !== '')
    .join('\n')
}

export function formatPaymentAccountText(account: PaymentAccount) {
  const lines = [
    account.label,
    PAYMENT_METHOD_LABELS[account.method],
    '',
  ]

  for (const [key, value] of Object.entries(account.details || {})) {
    if (!value?.trim()) continue
    const label = PAYMENT_DETAIL_LABELS[key] ?? key
    lines.push(`${label}: ${value.trim()}`)
  }

  return lines.join('\n')
}

export function formatPaymentFieldText(
  method: PaymentMethod,
  key: string,
  value: string
) {
  const label = PAYMENT_DETAIL_LABELS[key] ?? key
  return `${PAYMENT_METHOD_LABELS[method]}\n${label}: ${value.trim()}`
}
