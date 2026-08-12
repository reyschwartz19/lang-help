import assert from 'node:assert/strict'
import test from 'node:test'
import type { LearnerEvent } from '../data/local/database'
import { adaptiveDecision } from '../lib/learning/adaptive-selector'

const event = (type: LearnerEvent['type'], values: Partial<LearnerEvent> = {}): LearnerEvent => ({ id: crypto.randomUUID(), type, occurredAt: new Date(), entityId: null, durationSeconds: null, grade: null, metadata: {}, ...values })

test('adaptive selector steps down after repeated lookups', () => {
  const result = adaptiveDecision(Array.from({ length: 5 }, () => event('definition_viewed')), 2)
  assert.equal(result.targetDifficulty, 1.5)
})

test('adaptive selector steps up after sustained successful recall', () => {
  const events = Array.from({ length: 6 }, () => event('review_graded', { grade: 'good' }))
  assert.equal(adaptiveDecision(events, 2).targetDifficulty, 2.5)
})

test('adaptive selector holds baseline without evidence', () => {
  assert.equal(adaptiveDecision([], 1).targetDifficulty, 1)
})
