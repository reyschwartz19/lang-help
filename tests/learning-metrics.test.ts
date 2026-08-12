import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveMetrics } from '../lib/learning/events'
import type { LearnerEvent } from '../data/local/database'

const event = (values: Partial<LearnerEvent>): LearnerEvent => ({ id: crypto.randomUUID(), type: 'audio_played', occurredAt: new Date(), entityId: null, durationSeconds: null, grade: null, metadata: {}, ...values })

test('metrics contain only captured activity and expose honest empty accuracy', () => {
  assert.equal(deriveMetrics([]).reviewAccuracy, null)
  const metrics = deriveMetrics([event({ type: 'review_graded', grade: 'good' }), event({ type: 'review_graded', grade: 'again' }), event({ type: 'story_completed', entityId: 'story-1' }), event({ type: 'audio_played', durationSeconds: 120 })])
  assert.equal(metrics.reviewAccuracy, 50)
  assert.equal(metrics.storiesCompleted, 1)
  assert.equal(metrics.listeningMinutes, 2)
})

