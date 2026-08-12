import assert from 'node:assert/strict'
import test from 'node:test'
import { applyReviewGrade, createReviewCard, getReviewQueue, mapDbCardToFsrsCard } from '../lib/review/fsrs-scheduler'

test('maps a new database card and advances it after a grade', () => {
  const card = createReviewCard({ id: 'card-1', sentenceId: 'sentence-1', dueDate: new Date('2026-01-01T00:00:00Z') })
  assert.equal(mapDbCardToFsrsCard(card).reps, 0)
  const result = applyReviewGrade(card, 'good')
  assert.equal(result.card.reps, 1)
  assert.ok(result.card.dueDate > card.dueDate)
})

test('due queue includes the exact boundary and orders oldest first', () => {
  const now = new Date()
  const old = createReviewCard({ id: 'old', dueDate: new Date(now.getTime() - 1000) })
  const boundary = createReviewCard({ id: 'boundary', dueDate: now })
  const future = createReviewCard({ id: 'future', dueDate: new Date(now.getTime() + 60_000) })
  assert.deepEqual(getReviewQueue([future, boundary, old]).map(({ id }) => id), ['old', 'boundary'])
})

