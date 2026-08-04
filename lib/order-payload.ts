import type { CartItem, Fulfillment, PaymentMethod } from '@/lib/types'

export function buildOrderItemsSnapshot(cartItems: CartItem[]) {
  return cartItems.map((item) => ({
    product_id: item.productId,
    name: item.name,
    qty: item.qty,
    unit_price_usd: item.unitPriceUsd,
  }))
}

export function buildOrderInsert(input: {
  userId: string
  customerName: string
  customerPhone: string | null
  fulfillment: Fulfillment
  address: string | null
  notes: string | null
  paymentMethod: PaymentMethod
  paymentRef: string
  cartItems: CartItem[]
  subtotalUsd: number
  deliveryFeeUsd: number
  totalUsd: number
  rateBs: number
  tableId?: string | null
  tableNumber?: number | null
}) {
  const deliveryAddress =
    input.fulfillment === 'delivery' ? input.address ?? '' : ''
  const dineInAddress =
    input.fulfillment === 'dine_in' && input.tableNumber
      ? `Mesa ${input.tableNumber}`
      : null
  const totalBs = Math.round(input.totalUsd * input.rateBs * 100) / 100

  return {
    user_id: input.userId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    order_type: input.fulfillment,
    fulfillment: input.fulfillment,
    table_id: input.fulfillment === 'dine_in' ? input.tableId ?? null : null,
    items: buildOrderItemsSnapshot(input.cartItems),
    status: 'payment_review' as const,
    payment_status: 'pending',
    address: input.fulfillment === 'dine_in' ? dineInAddress : input.address,
    delivery_address: deliveryAddress,
    notes: input.notes,
    payment_method: input.paymentMethod,
    payment_ref: input.paymentRef,
    payment_reference: input.paymentRef,
    subtotal_usd: input.subtotalUsd,
    delivery_fee_usd: input.deliveryFeeUsd,
    total_usd: input.totalUsd,
    total_bs: totalBs,
    rate_bs: input.rateBs,
    bcv_rate: input.rateBs,
  }
}
