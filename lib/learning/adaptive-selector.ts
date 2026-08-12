import type { LearnerEvent, ReadingProgress, Story } from '@/data/local/database'

export type DifficultySignal = 'too_easy' | 'just_right' | 'too_hard'

export interface AdaptiveDecision {
  targetDifficulty: number
  reason: string
  evidenceCount: number
}

export function adaptiveDecision(events: LearnerEvent[], fallback = 1): AdaptiveDecision {
  const recent = [...events].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 40)
  const reviews = recent.filter((event) => event.type === 'review_graded' && event.grade)
  const successful = reviews.filter((event) => event.grade === 'good' || event.grade === 'easy').length
  const lookupCount = recent.filter((event) => event.type === 'definition_viewed').length
  const ratings = recent.filter((event) => event.type === 'passage_difficulty')
  const latestRating = ratings[0]?.metadata.rating as DifficultySignal | undefined
  const accuracy = reviews.length ? successful / reviews.length : null

  if (latestRating === 'too_hard' || lookupCount >= 5 || (accuracy !== null && reviews.length >= 5 && accuracy < 0.6)) {
    return { targetDifficulty: Math.max(0, fallback - 0.5), reason: 'Recent difficulty, lookups, or recall suggest an easier passage.', evidenceCount: reviews.length + lookupCount + ratings.length }
  }
  if (latestRating === 'too_easy' || (accuracy !== null && reviews.length >= 5 && accuracy >= 0.85 && lookupCount <= 1)) {
    return { targetDifficulty: fallback + 0.5, reason: 'Strong recent recall and few lookups support a small step up.', evidenceCount: reviews.length + lookupCount + ratings.length }
  }
  return { targetDifficulty: fallback, reason: recent.length ? 'Recent signals support staying in the current band.' : 'Not enough evidence yet; starting from the bundled baseline.', evidenceCount: reviews.length + lookupCount + ratings.length }
}

export function selectAdaptiveStory(stories: Story[], progressRows: ReadingProgress[], events: LearnerEvent[], now: Date): { story: Story; progress: ReadingProgress; decision: AdaptiveDecision } | null {
  const due = progressRows.filter((progress) => progress.status !== 'mastered' && progress.nextResurfaceAt.getTime() <= now.getTime())
  if (!due.length) return null
  const completed = events.filter((event) => event.type === 'story_completed').at(-1)
  const baseline = stories.find((story) => story.id === completed?.entityId)?.difficulty ?? 1
  const decision = adaptiveDecision(events, baseline)
  const candidates = due.map((progress) => ({ progress, story: stories.find((story) => story.id === progress.storyId) })).filter((row): row is { progress: ReadingProgress; story: Story } => Boolean(row.story))
  candidates.sort((a, b) => Math.abs(a.story.difficulty - decision.targetDifficulty) - Math.abs(b.story.difficulty - decision.targetDifficulty))
  return candidates[0] ? { ...candidates[0], decision } : null
}
