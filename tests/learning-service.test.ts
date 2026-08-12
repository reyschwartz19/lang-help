import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import test from 'node:test'

import { db, type Card } from '../data/local/database'
import { ensureSeeded } from '../data/local/seed-database'
import { getNextLocalSession, getPhraseReviewQueue, getProgressSummary, getSentenceReviewQueue } from '../data/local/learning-service'

function card(id: string, sentenceId: string, type: Card['type'], dueDate: Date, stability = 0): Card {
  return { id, sentenceId, type, dueDate, stability, difficulty: 0, reps: 0, lapses: 0, lastReviewedAt: null, createdAt: new Date(0) }
}

test.beforeEach(async () => {
  await db.delete()
  await db.open()
})

test.after(async () => db.delete())

test('seed is idempotent and keeps sentence and phrase queues isolated', async () => {
  await ensureSeeded()
  const first = { sentences: await db.sentences.count(), phrases: await db.phraseBank.count(), cards: await db.cards.count() }
  await ensureSeeded()
  assert.deepEqual({ sentences: await db.sentences.count(), phrases: await db.phraseBank.count(), cards: await db.cards.count() }, first)

  const sentence = await db.sentences.toCollection().first()
  const phrase = await db.phraseBank.toCollection().first()
  assert.ok(sentence && phrase)
  await db.cards.bulkPut([
    card('sentence-due', sentence.id, 'sentence', new Date(0)),
    card('phrase-due', phrase.id, 'phrase', new Date(0)),
  ])
  assert.deepEqual((await getSentenceReviewQueue(new Date())).map((row) => row.id), ['sentence-due'])
  assert.ok((await getPhraseReviewQueue(new Date())).some((row) => row.id === 'phrase-due'))
})

test('services resolve content, due-session priority, and honest progress', async () => {
  await db.sentences.put({ id: 's1', french: 'Bonjour.', english: 'Hello.', difficulty: 1, cefrLevel: 'A1', source: 'curated', spokenForm: null, audioText: 'Bonjour.' })
  await db.cards.put(card('c1', 's1', 'sentence', new Date(0), 25))
  const queue = await getSentenceReviewQueue(new Date())
  assert.equal(queue[0]?.content?.french, 'Bonjour.')
  assert.equal((await getNextLocalSession(new Date())).href, '/review')
  const progress = await getProgressSummary()
  assert.equal(progress.wordsKnown, 1)
  assert.equal(progress.phrasesKnown, 0)
  assert.equal(progress.metrics.reviewCount, 0)
})
