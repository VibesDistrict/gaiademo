'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { CartProvider } from '@/lib/cart'
import { CartAnimationProvider } from '@/lib/cart-animation'
import { SettingsProvider } from '@/lib/settings-context'
import { TableSessionProvider } from '@/lib/table-session'
import { AppShell } from '@/components/layout/AppShell'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TableSessionProvider>
        <CartProvider>
          <CartAnimationProvider>
            <SettingsProvider>
              <AppShell>{children}</AppShell>
            </SettingsProvider>
          </CartAnimationProvider>
        </CartProvider>
      </TableSessionProvider>
    </AuthProvider>
  )
}
