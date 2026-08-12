'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Headphones, Layers3, MessageSquareText, Mic2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { db } from '@/data/local/database'
import { ensureSeeded } from '@/data/local/seed-database'
import { deriveMetrics } from '@/lib/learning/events'
import { getReviewQueue } from '@/lib/review/fsrs-scheduler'
import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => { void ensureSeeded() }, [])
  const data = useLiveQuery(async () => {
    const [cards, events, stories, progress] = await Promise.all([db.cards.toArray(), db.learnerEvents.toArray(), db.stories.toArray(), db.readingProgress.toArray()])
    const dueSentenceCount = getReviewQueue(cards.filter(({ type }) => type === 'sentence')).length
    const nextProgress = progress.find(({ status, nextResurfaceAt }) => status !== 'mastered' && new Date(nextResurfaceAt) <= new Date())
    const story = nextProgress ? stories.find(({ id }) => id === nextProgress.storyId) : stories.find(({ id }) => !progress.some(({ storyId, status }) => storyId === id && status === 'mastered'))
    return { dueSentenceCount, metrics: deriveMetrics(events), story }
  }, [])
  return <AppShell title="Your French practice"><div className="content-grid"><div className="main-column">
    <section className="hero-card"><div className="hero-copy"><div className="mini-label">✦ LOCAL-FIRST PRACTICE</div><h2>Choose one useful<br /><em>French activity.</em></h2><p>Your reading, review, and speaking history is calculated from work saved on this device.</p><Link href="/reader" className="primary-button">Start reading <ArrowRight size={17} /></Link></div><div className="hero-art" aria-hidden="true"><div className="art-sun" /><div className="art-building building-back" /><div className="art-building building-front" /><div className="art-roof" /><div className="art-window w1" /><div className="art-window w2" /><div className="art-plant" /><div className="art-table" /><div className="art-book" /></div></section>
    <section className="section-block"><ScreenHeading eyebrow="PRACTICE" title="Choose your next activity" /><div className="activity-grid"><Link href="/reader" className="activity-card blue"><div className="activity-top"><div className="activity-icon"><Headphones size={21} /></div></div><strong>Read and listen</strong><p>{data?.story ? data.story.title : 'Bundled stories are available offline'}</p><span className="activity-arrow">→</span></Link><Link href="/speaking" className="activity-card pink"><div className="activity-top"><div className="activity-icon"><Mic2 size={21} /></div></div><strong>Speak out loud</strong><p>Record and compare a response</p><span className="activity-arrow">→</span></Link><Link href="/review" className="activity-card yellow"><div className="activity-top"><div className="activity-icon"><Layers3 size={21} /></div></div><strong>Sentence review</strong><p>{data ? `${data.dueSentenceCount} sentence cards due` : 'Checking your local queue…'}</p><span className="activity-arrow">→</span></Link><Link href="/handoff" className="activity-card blue"><div className="activity-top"><div className="activity-icon"><MessageSquareText size={21} /></div></div><strong>External chat handoff</strong><p>Build a prompt from recent practice</p><span className="activity-arrow">→</span></Link></div></section>
  </div><aside className="right-column"><ScreenCard><ScreenHeading eyebrow="RECORDED LOCALLY" title="Your activity" /><p className="screen-copy">{data?.metrics.reviewCount ?? 0} reviews · {data?.metrics.storiesCompleted ?? 0} stories · {data?.metrics.speakingSessions ?? 0} speaking sessions</p><Link href="/progress" className="secondary-button">See calculated progress <ArrowRight size={16} /></Link></ScreenCard><ScreenCard className="reading-card"><div className="reading-label"><BookOpen size={16} /> NEXT STORY</div><h3>{data?.story?.title ?? 'All bundled stories completed'}</h3><p>{data?.story ? 'Continue with the next story ready on this device.' : 'Completed stories will resurface on their scheduled dates.'}</p><Link href="/reader" className="secondary-button">Open reader <ArrowRight size={16} /></Link></ScreenCard></aside></div></AppShell>
}
