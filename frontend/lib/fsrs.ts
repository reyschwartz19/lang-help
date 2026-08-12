import { createEmptyCard, fsrs, Rating, State, type Card as FsrsCard, type Grade, type ReviewLog } from 'ts-fsrs'
import type { Card as ReviewCard } from '@/data/db'

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

const scheduler = fsrs({ enable_fuzz: false, enable_short_term: true })

const ratingMap: Record<ReviewGrade, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

export function createReviewCard(seed: Partial<ReviewCard> = {}): ReviewCard {
  return {
    id: seed.id ?? crypto.randomUUID(),
    sentenceId: seed.sentenceId ?? '',
    type: seed.type ?? 'sentence',
    dueDate: seed.dueDate ?? new Date(),
    stability: seed.stability ?? 0,
    difficulty: seed.difficulty ?? 0,
    reps: seed.reps ?? 0,
    lapses: seed.lapses ?? 0,
    lastReviewedAt: seed.lastReviewedAt ?? null,
    createdAt: seed.createdAt ?? new Date(),
  }
}

export function mapDbCardToFsrsCard(card: ReviewCard): FsrsCard {
  const due = card.dueDate instanceof Date ? card.dueDate : new Date(card.dueDate)
  const state = card.reps === 0 ? State.New : card.lapses > 0 ? State.Relearning : State.Review

  return {
    due,
    stability: Number.isFinite(card.stability) ? card.stability : 0,
    difficulty: Number.isFinite(card.difficulty) ? card.difficulty : 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state,
    last_review: card.lastReviewedAt ?? undefined,
  }
}

export function mapFsrsCardToDbCard(card: FsrsCard, previous: ReviewCard): ReviewCard {
  return {
    ...previous,
    dueDate: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    lastReviewedAt: card.last_review ?? new Date(),
  }
}

export function applyReviewGrade(card: ReviewCard, grade: ReviewGrade) {
  const baseCard = card.id ? card : createReviewCard(card)
  const fsrsCard = mapDbCardToFsrsCard(baseCard)
  const result = scheduler.next(fsrsCard, new Date(), ratingMap[grade] as Grade)

  return {
    card: mapFsrsCardToDbCard(result.card, baseCard),
    log: result.log as ReviewLog,
  }
}

export function getReviewQueue(cards: ReviewCard[]) {
  return cards
    .filter((card) => new Date(card.dueDate) <= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export const reviewGrades = [
  { key: 'again', label: 'Again', palette: 'muted' },
  { key: 'hard', label: 'Hard', palette: 'secondary' },
  { key: 'good', label: 'Good', palette: 'primary' },
  { key: 'easy', label: 'Easy', palette: 'success' },
] as const

export function getEmptyFsrsCard() {
  return createEmptyCard(new Date())
}
