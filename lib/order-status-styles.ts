import type { OrderStatus } from '@/lib/types'

export const ORDER_STATUS_STYLES: Record<
  OrderStatus,
  { badge: string; border: string; dot: string }
> = {
  pending_payment: {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-l-gray-300',
    dot: 'bg-gray-400',
  },
  payment_review: {
    badge: 'bg-[var(--gp-yellow)] text-[var(--gp-ink)]',
    border: 'border-l-[var(--gp-yellow)]',
    dot: 'bg-[var(--gp-yellow)]',
  },
  confirmed: {
    badge: 'bg-sky-100 text-sky-800',
    border: 'border-l-sky-400',
    dot: 'bg-sky-400',
  },
  preparing: {
    badge: 'bg-[var(--gp-red)]/15 text-[var(--gp-red)]',
    border: 'border-l-[var(--gp-red)]',
    dot: 'bg-[var(--gp-red)]',
  },
  ready: {
    badge: 'bg-green-100 text-green-800',
    border: 'border-l-green-500',
    dot: 'bg-green-500',
  },
  delivered: {
    badge: 'bg-[var(--gp-cream)] text-[var(--gp-muted)]',
    border: 'border-l-[var(--gp-muted)]/40',
    dot: 'bg-[var(--gp-muted)]',
  },
  picked_up: {
    badge: 'bg-[var(--gp-cream)] text-[var(--gp-muted)]',
    border: 'border-l-[var(--gp-muted)]/40',
    dot: 'bg-[var(--gp-muted)]',
  },
  cancelled: {
    badge: 'bg-red-100 text-red-700',
    border: 'border-l-red-400',
    dot: 'bg-red-400',
  },
}

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  'delivered',
  'picked_up',
  'cancelled',
]
