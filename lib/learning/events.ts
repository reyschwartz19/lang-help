import { type LearnerEvent, type LearnerEventType } from '@/data/local/database'
import { putLearnerEventLocally } from '@/lib/sync/local-mutations'

export async function captureLearnerEvent(type: LearnerEventType, values: Partial<Omit<LearnerEvent, 'id' | 'type' | 'occurredAt'>> = {}) {
  await putLearnerEventLocally({ id: crypto.randomUUID(), type, occurredAt: new Date(), entityId: values.entityId ?? null, durationSeconds: values.durationSeconds ?? null, grade: values.grade ?? null, metadata: values.metadata ?? {} })
}

export function deriveMetrics(events: LearnerEvent[]) {
  const reviews = events.filter((event) => event.type === 'review_graded' && event.grade)
  const successful = reviews.filter((event) => event.grade === 'good' || event.grade === 'easy').length
  return {
    storiesCompleted: new Set(events.filter((event) => event.type === 'story_completed').map((event) => event.entityId)).size,
    sentencesMined: new Set(events.filter((event) => event.type === 'sentence_mined').map((event) => event.entityId)).size,
    speakingSessions: events.filter((event) => event.type === 'speech_completed').length,
    listeningMinutes: Math.round(events.filter((event) => event.type === 'audio_played').reduce((sum, event) => sum + (event.durationSeconds ?? 0), 0) / 60 * 10) / 10,
    reviewAccuracy: reviews.length ? Math.round((successful / reviews.length) * 100) : null,
    reviewCount: reviews.length,
  }
}

export function deriveCefrEstimate(events: LearnerEvent[], knownItems: number) {
  const metrics = deriveMetrics(events)
  const evidence = metrics.reviewCount + metrics.storiesCompleted + metrics.speakingSessions
  if (evidence < 5) return { level: null, explanation: `More evidence needed (${evidence}/5 activities).` }
  const score = knownItems + metrics.storiesCompleted * 5 + metrics.speakingSessions * 2
  const level = score >= 180 && (metrics.reviewAccuracy ?? 0) >= 75 ? 'B1' : score >= 60 && (metrics.reviewAccuracy ?? 0) >= 65 ? 'A2' : 'A1'
  return { level, explanation: `Based on ${knownItems} retained cards, ${metrics.storiesCompleted} passages, ${metrics.speakingSessions} speaking sessions, and ${metrics.reviewCount} review outcomes.` }
}
