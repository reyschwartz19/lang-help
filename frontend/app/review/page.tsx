'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Check, Volume2 } from 'lucide-react'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/app-shell'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Card, type Sentence } from '@/data/db'
import { playAudio } from '@/lib/audio'
import { applyReviewGrade, getReviewQueue, reviewGrades, type ReviewGrade } from '@/lib/fsrs'
import { ensureSeeded } from '@/lib/seed'

type ReviewRow = Card & { sentence: Sentence | null }

function AudioFirstCard({
  sentence,
  isRevealed,
  onReveal,
  onPlay,
  onGrade,
}: {
  sentence: Sentence
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
            <strong>{sentence.english}</strong>
            <span>{sentence.french}</span>
          </div>
        ) : (
          <>
            <h2>{sentence.french}</h2>
            <p className="text-sm text-slate-500 mt-2">
              Hear it once, then say it out loud before you reveal the answer.
            </p>
          </>
        )}

        <button className="sound-button" aria-label="Listen to review sentence" onClick={onPlay}>
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

export default function ReviewPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    ensureSeeded()
  }, [])

  const queue = useLiveQuery(async () => {
    const rows = await db.cards.orderBy('dueDate').toArray()
    const dueCards = getReviewQueue(rows)

    if (dueCards.length === 0) {
      return [] as ReviewRow[]
    }

    const sentenceIds = [...new Set(dueCards.map((card) => card.sentenceId))]
    const sentences = await db.sentences.where('id').anyOf(sentenceIds).toArray()
    const sentenceMap = new Map(sentences.map((sentence) => [sentence.id, sentence]))

    return dueCards.map((card) => ({
      ...card,
      sentence: sentenceMap.get(card.sentenceId) ?? null,
    }))
  }, []) ?? []

  const currentItem = queue[activeIndex] ?? null
  const currentSentence = currentItem?.sentence ?? null

  useEffect(() => {
    setIsRevealed(false)
    if (queue.length === 0) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((previous) => Math.min(previous, queue.length - 1))
  }, [queue.length])

  const handlePlay = () => {
    if (!currentSentence) return
    const text = currentSentence.spokenForm ?? currentSentence.audioText
    playAudio(text, isRevealed ? 1 : 0.72)
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
    <AppShell title="Review your words">
      <div className="screen-stack">
        <ScreenCard className="review-card">
          {!currentItem || !currentSentence ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center gap-4 px-6">
              <p className="eyebrow">READY WHEN YOU ARE</p>
              <h3 className="text-2xl font-semibold text-slate-800">No cards due yet.</h3>
              <p className="max-w-sm text-sm text-slate-500">
                Save a sentence from the reading flow to start your review queue.
              </p>
              <Link href="/reader" className="primary-button">
                Open reader
              </Link>
            </div>
          ) : (
            <>
              <div className="review-progress">
                <span>
                  Card {activeIndex + 1} of {queue.length}
                </span>
                <span>{Math.round(((activeIndex + 1) / queue.length) * 100)}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${((activeIndex + 1) / queue.length) * 100}%` }} />
              </div>

              <AudioFirstCard
                sentence={currentSentence}
                isRevealed={isRevealed}
                onReveal={() => setIsRevealed((value) => !value)}
                onPlay={handlePlay}
                onGrade={handleGrade}
              />
            </>
          )}
        </ScreenCard>

        <ScreenHeading
          eyebrow="UP NEXT"
          title={queue.length > 0 ? `${queue.length} cards in your queue` : 'No cards queued'}
        />
      </div>
    </AppShell>
  )
}
