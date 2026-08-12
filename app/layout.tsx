import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AutoSync } from '@/components/sync/auto-sync'
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration'

export const metadata: Metadata = {
  title: 'parlez — Learn French at your own pace',
  description: 'A simple, joyful way to make progress in French, one small step at a time.',
  applicationName: 'Parlez',
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-192.png', sizes: '192x192' }], apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f7fb',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        {children}
        <AutoSync />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
