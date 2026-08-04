'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import type { Product, StoreSettings } from '@/lib/types'
import { formatBs, formatUsd } from '@/lib/format'
import { getProductImagePublicUrl } from '@/lib/product-images'
import { fallbackProductImage } from '@/lib/brand'
import { useCartAnimation } from '@/lib/cart-animation'
import { springSnappy } from '@/lib/motion'

const MENU_VIEW_KEY = 'gp-menu-view'

export type MenuView = 'grid' | 'list'

export function getStoredMenuView(): MenuView {
  if (typeof window === 'undefined') return 'grid'
  return localStorage.getItem(MENU_VIEW_KEY) === 'list' ? 'list' : 'grid'
}

export function storeMenuView(view: MenuView) {
  localStorage.setItem(MENU_VIEW_KEY, view)
}

function productBadge(product: Product, index: number) {
  const name = product.name.toLowerCase()
  if (index === 0 || /alfredo|bolognese/i.test(name)) {
    return { label: 'Favorita', tone: 'red' as const }
  }
  if (/camaron|shrimp/i.test(name)) {
    return { label: 'Chef', tone: 'yellow' as const }
  }
  if (Number(product.price_usd) >= 11) {
    return { label: 'Premium', tone: 'dark' as const }
  }
  return null
}

function AddButton({
  product,
  added,
  disabled,
  onClick,
}: {
  product: Product
  added: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const { flyToCart } = useCartAnimation()

  function handleClick() {
    if (disabled) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      flyToCart(
        rect,
        getProductImagePublicUrl(product.image_url) ??
          fallbackProductImage(product.id)
      )
    }
    onClick()
  }

  return (
    <motion.button
      ref={btnRef}
      type="button"
      aria-label={
        added ? `${product.name} agregado` : `Agregar ${product.name}`
      }
      disabled={disabled}
      onClick={handleClick}
      whileTap={{ scale: 0.88 }}
      animate={{ scale: added ? 1.08 : 1 }}
      transition={springSnappy}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gp-red)] text-lg font-bold text-white shadow-[0_8px_18px_rgba(227,27,35,0.32)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {added ? '✓' : '+'}
    </motion.button>
  )
}

function resolveImage(product: Product) {
  return (
    getProductImagePublicUrl(product.image_url) ??
    fallbackProductImage(product.id || product.name)
  )
}

function ProductImage({
  product,
  className,
  sizes,
}: {
  product: Product
  className: string
  sizes: string
}) {
  const image = resolveImage(product)
  return (
    <div className={`relative overflow-hidden bg-[var(--gp-cream)] ${className}`}>
      <Image
        src={image}
        alt={product.name}
        fill
        className="object-cover"
        sizes={sizes}
        unoptimized={image.startsWith('/')}
      />
    </div>
  )
}

export function MenuProductGrid({
  products,
  settings,
  addedId,
  storeClosed,
  onAdd,
}: {
  products: Product[]
  settings: StoreSettings | null
  addedId: string | null
  storeClosed?: boolean
  onAdd: (product: Product) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      {products.map((product, index) => {
        const badge = productBadge(product, index)
        return (
          <article
            key={product.id}
            className="gp-fade-in group flex flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_10px_28px_rgba(28,20,16,0.07)] ring-1 ring-black/[0.03]"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <div className="relative">
              <ProductImage
                product={product}
                className="aspect-[4/3.2] w-full"
                sizes="(max-width: 448px) 45vw, 200px"
              />
              {badge ? (
                <span
                  className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white ${
                    badge.tone === 'red'
                      ? 'bg-[var(--gp-red)]'
                      : badge.tone === 'yellow'
                        ? 'bg-[var(--gp-yellow)] text-[var(--gp-ink)]'
                        : 'bg-[var(--gp-charcoal)]'
                  }`}
                >
                  {badge.label}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
              <h2 className="line-clamp-2 text-[13px] font-extrabold leading-snug text-[var(--gp-ink)]">
                {product.name}
              </h2>
              {product.description ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--gp-muted)]">
                  {product.description}
                </p>
              ) : null}
              <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                <div>
                  <p className="text-sm font-extrabold text-[var(--gp-ink)]">
                    {formatUsd(Number(product.price_usd))}
                  </p>
                  {settings ? (
                    <p className="text-[10px] font-semibold text-[var(--gp-muted)]">
                      {formatBs(Number(product.price_usd), settings.rate_bs)}
                    </p>
                  ) : null}
                </div>
                <AddButton
                  product={product}
                  added={addedId === product.id}
                  disabled={storeClosed}
                  onClick={() => onAdd(product)}
                />
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function MenuProductList({
  products,
  settings,
  addedId,
  storeClosed,
  onAdd,
}: {
  products: Product[]
  settings: StoreSettings | null
  addedId: string | null
  storeClosed?: boolean
  onAdd: (product: Product) => void
}) {
  return (
    <div className="space-y-3">
      {products.map((product, index) => {
        const badge = productBadge(product, index)
        return (
          <article
            key={product.id}
            className="gp-fade-in flex gap-3 overflow-hidden rounded-[1.35rem] bg-white p-2.5 shadow-[0_10px_28px_rgba(28,20,16,0.07)] ring-1 ring-black/[0.03]"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <div className="relative h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-2xl">
              <ProductImage
                product={product}
                className="h-full w-full"
                sizes="92px"
              />
              {badge ? (
                <span className="absolute left-1.5 top-1.5 rounded bg-[var(--gp-red)] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white">
                  {badge.label}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1">
              <h2 className="font-extrabold leading-snug text-[var(--gp-ink)]">
                {product.name}
              </h2>
              {product.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-[var(--gp-muted)]">
                  {product.description}
                </p>
              ) : null}
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <div>
                  <p className="text-sm font-extrabold text-[var(--gp-ink)]">
                    {formatUsd(Number(product.price_usd))}
                  </p>
                  {settings ? (
                    <p className="text-[10px] font-semibold text-[var(--gp-muted)]">
                      {formatBs(Number(product.price_usd), settings.rate_bs)}
                    </p>
                  ) : null}
                </div>
                <AddButton
                  product={product}
                  added={addedId === product.id}
                  disabled={storeClosed}
                  onClick={() => onAdd(product)}
                />
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
