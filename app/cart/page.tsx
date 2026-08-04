'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { useStoreSettings } from '@/lib/settings-context'
import { supabase } from '@/lib/supabase'
import { formatBs, formatUsd } from '@/lib/format'
import { getLoyaltyProgress, isLoyaltyActive } from '@/lib/loyalty'
import type { Fulfillment } from '@/lib/types'
import { useTableSession } from '@/lib/table-session'
import { DeliveryAddressPicker } from '@/components/cart/DeliveryAddressPicker'
import { SegmentedControl } from '@/components/cart/SegmentedControl'
import {
  LoyaltyRedeemOption,
  readUseLoyaltyReward,
  writeUseLoyaltyReward,
} from '@/components/loyalty/LoyaltyRedeemOption'
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  inputClassName,
} from '@/components/ui'

export default function CartPage() {
  const { user, profile } = useAuth()
  const { settings } = useStoreSettings()
  const { table } = useTableSession()
  const [useReward, setUseReward] = useState(false)
  const [rewardProductName, setRewardProductName] = useState('')
  const {
    items,
    fulfillment,
    address,
    notes,
    subtotalUsd,
    hydrated,
    setQty,
    removeItem,
    setFulfillment,
    setAddress,
    setNotes,
  } = useCart()

  useEffect(() => {
    if (table) setFulfillment('dine_in')
  }, [table, setFulfillment])

  const isDineIn = !!table || fulfillment === 'dine_in'

  const loyaltyActive = settings ? isLoyaltyActive(settings) : false
  const stars = profile?.loyalty_stars ?? 0
  const starsRequired = settings?.loyalty_stars_required ?? 5
  const { canRedeem } = getLoyaltyProgress(stars, starsRequired)

  useEffect(() => {
    setUseReward(readUseLoyaltyReward())
  }, [])

  useEffect(() => {
    if (!settings?.loyalty_reward_product_id) {
      setRewardProductName('')
      return
    }
    let active = true
    supabase
      .from('products')
      .select('name')
      .eq('id', settings.loyalty_reward_product_id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRewardProductName(data?.name ?? 'Regalo')
      })
    return () => {
      active = false
    }
  }, [settings?.loyalty_reward_product_id])

  function handleRewardChange(next: boolean) {
    setUseReward(next)
    writeUseLoyaltyReward(next)
  }

  const deliveryFee =
    fulfillment === 'delivery' ? (settings?.delivery_fee_usd ?? 0) : 0
  const total = subtotalUsd + deliveryFee
  const belowMin =
    settings != null && subtotalUsd > 0 && subtotalUsd < settings.min_order_usd
  const deliveryAddressMissing =
    fulfillment === 'delivery' && !address.trim()
  const checkoutBlocked =
    belowMin || !!settings?.store_closed || deliveryAddressMissing

  return (
    <div className="gp-fade-in space-y-5">
      <SectionTitle
        title="Tu carrito"
        subtitle={
          isDineIn
            ? `Dinner In · Mesa ${table?.number ?? '—'}`
            : 'Revisa cantidades y elige modalidad'
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white/90 p-5 text-sm text-[var(--gp-muted)] shadow-sm">
          El carrito está vacío.{' '}
          <Link href="/" className="font-semibold text-[var(--gp-red)]">
            Ver menú
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-[var(--gp-muted)]">
                    {formatUsd(item.unitPriceUsd)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full bg-[var(--gp-cream)] font-bold"
                    onClick={() => setQty(item.productId, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold">{item.qty}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full bg-[var(--gp-yellow)] font-bold"
                    onClick={() => setQty(item.productId, item.qty + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-1 text-xs text-red-500"
                    onClick={() => removeItem(item.productId)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isDineIn ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--gp-red)]/30 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--gp-muted)]">
                Dinner In
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--gp-red)]">
                Mesa {table?.number ?? '—'}
              </p>
              <p className="mt-1 text-sm text-[var(--gp-muted)]">
                Tu pedido llegará a la caja con el número de mesa.
              </p>
            </div>
          ) : (
            <SegmentedControl
              value={fulfillment === 'delivery' ? 'delivery' : 'pickup'}
              onChange={setFulfillment}
              layoutId="cart-fulfillment-bg"
              options={[
                { value: 'pickup' as Fulfillment, label: 'Pick up' },
                { value: 'delivery' as Fulfillment, label: 'Delivery' },
              ]}
            />
          )}

          {!isDineIn && fulfillment === 'delivery' ? (
            <DeliveryAddressPicker
              userId={user?.id ?? null}
              value={address}
              onChange={setAddress}
              ready={hydrated}
            />
          ) : null}

          <Field label="Notas del pedido">
            <textarea
              className={`${inputClassName} min-h-20`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sin salsa, tocar timbre, etc."
            />
          </Field>

          {loyaltyActive && canRedeem && items.length > 0 ? (
            <LoyaltyRedeemOption
              checked={useReward}
              onChange={handleRewardChange}
              rewardProductName={rewardProductName}
              stars={stars}
              starsRequired={starsRequired}
            />
          ) : null}

          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold">{formatUsd(subtotalUsd)}</span>
            </div>
            {fulfillment === 'delivery' ? (
              <div className="mt-1 flex justify-between text-[var(--gp-muted)]">
                <span>Delivery</span>
                <span>{formatUsd(deliveryFee)}</span>
              </div>
            ) : null}
            <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base">
              <span className="font-extrabold">Total</span>
              <div className="text-right">
                <p className="font-extrabold text-[var(--gp-red)]">
                  {formatUsd(total)}
                </p>
                {settings ? (
                  <p className="text-xs text-[var(--gp-muted)]">
                    {formatBs(total, settings.rate_bs)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {checkoutBlocked ? (
              <PrimaryButton type="button" className="w-full" disabled>
                Continuar al pago
              </PrimaryButton>
            ) : (
              <Link href="/checkout">
                <PrimaryButton type="button" className="w-full">
                  Continuar al pago
                </PrimaryButton>
              </Link>
            )}
            {deliveryAddressMissing ? (
              <p className="text-center text-xs text-red-600">
                Elige o escribe una dirección de entrega.
              </p>
            ) : null}
            {belowMin ? (
              <p className="text-center text-xs text-red-600">
                El pedido mínimo es {formatUsd(settings!.min_order_usd)}.
              </p>
            ) : null}
            {settings?.store_closed ? (
              <p className="text-center text-xs text-red-600">
                La tienda está cerrada temporalmente.
              </p>
            ) : null}
            <Link href="/">
              <SecondaryButton type="button" className="w-full">
                Seguir comprando
              </SecondaryButton>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
