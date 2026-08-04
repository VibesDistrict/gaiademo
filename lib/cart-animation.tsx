'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/lib/motion'
import { hapticLight } from '@/lib/haptics'

type FlyItem = {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  imageUrl?: string
}

type CartAnimationContextValue = {
  cartTargetRef: RefObject<HTMLSpanElement | null>
  bumpToken: number
  flyToCart: (from: DOMRect, imageUrl?: string) => void
  bumpCart: () => void
}

const CartAnimationContext = createContext<CartAnimationContextValue | null>(null)

function FlyOverlay({
  items,
  onDone,
}: {
  items: FlyItem[]
  onDone: (id: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || items.length === 0 || typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="fixed z-[60] h-10 w-10 overflow-hidden rounded-full bg-[var(--gp-red)] shadow-[0_8px_20px_rgba(227,27,35,0.35)] ring-2 ring-white"
            style={{ left: item.startX - 20, top: item.startY - 20 }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              left: item.endX - 14,
              top: item.endY - 14,
              scale: 0.35,
              opacity: 0.85,
            }}
            exit={{ opacity: 0, scale: 0.2 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => onDone(item.id)}
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                +
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

export function CartAnimationProvider({ children }: { children: ReactNode }) {
  const cartTargetRef = useRef<HTMLSpanElement | null>(null)
  const [flyItems, setFlyItems] = useState<FlyItem[]>([])
  const [bumpToken, setBumpToken] = useState(0)
  const reducedMotion = useReducedMotion()

  const bumpCart = useCallback(() => {
    setBumpToken((n) => n + 1)
  }, [])

  const flyToCart = useCallback(
    (from: DOMRect, imageUrl?: string) => {
      hapticLight()
      if (reducedMotion) {
        bumpCart()
        return
      }

      const target = cartTargetRef.current?.getBoundingClientRect()
      if (!target) {
        bumpCart()
        return
      }

      const id = crypto.randomUUID()
      setFlyItems((prev) => [
        ...prev,
        {
          id,
          startX: from.left + from.width / 2,
          startY: from.top + from.height / 2,
          endX: target.left + target.width / 2,
          endY: target.top + target.height / 2,
          imageUrl,
        },
      ])
    },
    [bumpCart, reducedMotion]
  )

  const handleFlyDone = useCallback(
    (id: string) => {
      setFlyItems((prev) => prev.filter((item) => item.id !== id))
      bumpCart()
    },
    [bumpCart]
  )

  return (
    <CartAnimationContext.Provider
      value={{ cartTargetRef, bumpToken, flyToCart, bumpCart }}
    >
      {children}
      <FlyOverlay items={flyItems} onDone={handleFlyDone} />
    </CartAnimationContext.Provider>
  )
}

export function useCartAnimation() {
  const ctx = useContext(CartAnimationContext)
  if (!ctx) {
    throw new Error('useCartAnimation debe usarse dentro de CartAnimationProvider')
  }
  return ctx
}
