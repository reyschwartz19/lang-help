import { db, type LearnerEvent, type LearnerEventType } from '@/data/local/database'

export async function captureLearnerEvent(type: LearnerEventType, values: Partial<Omit<LearnerEvent, 'id' | 'type' | 'occurredAt'>> = {}) {
  await db.learnerEvents.add({ id: crypto.randomUUID(), type, occurredAt: new Date(), entityId: values.entityId ?? null, durationSeconds: values.durationSeconds ?? null, grade: values.grade ?? null, metadata: values.metadata ?? {} })
}

export function deriveMetrics(events: LearnerEvent[]) {
  const reviews = events.filter((event) => event.type === 'review_graded' && event.grade)
  const successful = reviews.filter((event) => event.grade === 'good' || event.grade === 'easy').length
  return {
    storiesCompleted: new Set(events.filter((event) => event.type === 'story_completed').map((event) => event.entityId)).size,
    sentencesMined: new Set(events.filter((event) => event.type === 'sentence_mined').map((event) => event.entityId)).size,
    speakingSessions: events.filter((event) => event.type === 'speech_completed').length,
    listeningMinutes: Math.round(events.filter((event) => event.type === 'audio_played').reduce((sum, event) => sum + (event.durationSeconds ?? 0), 0) / 60),
    reviewAccuracy: reviews.length ? Math.round((successful / reviews.length) * 100) : null,
    reviewCount: reviews.length,
  }
}
