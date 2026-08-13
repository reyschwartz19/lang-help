import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import test from 'node:test'
import { db } from '../data/local/database'
import { putLearnerEventLocally } from '../lib/sync/local-mutations'

test.beforeEach(async () => {
  await db.delete()
  await db.open()
})

test.after(async () => db.delete())

test('learner events commit locally and enter the sync outbox atomically', async () => {
  const occurredAt = new Date('2026-08-13T00:00:00.000Z')
  await putLearnerEventLocally({
    id: 'event-1',
    type: 'sentence_mined',
    occurredAt,
    entityId: 'sentence-1',
    durationSeconds: null,
    grade: null,
    metadata: {},
  })

  const event = await db.learnerEvents.get('event-1')
  const queued = await db.syncOutbox.where('recordId').equals('event-1').first()
  assert.equal(event?.occurredAt.toISOString(), occurredAt.toISOString())
  assert.equal(queued?.recordType, 'LEARNER_EVENT')
  assert.equal(queued?.baseCursor, '0')
  assert.deepEqual(queued?.payload?.occurredAt, occurredAt.toISOString())
})
