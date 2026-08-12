import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AutoSync } from '@/components/sync/auto-sync'

export const metadata: Metadata = {
  title: 'parlez — Learn French at your own pace',
  description: 'A simple, joyful way to make progress in French, one small step at a time.',
  applicationName: 'Parlez',
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
      </body>
    </html>
  )
}
