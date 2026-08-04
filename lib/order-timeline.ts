import type { Fulfillment, OrderStatus } from '@/lib/types'
import { orderStatusLabel } from '@/lib/types'

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'cancelled'

export type OrderTimelineStep = {
  status: OrderStatus
  label: string
  hint: string
}

function stepHints(fulfillment: Fulfillment): Partial<Record<OrderStatus, string>> {
  return {
    payment_review: 'Estamos verificando tu comprobante',
    confirmed: 'Tu pago fue confirmado',
    preparing: 'Estamos preparando tu pasta',
    ready:
      fulfillment === 'dine_in'
        ? 'Listo — lo llevamos a tu mesa'
        : fulfillment === 'delivery'
          ? 'Tu pedido está listo para enviarse'
          : 'Tu pedido está listo para retirar',
    picked_up: 'Pedido entregado en el local',
    delivered:
      fulfillment === 'dine_in'
        ? 'Pedido servido en tu mesa'
        : 'Pedido entregado en tu dirección',
    cancelled: 'Este pedido fue cancelado',
    pending_payment: 'Completa el pago para continuar',
  }
}

export function getOrderTimelineSteps(
  fulfillment: Fulfillment
): OrderTimelineStep[] {
  const terminal: OrderStatus =
    fulfillment === 'delivery' || fulfillment === 'dine_in'
      ? 'delivered'
      : 'picked_up'

  const hints = stepHints(fulfillment)

  return (
    [
      'payment_review',
      'confirmed',
      'preparing',
      'ready',
      terminal,
    ] as OrderStatus[]
  ).map((status) => ({
    status,
    label: orderStatusLabel(status, fulfillment),
    hint: hints[status] ?? '',
  }))
}

export function getTimelineStepState(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus,
  steps: OrderTimelineStep[]
): TimelineStepState {
  if (currentStatus === 'cancelled') {
    return stepStatus === 'cancelled' ? 'cancelled' : 'cancelled'
  }

  if (currentStatus === 'pending_payment') {
    if (stepStatus === 'payment_review') return 'current'
    return 'upcoming'
  }

  const order = steps.map((s) => s.status)
  const currentIndex = order.indexOf(currentStatus)
  const stepIndex = order.indexOf(stepStatus)

  if (currentIndex === -1) {
    return stepIndex === 0 ? 'current' : 'upcoming'
  }

  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}

export function isTerminalStatus(status: OrderStatus) {
  return (
    status === 'delivered' || status === 'picked_up' || status === 'cancelled'
  )
}

export function customerStatusNotificationBody(
  orderId: string,
  status: OrderStatus
) {
  const shortId = orderId.slice(0, 8).toUpperCase()
  return `Pedido #${shortId}: ${orderStatusLabel(status)}`
}

export const CUSTOMER_NOTIFY_STATUSES: OrderStatus[] = [
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'picked_up',
  'cancelled',
]
