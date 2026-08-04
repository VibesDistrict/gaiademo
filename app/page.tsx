'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/cart'
import { useStoreSettings } from '@/lib/settings-context'
import { isLoyaltyActive } from '@/lib/loyalty'
import { MENU_CATEGORIES, type MenuCategoryId } from '@/lib/brand'
import type { Product } from '@/lib/types'
import { HeroCarousel } from '@/components/menu/HeroCarousel'
import { HomeSearch } from '@/components/menu/HomeSearch'
import { CategoryChips } from '@/components/menu/CategoryChips'
import { PromoBanner } from '@/components/menu/PromoBanner'
import { LoyaltyHomeTeaser } from '@/components/loyalty/LoyaltyHomeTeaser'
import { SponsoredPromo } from '@/components/menu/SponsoredPromo'
import { MenuSkeleton } from '@/components/menu/Skeleton'
import {
  MenuProductGrid,
  MenuProductList,
  getStoredMenuView,
  storeMenuView,
  type MenuView,
} from '@/components/menu/MenuProducts'

export default function HomePage() {
  const { addItem, itemCount } = useCart()
  const { settings } = useStoreSettings()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [view, setView] = useState<MenuView>('grid')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MenuCategoryId>('all')
  const [rewardProductName, setRewardProductName] = useState<string | null>(null)

  const loyaltyActive = settings ? isLoyaltyActive(settings) : false

  useEffect(() => {
    if (!settings?.loyalty_reward_product_id) {
      setRewardProductName(null)
      return
    }
    let active = true
    supabase
      .from('products')
      .select('name')
      .eq('id', settings.loyalty_reward_product_id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRewardProductName(data?.name ?? null)
      })
    return () => {
      active = false
    }
  }, [settings?.loyalty_reward_product_id])

  useEffect(() => {
    setView(getStoredMenuView())
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const productsRes = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (productsRes.error) {
        setError(productsRes.error.message)
        setProducts([])
      } else {
        setProducts((productsRes.data as Product[]) ?? [])
      }
      setLoading(false)
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const cat = MENU_CATEGORIES.find((c) => c.id === category)
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const text = `${p.name} ${p.description}`.toLowerCase()
      const matchesQuery = !q || text.includes(q)
      const matchesCat =
        !cat || cat.id === 'all' || cat.match(p.name, p.description)
      return matchesQuery && matchesCat
    })
  }, [products, query, category])

  function handleViewChange(next: MenuView) {
    setView(next)
    storeMenuView(next)
  }

  function handleAdd(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      unitPriceUsd: Number(product.price_usd),
    })
    setAddedId(product.id)
    window.setTimeout(() => setAddedId(null), 900)
  }

  return (
    <div className="space-y-5">
      <HomeSearch value={query} onChange={setQuery} />

      <HeroCarousel
        openHours={settings?.open_hours}
        storeClosed={settings?.store_closed}
      />

      <CategoryChips active={category} onChange={setCategory} />

      {loyaltyActive ? (
        <LoyaltyHomeTeaser
          settings={settings}
          rewardProductName={rewardProductName}
        />
      ) : null}

      <SponsoredPromo settings={settings} />

      <section id="menu" className="scroll-mt-24 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[1.45rem] text-[var(--gp-ink)]">
              Especiales Gaia
            </h2>
            <p className="text-xs font-semibold text-[var(--gp-muted)]">
              Frescas · italianas · listas para ti
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewChange(view === 'grid' ? 'list' : 'grid')}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--gp-red)] shadow-sm ring-1 ring-black/[0.04]"
            >
              {view === 'grid' ? 'Lista' : 'Grid'}
            </button>
            {itemCount > 0 ? (
              <Link
                href="/cart"
                className="rounded-full bg-[var(--gp-red)] px-3 py-1.5 text-[11px] font-bold text-white"
              >
                Carrito ({itemCount})
              </Link>
            ) : null}
          </div>
        </div>

        {loading ? (
          <MenuSkeleton view={view} />
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">No se pudo cargar el menú</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs">
              Ejecuta <code className="rounded bg-white px-1">supabase/schema.sql</code> en
              Supabase.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-[var(--gp-muted)] shadow-sm">
            No hay platos en esta categoría. Prueba otra o limpia la búsqueda.
          </p>
        ) : view === 'grid' ? (
          <MenuProductGrid
            products={filtered}
            settings={settings}
            addedId={addedId}
            storeClosed={settings?.store_closed}
            onAdd={handleAdd}
          />
        ) : (
          <MenuProductList
            products={filtered}
            settings={settings}
            addedId={addedId}
            storeClosed={settings?.store_closed}
            onAdd={handleAdd}
          />
        )}
      </section>

      <PromoBanner />
    </div>
  )
}
