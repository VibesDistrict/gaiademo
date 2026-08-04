'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { useCartAnimation } from '@/lib/cart-animation'
import { springSnappy } from '@/lib/motion'

type NavItem = {
  href: string
  label: string
  match: (path: string) => boolean
  icon: (active: boolean) => ReactNode
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.6 : 1.8} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  )
}

function IconCart({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2" />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconOffers({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.6 : 1.8} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 14.09 8.26 20 9.27l-4.5 4.13L16.18 19 12 16.77 7.82 19l.68-5.6L4 9.27l5.91-1.01L12 3Z" />
    </svg>
  )
}

function IconOrders({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
    </svg>
  )
}

const BASE_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Inicio',
    match: (path) => path === '/',
    icon: (active) => <IconHome active={active} />,
  },
  {
    href: '/cart',
    label: 'Carrito',
    match: (path) => path.startsWith('/cart') || path.startsWith('/checkout'),
    icon: (active) => <IconCart active={active} />,
  },
  {
    href: '/sugerencias',
    label: 'Ofertas',
    match: (path) => path.startsWith('/sugerencias'),
    icon: (active) => <IconOffers active={active} />,
  },
  {
    href: '/orders',
    label: 'Pedidos',
    match: (path) => path.startsWith('/orders'),
    icon: (active) => <IconOrders active={active} />,
  },
  {
    href: '/cuenta',
    label: 'Cuenta',
    match: (path) =>
      path.startsWith('/cuenta') ||
      path.startsWith('/auth') ||
      path.startsWith('/admin'),
    icon: (active) => <IconUser active={active} />,
  },
]

export function AppBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const { profile } = useAuth()
  const { cartTargetRef, bumpToken } = useCartAnimation()

  const items = BASE_ITEMS.map((item) =>
    item.href === '/cuenta' && profile?.role === 'admin'
      ? { ...item, href: '/admin', label: 'Caja' }
      : item
  )

  if (pathname.startsWith('/auth')) return null

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Navegación principal"
    >
      <div className="pointer-events-auto relative grid grid-cols-5 items-end rounded-[1.6rem] border border-black/[0.04] bg-white/96 px-1 py-2 shadow-[0_16px_40px_rgba(28,20,16,0.14)] backdrop-blur-md">
        {items.map((item) => {
          const active = item.match(pathname)
          const showBadge = item.label === 'Carrito' && itemCount > 0

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 transition ${
                active ? 'text-[var(--gp-red)]' : 'text-[var(--gp-muted)]'
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
                  active ? 'bg-[var(--gp-red)]/10' : ''
                }`}
              >
                {item.icon(active)}
                {showBadge ? (
                  <motion.span
                    ref={cartTargetRef}
                    key={bumpToken}
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={springSnappy}
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gp-yellow)] px-1 text-[9px] font-extrabold text-[var(--gp-ink)]"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                ) : null}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  active ? 'text-[var(--gp-red)]' : 'text-[var(--gp-muted)]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
