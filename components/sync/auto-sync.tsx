'use client'

import { useEffect } from 'react'
import { db, type LearnerRecordType } from '@/data/local/database'

const supportedTypes = new Set<LearnerRecordType>(['CARD', 'PHRASE', 'READING_PROGRESS', 'USER_STATS'])

function deviceId() {
  const key = 'parlez_device_id'
  let id = localStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}

function restoreDates(type: LearnerRecordType, payload: Record<string, unknown>) {
  const fields = type === 'CARD' ? ['dueDate', 'lastReviewedAt', 'createdAt'] : type === 'READING_PROGRESS' ? ['lastSeenAt', 'nextResurfaceAt'] : []
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => {
    if (!fields.includes(key) || value === null) return [key, value]
    if (typeof value !== 'string' && !(value instanceof Date)) throw new Error(`Invalid persisted date: ${key}`)
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid persisted date: ${key}`)
    return [key, date]
  }))
}

async function sync() {
  const now = new Date()
  const pending = (await db.syncOutbox.where('nextAttemptAt').belowOrEqual(now).limit(100).toArray()).filter(({ recordType }) => supportedTypes.has(recordType))
  if (pending.length) {
    const mutations = pending.map((item) => ({ mutationId: item.mutationId, recordType: item.recordType, recordId: item.recordId, payload: item.payload, deleted: item.deleted, baseCursor: item.baseCursor }))
    const response = await fetch('/api/sync/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId: deviceId(), mutations }) })
    if (!response.ok) {
      await db.syncOutbox.bulkPut(pending.map((item) => ({ ...item, attempts: item.attempts + 1, nextAttemptAt: new Date(Date.now() + Math.min(300_000, 2 ** Math.min(item.attempts + 1, 18) * 1000)) })))
      throw new Error('Sync push failed')
    }
    const result = await response.json() as { cursor: string }
    await db.transaction('rw', db.syncOutbox, db.syncMetadata, async () => { await db.syncOutbox.bulkDelete(pending.map(({ mutationId }) => mutationId)); await db.syncMetadata.put({ key: 'cursor', value: result.cursor }) })
  }

  const cursor = (await db.syncMetadata.get('cursor'))?.value ?? '0'
  const pulled = await fetch(`/api/sync/pull?after=${encodeURIComponent(cursor)}`)
  if (!pulled.ok) return
  const result = await pulled.json() as { cursor: string; changes: Array<{ recordType: LearnerRecordType; recordId: string; payload: Record<string, unknown> | null; deletedAt: string | null }> }
  await db.transaction('rw', [db.cards, db.phraseBank, db.readingProgress, db.userStats, db.syncMetadata], async () => {
    for (const change of result.changes) {
      if (!supportedTypes.has(change.recordType)) continue
      const table = change.recordType === 'CARD' ? db.cards : change.recordType === 'PHRASE' ? db.phraseBank : change.recordType === 'READING_PROGRESS' ? db.readingProgress : db.userStats
      if (change.deletedAt) await table.delete(change.recordId)
      else if (change.payload) await table.put(restoreDates(change.recordType, change.payload) as never)
    }
    await db.syncMetadata.put({ key: 'cursor', value: result.cursor })
  })
}

export function AutoSync() {
  useEffect(() => { let active = true; const run = () => { if (active && navigator.onLine) void sync().catch(() => undefined) }; run(); const timer = window.setInterval(run, 30_000); window.addEventListener('online', run); return () => { active = false; clearInterval(timer); window.removeEventListener('online', run) } }, [])
  return null
}
