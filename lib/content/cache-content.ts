import { db } from '@/data/local/database'
import { bundledContentRelease, validateContentRelease, type PreparedContentRelease } from '@/lib/content/content-release'

export async function cacheContentRelease(release: PreparedContentRelease, source: 'bundled' | 'remote') {
  await db.transaction('rw', db.sentences, db.stories, db.readingProgress, db.contentCacheMetadata, async () => {
    for (const story of release.stories) {
      await db.sentences.bulkPut(story.sentences)
      await db.stories.put({ id: story.id, title: story.title, difficulty: story.difficulty, sentenceIds: story.sentences.map(({ id }) => id) })
      if (!(await db.readingProgress.get(story.id))) await db.readingProgress.put({ storyId: story.id, status: 'unread', lastSeenAt: new Date(0), nextResurfaceAt: new Date(0) })
    }
    await db.contentCacheMetadata.put({ key: 'active-release', releaseVersion: release.releaseVersion, fetchedAt: new Date(), source })
  })
}

export async function cacheAheadContent() {
  await cacheContentRelease(bundledContentRelease, 'bundled')
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  try {
    const response = await fetch('/api/content?limit=10', { credentials: 'same-origin' })
    if (!response.ok) return
    await cacheContentRelease(validateContentRelease(await response.json()), 'remote')
  } catch {
    // Bundled content remains available; a later app start retries the cache-ahead request.
  }
}

