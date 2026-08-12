import { db, type Card, type PhraseBank, type Sentence } from '@/data/local/database'
import { getReviewQueue } from '@/lib/review/fsrs-scheduler'
import { deriveCefrEstimate, deriveMetrics } from '@/lib/learning/events'

export type SentenceReviewRow = Card & { content: Sentence | null }
export type PhraseReviewRow = Card & { content: PhraseBank | null }

export async function getSentenceReviewQueue(now = new Date()): Promise<SentenceReviewRow[]> {
  const cards = getReviewQueue(await db.cards.where('type').equals('sentence').toArray(), now)
  const content = await db.sentences.where('id').anyOf(cards.map((card) => card.sentenceId)).toArray()
  const byId = new Map(content.map((sentence) => [sentence.id, sentence]))
  return cards.map((card) => ({ ...card, content: byId.get(card.sentenceId) ?? null }))
}

export async function getPhraseReviewQueue(now = new Date()): Promise<PhraseReviewRow[]> {
  const cards = getReviewQueue(await db.cards.where('type').equals('phrase').toArray(), now)
  const content = await db.phraseBank.where('id').anyOf(cards.map((card) => card.sentenceId)).toArray()
  const byId = new Map(content.map((phrase) => [phrase.id, phrase]))
  return cards.map((card) => ({ ...card, content: byId.get(card.sentenceId) ?? null }))
    .sort((a, b) => (a.content?.priority ?? 3) - (b.content?.priority ?? 3) || +new Date(a.dueDate) - +new Date(b.dueDate))
}

export async function getNextLocalSession(now = new Date()) {
  const dueReviews = await db.cards.where('dueDate').belowOrEqual(now).count()
  if (dueReviews > 0) return { href: '/review', title: 'Review due sentences', detail: `${dueReviews} cards are due now.` }
  const dueReading = await db.readingProgress.where('nextResurfaceAt').belowOrEqual(now).and((row) => row.status !== 'mastered').count()
  if (dueReading > 0) return { href: '/reader', title: 'Read or revisit a passage', detail: `${dueReading} passage session${dueReading === 1 ? ' is' : 's are'} ready.` }
  return { href: '/speaking', title: 'Practice a timed response', detail: 'Nothing is due, so use a short production drill.' }
}

export async function getProgressSummary() {
  const [events, cards] = await Promise.all([db.learnerEvents.toArray(), db.cards.toArray()])
  const known = cards.filter((card) => card.stability >= 21)
  const wordsKnown = new Set(known.filter((card) => card.type === 'sentence').map((card) => card.sentenceId)).size
  const phrasesKnown = new Set(known.filter((card) => card.type === 'phrase').map((card) => card.sentenceId)).size
  return { metrics: deriveMetrics(events), wordsKnown, phrasesKnown, cefr: deriveCefrEstimate(events, wordsKnown + phrasesKnown) }
}
