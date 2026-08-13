'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { useLiveQuery } from 'dexie-react-hooks'
import { ensureSeeded } from '@/data/local/seed-database'
import { playAudio } from '@/lib/audio/speech-synthesis'
import { applyReviewGrade, type ReviewGrade } from '@/lib/review/fsrs-scheduler'
import { putCardLocally } from '@/lib/sync/local-mutations'
import { captureLearnerEvent } from '@/lib/learning/events'

import { getSentenceReviewQueue } from '@/data/local/learning-service'
import { ReviewSurface } from '@/components/review/review-surface'
import { AsyncState } from '@/components/ui/async-state'
import { cacheAheadContent } from '@/lib/content/cache-content'

export default function ReviewPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    void ensureSeeded()
      .then(cacheAheadContent)
      .catch(() => setError('Review content could not be loaded. Reconnect and reload to restore synced cards.'))
      .finally(() => setContentReady(true))
  }, [])

  const queue = useLiveQuery(async () => {
    return getSentenceReviewQueue()
  }, []) ?? []
  const resolvedQueue = queue.filter((item) => item.content !== null)
  const unresolvedCount = queue.length - resolvedQueue.length

  const currentItem = resolvedQueue[activeIndex] ?? null
  const currentSentence = currentItem?.content ?? null

  useEffect(() => {
    setIsRevealed(false)
    if (resolvedQueue.length === 0) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((previous) => Math.min(previous, resolvedQueue.length - 1))
  }, [resolvedQueue.length])

  const handlePlay = async () => {
    if (!currentSentence) return
    const text = currentSentence.spokenForm ?? currentSentence.audioText
    setError(null)
    try { await playAudio(text, isRevealed ? 1 : 0.72); await captureLearnerEvent('audio_played', { entityId: currentSentence.id }) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Audio playback failed.') }
  }

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentItem) return

    const { card: updatedCard } = applyReviewGrade(currentItem, grade)
    try {
      await putCardLocally(updatedCard)
      await captureLearnerEvent('review_graded', { entityId: currentItem.id, grade })
      setError(null)
    } catch { setError('Your grade could not be saved. The card remains in the queue; please try again.'); return }

    setIsRevealed(false)
    setActiveIndex((previous) => {
      if (resolvedQueue.length <= 1) return 0
      return previous + 1 >= resolvedQueue.length ? 0 : previous + 1
    })
  }

  return (
    <AppShell title="Review your words">
      <div className="screen-stack">
        <ScreenCard className="review-card">
          {!contentReady ? (
            <AsyncState kind="loading" title="Loading review content" detail="Preparing your local sentence library…" />
          ) : unresolvedCount > 0 && resolvedQueue.length === 0 ? (
            <AsyncState kind="error" title="Review content is unavailable" detail={`${unresolvedCount} due ${unresolvedCount === 1 ? 'card refers' : 'cards refer'} to sentence content that is not cached on this device. Reconnect and reload to restore it.`} />
          ) : !currentItem || !currentSentence ? (
            <AsyncState kind="empty" title="No cards due yet" detail="Save a sentence from the reading flow to start your review queue." action={<Link href="/reader" className="primary-button">Open reader</Link>} />
          ) : (
            <>
              <div className="review-progress">
                <span>
                  Card {activeIndex + 1} of {resolvedQueue.length}
                </span>
                  <span>{Math.round(((activeIndex + 1) / resolvedQueue.length) * 100)}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${((activeIndex + 1) / resolvedQueue.length) * 100}%` }} />
              </div>

              <ReviewSurface
                label="French sentence"
                answer={currentSentence.french}
                translation={currentSentence.english}
                front={<><h2 aria-label="Target phrase hidden">{currentSentence.targetText ? currentSentence.french.replace(currentSentence.targetText, '••••••') : 'Listen carefully. The French sentence is hidden until reveal.'}</h2><p className="mt-2 text-sm text-muted-foreground">Hear it once, then say it out loud before you reveal the answer.</p></>}
                revealed={isRevealed}
                onReveal={() => setIsRevealed((value) => !value)}
                onPlay={handlePlay}
                onGrade={handleGrade}
              />
              {error && <p role="alert" className="mt-3 text-center text-sm text-red-700">{error}</p>}
            </>
          )}
        </ScreenCard>

        <ScreenHeading
          eyebrow="UP NEXT"
          title={resolvedQueue.length > 0 ? `${resolvedQueue.length} cards ready${unresolvedCount > 0 ? ` · ${unresolvedCount} restoring` : ''}` : unresolvedCount > 0 ? `${unresolvedCount} cards need content` : 'No cards queued'}
        />
      </div>
    </AppShell>
  )
}
