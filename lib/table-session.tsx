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
import type { RestaurantTable } from '@/lib/types'

const STORAGE_KEY = 'gaiapasta-table-session-v1'

type TableSession = Pick<RestaurantTable, 'id' | 'number' | 'code' | 'label'>

interface TableSessionContextValue {
  table: TableSession | null
  hydrated: boolean
  setTable: (table: TableSession) => void
  clearTable: () => void
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null)

function loadSession(): TableSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TableSession
  } catch {
    return null
  }
}

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [table, setTableState] = useState<TableSession | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setTableState(loadSession())
      setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [])

  const setTable = useCallback((next: TableSession) => {
    setTableState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const clearTable = useCallback(() => {
    setTableState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ table, hydrated, setTable, clearTable }),
    [table, hydrated, setTable, clearTable]
  )

  return (
    <TableSessionContext.Provider value={value}>
      {children}
    </TableSessionContext.Provider>
  )
}

export function useTableSession() {
  const ctx = useContext(TableSessionContext)
  if (!ctx) {
    throw new Error('useTableSession debe usarse dentro de TableSessionProvider')
  }
  return ctx
}
