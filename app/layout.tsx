import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Dancing_Script, DM_Sans } from 'next/font/google'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

const body = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const script = Dancing_Script({
  variable: '--font-script',
  subsets: ['latin'],
  weight: ['600', '700'],
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gaia-demo.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Gaia Pasta | Pedidos',
  description:
    'Pide en Gaia Pasta: Dinner In por QR, delivery o pick up. Paga con pago móvil, tarjeta o Binance.',
  applicationName: 'Gaia Pasta',
  openGraph: {
    title: 'Gaia Pasta | Pedidos',
    description:
      'Pide en Gaia Pasta: Dinner In por QR, delivery o pick up. Paga con pago móvil, tarjeta o Binance.',
    url: siteUrl,
    siteName: 'Gaia Pasta',
    locale: 'es_VE',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Gaia Pasta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gaia Pasta | Pedidos',
    description:
      'Pide en Gaia Pasta: Dinner In por QR, delivery o pick up.',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${script.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
