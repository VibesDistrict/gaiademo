'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Fulfillment } from '@/lib/types'

const STORAGE_KEY = 'gaiapasta-cart-v1'

interface CartState {
  items: CartItem[]
  fulfillment: Fulfillment
  address: string
  notes: string
}

interface CartContextValue extends CartState {
  hydrated: boolean
  itemCount: number
  subtotalUsd: number
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setFulfillment: (value: Fulfillment) => void
  setAddress: (value: string) => void
  setNotes: (value: string) => void
}

const CartContext = createContext<CartContextValue | null>(null)

const defaultState: CartState = {
  items: [],
  fulfillment: 'pickup',
  address: '',
  notes: '',
}

function loadState(): CartState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return defaultState
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(defaultState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setState(loadState())
      setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const addItem = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setState((prev) => {
      const existing = prev.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === item.productId
              ? { ...i, qty: i.qty + qty }
              : i
          ),
        }
      }
      return {
        ...prev,
        items: [...prev.items, { ...item, qty }],
      }
    })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    setState((prev) => ({
      ...prev,
      items:
        qty <= 0
          ? prev.items.filter((i) => i.productId !== productId)
          : prev.items.map((i) =>
              i.productId === productId ? { ...i, qty } : i
            ),
    }))
  }, [])

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
    }))
  }, [])

  const clearCart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [],
      notes: '',
    }))
  }, [])

  const setFulfillment = useCallback((fulfillment: Fulfillment) => {
    setState((prev) => ({ ...prev, fulfillment }))
  }, [])

  const setAddress = useCallback((address: string) => {
    setState((prev) => ({ ...prev, address }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setState((prev) => ({ ...prev, notes }))
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const subtotalUsd = state.items.reduce(
      (sum, item) => sum + item.unitPriceUsd * item.qty,
      0
    )
    const itemCount = state.items.reduce((sum, item) => sum + item.qty, 0)
    return {
      ...state,
      hydrated,
      itemCount,
      subtotalUsd,
      addItem,
      setQty,
      removeItem,
      clearCart,
      setFulfillment,
      setAddress,
      setNotes,
    }
  }, [
    state,
    hydrated,
    addItem,
    setQty,
    removeItem,
    clearCart,
    setFulfillment,
    setAddress,
    setNotes,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
