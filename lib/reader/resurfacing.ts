import type { ReadingProgress } from '@/data/local/database'

export function advanceReadingProgress(progress: ReadingProgress, now = new Date()): ReadingProgress {
  const result: ReadingProgress = { ...progress, lastSeenAt: now, nextResurfaceAt: now }
  if (progress.status === 'unread' || progress.status === 'read') { result.status = 'listen_only_due'; result.nextResurfaceAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) }
  else if (progress.status === 'listen_only_due') { result.status = 'reread_due'; result.nextResurfaceAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }
  else if (progress.status === 'reread_due') result.status = 'mastered'
  return result
}

export function isReadingProgressDue(progress: ReadingProgress, now = new Date()) { return progress.status !== 'mastered' && (progress.status === 'unread' || progress.nextResurfaceAt.getTime() <= now.getTime()) }

