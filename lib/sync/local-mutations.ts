import { db, type Card, type LearnerEvent, type LearnerRecordType, type ReadingProgress } from '@/data/local/database'

export const SYNC_REQUESTED_EVENT = 'parlez:sync-requested'

function serialize(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

async function enqueue(recordType: LearnerRecordType, recordId: string, payload: unknown, deleted = false) {
  const cursor = (await db.syncMetadata.get('cursor'))?.value ?? '0'
  await db.syncOutbox.add({ mutationId: crypto.randomUUID(), recordType, recordId, payload: deleted ? null : serialize(payload), deleted, baseCursor: cursor, createdAt: new Date(), attempts: 0, nextAttemptAt: new Date() })
}

function requestSync() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SYNC_REQUESTED_EVENT))
}

export async function putCardLocally(card: Card) {
  await db.transaction('rw', db.cards, db.syncOutbox, db.syncMetadata, async () => { await db.cards.put(card); await enqueue('CARD', card.id, card) })
  requestSync()
}

export async function deleteCardLocally(cardId: string) {
  await db.transaction('rw', db.cards, db.syncOutbox, db.syncMetadata, async () => { await db.cards.delete(cardId); await enqueue('CARD', cardId, null, true) })
  requestSync()
}

export async function putReadingProgressLocally(progress: ReadingProgress) {
  await db.transaction('rw', db.readingProgress, db.syncOutbox, db.syncMetadata, async () => { await db.readingProgress.put(progress); await enqueue('READING_PROGRESS', progress.storyId, progress) })
  requestSync()
}

export async function putLearnerEventLocally(event: LearnerEvent) {
  await db.transaction('rw', db.learnerEvents, db.syncOutbox, db.syncMetadata, async () => { await db.learnerEvents.put(event); await enqueue('LEARNER_EVENT', event.id, event) })
  requestSync()
}
