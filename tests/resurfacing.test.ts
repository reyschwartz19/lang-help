import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceReadingProgress, isReadingProgressDue } from '../lib/reader/resurfacing'

test('resurfacing follows read, listen-only, reread sequence', () => {
  const now = new Date('2026-08-12T00:00:00Z')
  const initial = { storyId: 'story', status: 'unread' as const, lastSeenAt: new Date(0), nextResurfaceAt: new Date(0) }
  const listen = advanceReadingProgress(initial, now)
  assert.equal(listen.status, 'listen_only_due')
  assert.equal(isReadingProgressDue(listen, now), false)
  const reread = advanceReadingProgress(listen, new Date('2026-08-13T00:00:00Z'))
  assert.equal(reread.status, 'reread_due')
  assert.equal(advanceReadingProgress(reread, new Date('2026-08-16T00:00:00Z')).status, 'mastered')
})
