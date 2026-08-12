'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { getNextLocalSession } from '@/data/local/learning-service'
import { ensureSeeded } from '@/data/local/seed-database'

export default function LearnPage() {
  const [seedError, setSeedError] = useState<string | null>(null)

  useEffect(() => {
    void ensureSeeded().catch(() => setSeedError('Local learning data could not be prepared. Reload to try again.'))
  }, [])

  const session = useLiveQuery(async () => {
    return getNextLocalSession()
  }, [])
  return <AppShell title="Practice French"><div className="screen-stack"><ScreenCard><ScreenHeading eyebrow="NEXT LOCAL SESSION" title={session?.title ?? 'Preparing your session…'} /><p className="screen-copy">{session?.detail ?? 'Reading your local learning history.'}</p>{seedError && <p role="alert" className="mt-3 text-sm text-red-700">{seedError}</p>}{session && !seedError && <Link href={session.href} className="primary-button mt-5">Start session <ArrowRight size={16} /></Link>}</ScreenCard><p className="screen-copy">The next activity is selected from due reviews and passage resurfacing stored on this device. When nothing is due, Parlez recommends speaking practice.</p></div></AppShell>
}
