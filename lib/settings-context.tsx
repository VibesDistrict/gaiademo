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
import {
  fetchLiveBcvRate,
  fetchStoreSettings,
  fetchStoreSettingsBase,
  normalizeStoreSettings,
} from '@/lib/settings'
import type { StoreSettings } from '@/lib/types'

const CACHE_KEY = 'td-settings-cache-v3'
const BCV_REFRESH_MS = 30 * 60 * 1000

type SettingsContextValue = {
  settings: StoreSettings | null
  loading: boolean
  refresh: () => Promise<StoreSettings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function readCachedSettings(): StoreSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return normalizeStoreSettings(JSON.parse(raw) as Partial<StoreSettings>)
  } catch {
    return null
  }
}

function writeCachedSettings(settings: StoreSettings) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(settings))
  } catch {
    // ignore quota errors
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const next = await fetchStoreSettings()
    setSettings(next)
    writeCachedSettings(next)
    setLoading(false)
    return next
  }, [])

  useEffect(() => {
    let active = true

    const cached = readCachedSettings()
    if (cached) {
      setSettings(cached)
      setLoading(false)
    }

    async function load() {
      try {
        const base = await fetchStoreSettingsBase()
        if (!active) return
        setSettings(base)
        writeCachedSettings(base)
        setLoading(false)

        if (!base.auto_bcv_rate) return

        const live = await fetchLiveBcvRate()
        if (!active || !live) return

        const withLiveRate: StoreSettings = {
          ...base,
          rate_bs: live.rate,
          rate_bs_updated_at: live.updatedAt || base.rate_bs_updated_at,
        }
        setSettings(withLiveRate)
        writeCachedSettings(withLiveRate)
      } catch {
        if (active) setLoading(false)
      }
    }

    void load()

    const interval = window.setInterval(() => {
      void (async () => {
        if (!active) return
        try {
          const base = await fetchStoreSettingsBase()
          if (!active || !base.auto_bcv_rate) return

          const live = await fetchLiveBcvRate()
          if (!active || !live) return

          const withLiveRate: StoreSettings = {
            ...base,
            rate_bs: live.rate,
            rate_bs_updated_at: live.updatedAt || base.rate_bs_updated_at,
          }
          setSettings(withLiveRate)
          writeCachedSettings(withLiveRate)
        } catch {
          // ignore background refresh errors
        }
      })()
    }, BCV_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const value = useMemo(
    () => ({ settings, loading, refresh }),
    [settings, loading, refresh]
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}

export function useStoreSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useStoreSettings debe usarse dentro de SettingsProvider')
  }
  return ctx
}
