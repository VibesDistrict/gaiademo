import type { Order } from '@/lib/types'

export function shouldAlertAdminForOrder(
  order: Pick<Order, 'id' | 'status' | 'archived'>,
  seenIds: ReadonlySet<string>,
  seeded: boolean
) {
  if (!seeded) return false
  if (order.archived === true) return false
  if (order.status !== 'payment_review') return false
  if (seenIds.has(order.id)) return false
  return true
}
