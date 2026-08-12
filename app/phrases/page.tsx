'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Search, Volume2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'

import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { db, type Card, type PhraseBank } from '@/data/local/database'
import { ensureSeeded } from '@/data/local/seed-database'
import { playAudio } from '@/lib/audio/speech-synthesis'
import { applyReviewGrade, getReviewQueue, reviewGrades, type ReviewGrade } from '@/lib/review/fsrs-scheduler'

type PhraseReviewRow = Card & { phrase: PhraseBank | null }

const categoryTone: Record<string, string> = {
  greeting: 'coral',
  buying_time: 'mint',
  repair: 'yellow',
  opinion: 'coral',
}

function PhraseFlashcard({
  phrase,
  isRevealed,
  onReveal,
  onPlay,
  onGrade,
}: {
  phrase: PhraseBank
  isRevealed: boolean
  onReveal: () => void
  onPlay: () => void
  onGrade: (grade: ReviewGrade) => void
}) {
  return (
    <>
      <div className="flashcard">
        <p className="eyebrow">{isRevealed ? 'ENGLISH' : 'FRENCH'}</p>

        {isRevealed ? (
          <div className="answer">
            <strong>{phrase.english}</strong>
            <span>{phrase.french}</span>
          </div>
        ) : (
          <>
            <h2>{phrase.french}</h2>
            <p className="text-sm text-slate-500 mt-2">
              Hear it once, then say it out loud before you reveal the answer.
            </p>
          </>
        )}

        <button className="sound-button" aria-label="Listen to review phrase" onClick={onPlay}>
          <Volume2 size={20} />
        </button>
      </div>

      <button className="secondary-button full" onClick={onReveal}>
        {isRevealed ? 'Hide answer' : 'Reveal answer'} <ArrowRight size={16} />
      </button>

      {isRevealed && (
        <div className="review-actions">
          {reviewGrades.map(({ key, label }, index) => (
            <button
              key={key}
              className={`pill-button ${index === 2 || index === 3 ? 'primary-pill' : ''}`}
              onClick={() => onGrade(key)}
            >
              {index === 0 && <Check size={16} />}
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default function PhrasesPage() {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    ensureSeeded()
  }, [])

  const phraseBank = useLiveQuery(async () => {
    return (await db.phraseBank.orderBy('category').toArray()) as PhraseBank[]
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
      label,
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
            group.label.toLowerCase().includes(normalized)
          )
        }),
      }))
      .filter((group) => group.phrases.length > 0)
  }, [query, phraseGroups])

  const queue = useLiveQuery(async () => {
    const rows = await db.cards.filter((card) => card.type === 'phrase').toArray()
    const dueCards = getReviewQueue(rows)

    if (dueCards.length === 0) {
      return [] as PhraseReviewRow[]
    }

    const phraseIds = [...new Set(dueCards.map((card) => card.sentenceId))]
    const phrases = await db.phraseBank.where('id').anyOf(phraseIds).toArray()
    const phraseMap = new Map(phrases.map((phrase) => [phrase.id, phrase]))

    return dueCards.map((card) => ({
      ...card,
      phrase: phraseMap.get(card.sentenceId) ?? null,
    }))
  }, []) ?? []

  const currentItem = queue[activeIndex] ?? null
  const currentPhrase = currentItem?.phrase ?? null

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
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center gap-4 px-6">
              <p className="eyebrow">READY WHEN YOU ARE</p>
              <h3 className="text-2xl font-semibold text-slate-800">No phrase cards due yet.</h3>
              <p className="max-w-sm text-sm text-slate-500">
                Browse your phrase bank and keep reviewing once a phrase is ready.
              </p>
            </div>
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

              <PhraseFlashcard
                phrase={currentPhrase}
                isRevealed={isRevealed}
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
                    <span>{phrase.english}</span>
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
