'use client'
import { BookOpen, Clock3, Mic2, Target } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { getProgressSummary } from '@/data/local/learning-service'

export default function ProgressPage() {
  const progress = useLiveQuery(async () => {
    return getProgressSummary()
  }, [])
  const metrics = progress?.metrics
  const stats = [
    { label: 'Words known', value: progress?.wordsKnown ?? 0, icon: Target },
    { label: 'Phrases known', value: progress?.phrasesKnown ?? 0, icon: Target },
    { label: 'Stories completed', value: metrics?.storiesCompleted ?? 0, icon: BookOpen },
    { label: 'Listening minutes', value: metrics?.listeningMinutes ?? 0, icon: Clock3 },
    { label: 'Speaking sessions', value: metrics?.speakingSessions ?? 0, icon: Mic2 },
  ]
  return <AppShell title="Your progress"><div className="screen-stack"><div className="stats-grid">{stats.map(({ label, value, icon: Icon }) => <ScreenCard key={label}><Icon className="stat-icon" size={20} /><p className="eyebrow">{label}</p><strong className="stat-value">{value}</strong><span className="stat-detail">{label.includes('known') ? 'Cards with at least 21 days stability' : 'Recorded learning activity'}</span></ScreenCard>)}</div><ScreenCard><ScreenHeading eyebrow="REVIEW OUTCOMES" title={metrics?.reviewAccuracy === null || metrics === undefined ? 'No graded reviews yet' : `${metrics.reviewAccuracy}% successful recall`} /><p className="screen-copy">{metrics?.reviewCount ? `Based on ${metrics.reviewCount} real grades. Good and Easy count as successful recall.` : 'Complete sentence reviews to calculate accuracy.'}</p></ScreenCard><ScreenCard><ScreenHeading eyebrow="TRANSPARENT CEFR ESTIMATE" title={progress?.cefr.level ?? 'Not enough evidence yet'} /><p className="screen-copy">{progress?.cefr.explanation ?? 'Complete at least five measured activities before an estimate appears. No level is guessed from account defaults.'}</p></ScreenCard></div></AppShell>
}
