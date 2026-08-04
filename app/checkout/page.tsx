'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useCart } from '@/lib/cart'
import { useTableSession } from '@/lib/table-session'
import { useStoreSettings } from '@/lib/settings-context'
import { formatBs, formatUsd } from '@/lib/format'
import { buildWhatsAppUrl, fulfillmentLabel, orderWhatsAppMessage } from '@/lib/whatsapp'
import { formatSupabaseError, stepError } from '@/lib/errors'
import { buildOrderInsert } from '@/lib/order-payload'
import { PAYMENT_DETAIL_LABELS } from '@/lib/copy-text'
import { getLoyaltyProgress, isLoyaltyActive } from '@/lib/loyalty'
import type { PaymentAccount, PaymentMethod } from '@/lib/types'
import { PAYMENT_METHOD_LABELS } from '@/lib/types'
import { ConfettiBurst } from '@/components/orders/ConfettiBurst'
import { SegmentedControl } from '@/components/cart/SegmentedControl'
import { TextSkeleton } from '@/components/menu/Skeleton'
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
import { springSnappy } from '@/lib/motion'
import { hapticSuccess } from '@/lib/haptics'

export default function CheckoutPage() {
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const { user, loading } = useRequireAuth('/checkout')
  const { settings } = useStoreSettings()
  const { table } = useTableSession()
  const { items, fulfillment, address, notes, subtotalUsd, clearCart } =
    useCart()
  const effectiveFulfillment =
    table || fulfillment === 'dine_in' ? 'dine_in' : fulfillment
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [paymentRef, setPaymentRef] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(true)
  const [waUrl, setWaUrl] = useState<string | null>(null)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [useReward, setUseReward] = useState(false)
  const [rewardProductName, setRewardProductName] = useState('')

  useEffect(() => {
    let active = true
    supabase
      .from('payment_accounts')
      .select('*')
      .eq('active', true)
      .then(({ data }) => {
        if (!active) return
        const rows = (data as PaymentAccount[]) ?? []
        setAccounts(rows)
        if (rows[0]) setMethod(rows[0].method)
        setLoadingCheckout(false)
      })
    return () => {
      active = false
    }
  }, [])

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

  useEffect(() => {
    if (loading || !user) return
    if (items.length === 0 && !createdOrderId) {
      router.replace('/cart')
    }
  }, [loading, user, items.length, createdOrderId, router])

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.method === method) ?? null,
    [accounts, method]
  )

  const deliveryFee =
    effectiveFulfillment === 'delivery' ? (settings?.delivery_fee_usd ?? 0) : 0
  const total = subtotalUsd + deliveryFee

  const loyaltyActive = settings ? isLoyaltyActive(settings) : false
  const stars = profile?.loyalty_stars ?? 0
  const starsRequired = settings?.loyalty_stars_required ?? 5
  const { canRedeem } = getLoyaltyProgress(stars, starsRequired)

  function handleRewardChange(next: boolean) {
    setUseReward(next)
    writeUseLoyaltyReward(next)
  }

  const paymentOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.method,
        label: PAYMENT_METHOD_LABELS[account.method] || account.label,
      })),
    [accounts]
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setError('Debes iniciar sesión para confirmar el pedido.')
      return
    }
    if (!method || !settings) {
      setError('Espera un momento y vuelve a intentar.')
      return
    }
    if (!paymentRef.trim() || !proofFile) {
      setError('Sube la captura y escribe la referencia del pago.')
      return
    }
    if (settings.store_closed) {
      setError('La tienda está cerrada.')
      return
    }
    if (subtotalUsd < settings.min_order_usd) {
      setError(`Pedido mínimo ${formatUsd(settings.min_order_usd)}`)
      return
    }
    if (effectiveFulfillment === 'dine_in' && !table) {
      setError('Escanea el QR de tu mesa para pedir Dinner In.')
      return
    }
    if (effectiveFulfillment === 'delivery' && !address.trim()) {
      setError('Indica la dirección de delivery.')
      return
    }

    setSubmitting(true)
    setError(null)

    let createdOrderIdLocal: string | null = null

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        throw new Error(
          'Tu sesión expiró. Cierra sesión, vuelve a entrar e intenta otra vez.'
        )
      }

      const sessionUser = sessionData.session.user
      const customerName =
        profile?.full_name?.trim() ||
        (typeof sessionUser.user_metadata?.full_name === 'string'
          ? sessionUser.user_metadata.full_name.trim()
          : '') ||
        sessionUser.email?.split('@')[0] ||
        'Cliente'
      const customerPhone =
        profile?.phone?.trim() ||
        (typeof sessionUser.user_metadata?.phone === 'string'
          ? sessionUser.user_metadata.phone.trim()
          : '') ||
        null

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(
          buildOrderInsert({
            userId: sessionUser.id,
            customerName,
            customerPhone,
            fulfillment: effectiveFulfillment,
            address:
              effectiveFulfillment === 'delivery' ? address.trim() : null,
            notes: notes.trim() || null,
            paymentMethod: method,
            paymentRef: paymentRef.trim(),
            cartItems: items,
            subtotalUsd,
            deliveryFeeUsd: deliveryFee,
            totalUsd: total,
            rateBs: settings.rate_bs,
            tableId: table?.id ?? null,
            tableNumber: table?.number ?? null,
          })
        )
        .select('*')
        .single()

      if (orderError || !order) {
        throw new Error(
          stepError(
            'Registrar pedido',
            orderError,
            'No se pudo crear el pedido en la base de datos'
          )
        )
      }

      createdOrderIdLocal = order.id

      const itemRows = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId || null,
        name_snapshot: item.name,
        unit_price_usd: item.unitPriceUsd,
        qty: item.qty,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemRows)
      if (itemsError) {
        throw new Error(
          stepError(
            'Guardar productos',
            itemsError,
            'No se pudieron guardar los productos del pedido'
          )
        )
      }

      const ext = proofFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${sessionData.session.user.id}/${order.id}.${ext}`

      const uploadOptions: { upsert: boolean; contentType?: string } = {
        upsert: true,
      }
      if (proofFile.type) uploadOptions.contentType = proofFile.type

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, proofFile, uploadOptions)
      if (uploadError) {
        throw new Error(
          stepError(
            'Subir captura',
            uploadError,
            'No se pudo subir la imagen del pago'
          )
        )
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ payment_proof_url: path })
        .eq('id', order.id)
      if (updateError) {
        throw new Error(
          stepError(
            'Guardar comprobante',
            updateError,
            'No se pudo vincular la captura al pedido'
          )
        )
      }

      if (useReward && loyaltyActive && canRedeem) {
        const { error: redeemError } = await supabase.rpc(
          'redeem_loyalty_reward',
          { p_order_id: order.id }
        )
        if (redeemError) {
          throw new Error(
            stepError(
              'Canjear recompensa',
              redeemError,
              'No se pudo aplicar la recompensa'
            )
          )
        }
        writeUseLoyaltyReward(false)
        await refreshProfile()
      }

      const message = orderWhatsAppMessage({
        order: {
          id: order.id,
          fulfillment: effectiveFulfillment,
          total_usd: total,
          payment_method: method,
          address: effectiveFulfillment === 'delivery' ? address : null,
          payment_ref: paymentRef.trim(),
          table_number: table?.number ?? null,
        },
        items,
        customerName: profile?.full_name,
      })
      const url = buildWhatsAppUrl(settings.whatsapp, message)
      setWaUrl(url)
      setCreatedOrderId(order.id)
      clearCart()
      hapticSuccess()
    } catch (err) {
      if (createdOrderIdLocal) {
        await supabase.from('orders').delete().eq('id', createdOrderIdLocal)
      }
      const msg = formatSupabaseError(err, '')
      setError(msg || 'Error al crear el pedido. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdOrderId) {
    return (
      <>
        <ConfettiBurst active />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springSnappy}
          className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springSnappy, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gp-yellow)]/30 text-3xl"
          >
            ✓
          </motion.div>
          <SectionTitle
            title="¡Pedido enviado!"
            subtitle="Estamos revisando tu pago. Te avisamos cuando lo confirmemos."
          />
          <p className="text-sm text-[var(--gp-muted)]">
            Código: <strong>#{createdOrderId.slice(0, 8).toUpperCase()}</strong>
          </p>
          {waUrl ? (
            <p className="text-sm text-[var(--gp-muted)]">
              Si quieres avisarnos por WhatsApp, usa el botón de abajo cuando
              quieras.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {waUrl ? (
              <a href={waUrl} target="_blank" rel="noreferrer">
                <PrimaryButton type="button" className="w-full">
                  Avisar por WhatsApp
                </PrimaryButton>
              </a>
            ) : null}
            <Link href={`/orders/${createdOrderId}`}>
              <SecondaryButton type="button" className="w-full">
                Ver mi pedido
              </SecondaryButton>
            </Link>
          </div>
        </motion.div>
      </>
    )
  }

  if (loading || !user || loadingCheckout) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <TextSkeleton lines={2} />
        <div className="space-y-2 pt-2">
          <TextSkeleton lines={3} />
        </div>
      </div>
    )
  }

  if (!accounts.length) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <SectionTitle
          title="Pagos no disponibles"
          subtitle="No hay métodos de pago activos en este momento"
        />
        <p className="text-sm text-[var(--gp-muted)]">
          Vuelve más tarde o escríbenos por WhatsApp para completar tu pedido.
        </p>
        <Link href="/contacto">
          <PrimaryButton type="button" className="w-full">
            Ir a contacto
          </PrimaryButton>
        </Link>
        <Link href="/cart">
          <SecondaryButton type="button" className="w-full">
            Volver al carrito
          </SecondaryButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Pagar pedido"
        subtitle="Elige método, paga y sube la captura"
      />

      <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <p className="font-bold">
          {fulfillmentLabel(effectiveFulfillment)}
          {effectiveFulfillment === 'dine_in' && table
            ? ` · Mesa ${table.number}`
            : ''}{' '}
          · {formatUsd(total)}
          {settings ? (
            <span className="ml-2 font-semibold text-[var(--gp-muted)]">
              ({formatBs(total, settings.rate_bs)})
            </span>
          ) : null}
        </p>
        <ul className="mt-2 space-y-1 text-[var(--gp-muted)]">
          {items.map((item) => (
            <li key={item.productId}>
              {item.qty}x {item.name}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {method && paymentOptions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-muted)]">
              Método de pago
            </p>
            <SegmentedControl
              value={method}
              onChange={setMethod}
              layoutId="checkout-payment-bg"
              options={paymentOptions}
            />
          </div>
        ) : null}

        {selectedAccount ? (
          <div className="rounded-2xl border border-[var(--gp-yellow)]/40 bg-[var(--gp-yellow)]/10 p-4 text-sm">
            <p className="font-bold text-[var(--gp-ink)]">
              Datos para {selectedAccount.label}
            </p>
            <dl className="mt-2 space-y-1">
              {Object.entries(selectedAccount.details || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-[var(--gp-muted)]">
                    {PAYMENT_DETAIL_LABELS[key] ?? key}
                  </dt>
                  <dd className="font-semibold text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <Field label="Referencia / número de operación">
          <input
            className={inputClassName}
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="Ej. 123456789"
            required
          />
        </Field>

        <Field label="Captura del pago">
          <input
            type="file"
            accept="image/*,.pdf"
            className={inputClassName}
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            required
          />
        </Field>

        {loyaltyActive && canRedeem ? (
          <LoyaltyRedeemOption
            checked={useReward}
            onChange={handleRewardChange}
            rewardProductName={rewardProductName}
            stars={stars}
            starsRequired={starsRequired}
          />
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <PrimaryButton type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Confirmar pedido'}
        </PrimaryButton>
      </form>
    </div>
  )
}
