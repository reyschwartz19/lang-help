'use client'

import { useEffect, useState } from 'react'
import { AsyncState } from '@/components/ui/async-state'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  if (!offline) return null
  return <div className="mb-4 rounded-2xl border border-border bg-muted py-1"><AsyncState kind="offline" title="Working offline" detail="Your saved content and local progress remain available. Sync will resume when you reconnect." /></div>
}
