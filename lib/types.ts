export type UserRole = 'customer' | 'admin'
export type Fulfillment = 'pickup' | 'delivery' | 'dine_in'
export type PaymentMethod = 'pago_movil' | 'tarjeta' | 'binance'

export interface RestaurantTable {
  id: string
  number: number
  code: string
  label: string
  active: boolean
  created_at?: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'payment_review'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'picked_up'
  | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  phone: string
  role: UserRole
  loyalty_stars?: number
  loyalty_rewards_count?: number
}

export interface CustomerAddress {
  id: string
  user_id: string
  label: string
  address: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price_usd: number
  image_url: string | null
  available: boolean
  sort_order: number
}

export interface CartItem {
  productId: string
  name: string
  unitPriceUsd: number
  qty: number
}

export interface PaymentAccount {
  id: string
  method: PaymentMethod
  label: string
  details: Record<string, string>
  active: boolean
}

export interface Order {
  id: string
  user_id: string
  customer_name?: string | null
  customer_phone?: string | null
  order_type?: string | null
  items?: unknown
  payment_status?: string | null
  delivery_address?: string | null
  fulfillment: Fulfillment
  table_id?: string | null
  table_number?: number | null
  status: OrderStatus
  address: string | null
  notes: string | null
  payment_method: PaymentMethod | null
  payment_ref: string | null
  payment_reference?: string | null
  payment_proof_url: string | null
  subtotal_usd: number
  delivery_fee_usd: number
  total_usd: number
  total_bs?: number | null
  bcv_rate?: number | null
  rate_bs: number
  created_at: string
  updated_at: string
  archived?: boolean
  archived_at?: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  name_snapshot: string
  unit_price_usd: number
  qty: number
}

export type FeedbackType = 'review' | 'suggestion'

export interface Feedback {
  id: string
  user_id: string
  order_id: string | null
  type: FeedbackType
  rating: number | null
  message: string
  customer_name: string
  read_by_admin: boolean
  created_at: string
}

export interface StoreSettings {
  rate_bs: number
  auto_bcv_rate: boolean
  rate_bs_updated_at: string
  delivery_fee_usd: number
  min_order_usd: number
  store_closed: boolean
  whatsapp: string
  open_hours: string
  auto_whatsapp_notify: boolean
  pickup_address: string
  notify_customer_on_status: boolean
  instagram: string
  tiktok: string
  facebook: string
  promo_enabled: boolean
  promo_sponsor: string
  promo_title: string
  promo_subtitle: string
  promo_link: string
  promo_image_url: string
  promo_cta: string
  loyalty_enabled: boolean
  loyalty_min_subtotal_usd: number
  loyalty_stars_required: number
  loyalty_reward_product_id: string
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  payment_review: 'Revisando pago',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  picked_up: 'Retirado',
  cancelled: 'Cancelado',
}

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  pickup: 'Pick up',
  delivery: 'Delivery',
  dine_in: 'Dinner In',
}

export function orderStatusLabel(
  status: OrderStatus,
  fulfillment?: Fulfillment | null
) {
  if (fulfillment === 'dine_in') {
    if (status === 'ready') return 'Listo para servir'
    if (status === 'delivered' || status === 'picked_up') return 'Servido'
  }
  return ORDER_STATUS_LABELS[status]
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pago_movil: 'Pago móvil',
  tarjeta: 'Tarjeta / transferencia',
  binance: 'Binance',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pago pendiente de revisión',
  pending_review: 'Revisando pago',
  paid: 'Pagado',
  verified: 'Verificado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  unpaid: 'Sin pagar',
}

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  review: 'Review',
  suggestion: 'Sugerencia',
}

export function canReviewOrder(status: OrderStatus) {
  return status === 'delivered' || status === 'picked_up'
}
