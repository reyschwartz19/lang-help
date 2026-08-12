'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Volume2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'

import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { db, type PhraseBank } from '@/data/local/database'
import { ensureSeeded } from '@/data/local/seed-database'
import { playAudio } from '@/lib/audio/speech-synthesis'
import { captureLearnerEvent } from '@/lib/learning/events'
import { applyReviewGrade, type ReviewGrade } from '@/lib/review/fsrs-scheduler'
import { getPhraseReviewQueue } from '@/data/local/learning-service'
import { ReviewSurface } from '@/components/review/review-surface'
import { AsyncState } from '@/components/ui/async-state'

const categoryTone: Record<string, string> = {
  greeting: 'coral',
  buying_time: 'mint',
  repair: 'yellow',
  opinion: 'coral',
}

const categoryLabels: Record<string, string> = {
  greeting: 'Greetings & farewells', buying_time: 'Buying time', repair: 'Conversation repair',
  reactions: 'Reactions & acknowledgement', opinion: 'Opinions & agreement', questions: 'Questions & follow-ups',
  connecting: 'Connecting ideas', self: 'Talking about yourself', routines: 'Routines & experiences',
  plans: 'Plans, wants & ability', time_quantity: 'Time, frequency & quantity', requests: 'Requests, offers & permission',
  food_shopping: 'Food, cafés & shopping', transport: 'Transport & directions', work_study: 'Work & university',
  social: 'Social plans',
}

export default function PhrasesPage() {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    ensureSeeded()
  }, [])

  const phraseBank = useLiveQuery(async () => {
    const phrases = (await db.phraseBank.toArray()) as PhraseBank[]
    return phrases.sort((a, b) => a.priority - b.priority || a.level.localeCompare(b.level) || a.category.localeCompare(b.category))
  }, [])

  const phraseGroups = useMemo(() => {
    const groups = new Map<string, PhraseBank[]>()

    for (const phrase of phraseBank ?? []) {
      const key = phrase.category
      const bucket = groups.get(key) ?? []
      bucket.push(phrase)
      groups.set(key, bucket)
    }

    return Array.from(groups.entries()).map(([label, items]) => ({
      label: categoryLabels[label] ?? label,
      category: label,
      tone: categoryTone[label] ?? 'coral',
      phrases: items,
    }))
  }, [phraseBank])

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return phraseGroups
      .map((group) => ({
        ...group,
        phrases: group.phrases.filter((phrase) => {
          if (!normalized) return true

          return (
            phrase.french.toLowerCase().includes(normalized) ||
            phrase.english.toLowerCase().includes(normalized) ||
            group.label.toLowerCase().includes(normalized) ||
            phrase.level.toLowerCase().includes(normalized)
          )
        }),
      }))
      .filter((group) => group.phrases.length > 0)
  }, [query, phraseGroups])

  const queue = useLiveQuery(async () => {
    return getPhraseReviewQueue()
  }, []) ?? []

  const currentItem = queue[activeIndex] ?? null
  const currentPhrase = currentItem?.content ?? null

  useEffect(() => {
    setIsRevealed(false)
    if (queue.length === 0) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((previous) => Math.min(previous, queue.length - 1))
  }, [queue.length])

  const handlePlay = () => {
    if (!currentPhrase) return
    playAudio(currentPhrase.french, isRevealed ? 1 : 0.72)
  }

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentItem) return

    const { card: updatedCard } = applyReviewGrade(currentItem, grade)
    await db.cards.put(updatedCard)
    await captureLearnerEvent('review_graded', {
      entityId: currentPhrase?.id ?? currentItem.sentenceId,
      grade,
      metadata: { contentType: 'phrase' },
    })

    setIsRevealed(false)
    setActiveIndex((previous) => {
      if (queue.length <= 1) return 0
      return previous + 1 >= queue.length ? 0 : previous + 1
    })
  }

  return (
    <AppShell title="Phrase bank">
      <div className="screen-stack">
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search phrases"
            aria-label="Search phrases"
          />
        </div>

        <ScreenCard className="review-card">
          {!currentItem || !currentPhrase ? (
            <AsyncState kind="empty" title="No phrase cards due yet" detail="Browse your phrase bank and return when a phrase is ready." />
          ) : (
            <>
              <div className="review-progress">
                <span>
                  Phrase {activeIndex + 1} of {queue.length}
                </span>
                <span>{Math.round(((activeIndex + 1) / queue.length) * 100)}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${((activeIndex + 1) / queue.length) * 100}%` }} />
              </div>

              <ReviewSurface
                label="French phrase"
                answer={currentPhrase.french}
                translation={currentPhrase.english}
                front={<><h2>{currentPhrase.french}</h2><p className="mt-2 text-sm text-muted-foreground">Hear it once, then say it out loud before you reveal the answer.</p></>}
                revealed={isRevealed}
                onReveal={() => setIsRevealed((value) => !value)}
                onPlay={handlePlay}
                onGrade={handleGrade}
              />
            </>
          )}
        </ScreenCard>

        <ScreenHeading
          eyebrow="COLLECTIONS"
          title={filteredGroups.length > 0 ? `${filteredGroups.length} categories` : 'No matches'}
        />

        {filteredGroups.length === 0 ? (
          <ScreenCard className="flex min-h-[120px] items-center justify-center text-center">
            <div>
              <p className="eyebrow">NO RESULTS</p>
              <p className="text-sm text-slate-500">Try another search term in your phrase bank.</p>
            </div>
          </ScreenCard>
        ) : (
          filteredGroups.map((group) => (
            <section className="section-block" key={group.label}>
              <ScreenHeading eyebrow="CATEGORY" title={group.label} />

              {group.phrases.map((phrase) => (
                <ScreenCard className={`phrase-row ${categoryTone[phrase.category] ?? 'coral'}`} key={phrase.id}>
                  <div>
                    <strong>{phrase.french}</strong>
                    <span>{phrase.english} · {phrase.level} · Priority {phrase.priority}</span>
                  </div>

                  <div className="phrase-row-actions">
                    <button aria-label={`Play ${phrase.french}`} onClick={() => playAudio(phrase.french)}>
                      <Volume2 size={17} />
                    </button>
                  </div>
                </ScreenCard>
              ))}
            </section>
          ))
        )}
      </div>
    </AppShell>
  )
}
