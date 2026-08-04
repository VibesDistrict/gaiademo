import type { CartItem, Fulfillment, Order, PaymentMethod } from '@/lib/types'
import {
  FULFILLMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  orderStatusLabel,
} from '@/lib/types'
import { formatUsd } from '@/lib/format'

export function buildWhatsAppUrl(
  phone: string,
  message: string
): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function orderWhatsAppMessage(input: {
  order: Pick<
    Order,
    | 'id'
    | 'fulfillment'
    | 'total_usd'
    | 'payment_method'
    | 'address'
    | 'payment_ref'
    | 'table_number'
  >
  items: CartItem[] | { name_snapshot: string; qty: number }[]
  customerName?: string
}) {
  const shortId = input.order.id.slice(0, 8).toUpperCase()
  const fulfillment = fulfillmentLabel(input.order.fulfillment)
  const method = input.order.payment_method
    ? PAYMENT_METHOD_LABELS[input.order.payment_method as PaymentMethod]
    : '—'

  const lines = input.items.map((item) => {
    if ('name_snapshot' in item) {
      return `• ${item.qty}x ${item.name_snapshot}`
    }
    return `• ${item.qty}x ${item.name}`
  })

  return [
    `¡Hola Gaia Pasta! Nuevo pedido #${shortId}`,
    input.customerName ? `Cliente: ${input.customerName}` : null,
    `Modalidad: ${fulfillment}`,
    input.order.fulfillment === 'dine_in' && input.order.table_number
      ? `Mesa: ${input.order.table_number}`
      : null,
    input.order.address ? `Dirección: ${input.order.address}` : null,
    `Pago: ${method}`,
    input.order.payment_ref ? `Ref: ${input.order.payment_ref}` : null,
    `Total: ${formatUsd(Number(input.order.total_usd))}`,
    '',
    'Detalle:',
    ...lines,
  ]
    .filter(Boolean)
    .join('\n')
}

export function adminOrderAlertMessage(
  order: Pick<Order, 'id' | 'fulfillment' | 'total_usd' | 'status' | 'table_number'>
) {
  const shortId = order.id.slice(0, 8).toUpperCase()
  const mesa =
    order.fulfillment === 'dine_in' && order.table_number
      ? ` · Mesa ${order.table_number}`
      : ''
  return `Nuevo pedido #${shortId} · ${fulfillmentLabel(order.fulfillment)}${mesa} · ${formatUsd(Number(order.total_usd))} · revisar pago`
}

export function fulfillmentLabel(fulfillment: Fulfillment) {
  return FULFILLMENT_LABELS[fulfillment] ?? fulfillment
}

export function customerOrderStatusMessage(input: {
  order: Pick<Order, 'id' | 'fulfillment' | 'status' | 'table_number'>
}) {
  const shortId = input.order.id.slice(0, 8).toUpperCase()
  const statusLabel = orderStatusLabel(
    input.order.status,
    input.order.fulfillment
  )
  const fulfillment = fulfillmentLabel(input.order.fulfillment).toLowerCase()

  const extras: Partial<Record<Order['status'], string>> = {
    confirmed: '¡Gracias! Ya estamos preparando tu pedido.',
    preparing: 'Tu pasta se está preparando con cariño.',
    ready:
      input.order.fulfillment === 'delivery'
        ? 'Tu pedido salió / está listo para enviarse.'
        : input.order.fulfillment === 'dine_in'
          ? 'Tu pedido está listo — enseguida lo llevamos a tu mesa.'
          : 'Ya puedes pasar a retirarlo.',
    delivered:
      input.order.fulfillment === 'dine_in'
        ? '¡Buen provecho en tu mesa! Gracias por elegir Gaia Pasta.'
        : 'Esperamos que lo disfrutes. ¡Gracias por elegir Gaia Pasta!',
    picked_up: 'Esperamos que lo disfrutes. ¡Gracias por elegir Gaia Pasta!',
    cancelled: 'Si fue un error, escríbenos y con gusto te ayudamos.',
  }

  return [
    `¡Hola! Gaia Pasta aquí`,
    '',
    `Tu pedido #${shortId} (${fulfillment}${
      input.order.table_number ? ` · mesa ${input.order.table_number}` : ''
    })`,
    `Estado: *${statusLabel}*`,
    extras[input.order.status] ?? '',
  ]
    .filter(Boolean)
    .join('\n')
}
