'use client'

import { useEffect } from 'react'
import { db } from '@/data/local/database'

type RecordType = 'CARD' | 'PHRASE' | 'READING_PROGRESS' | 'USER_STATS'
type LocalRecord = { recordType: RecordType; recordId: string; payload: unknown }
const stateKey = (type: RecordType) => `snapshot:${type}`

function deviceId() {
  const key = 'parlez_device_id'
  let id = localStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}

function restoreDates(type: RecordType, payload: Record<string, unknown>) {
  const dateFields = type === 'CARD' ? ['dueDate', 'lastReviewedAt', 'createdAt'] : type === 'READING_PROGRESS' ? ['lastSeenAt', 'nextResurfaceAt'] : []
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, dateFields.includes(key) && typeof value === 'string' ? new Date(value) : value]))
}

async function records(): Promise<LocalRecord[]> {
  const [cards, phrases, progress, stats] = await Promise.all([db.cards.toArray(), db.phraseBank.toArray(), db.readingProgress.toArray(), db.userStats.toArray()])
  return [...cards.map(payload => ({ recordType: 'CARD' as const, recordId: payload.id, payload })), ...phrases.map(payload => ({ recordType: 'PHRASE' as const, recordId: payload.id, payload })), ...progress.map(payload => ({ recordType: 'READING_PROGRESS' as const, recordId: payload.storyId, payload })), ...stats.map(payload => ({ recordType: 'USER_STATS' as const, recordId: payload.id, payload }))]
}

async function sync() {
  const cursor = (await db.syncMetadata.get('cursor'))?.value ?? '0'
  const current = await records()
  const grouped = new Map<RecordType, LocalRecord[]>()
  for (const item of current) grouped.set(item.recordType, [...(grouped.get(item.recordType) ?? []), item])
  const mutations: Array<Record<string, unknown>> = []
  const snapshots: Array<{ key: string; value: string }> = []
  for (const type of ['CARD', 'PHRASE', 'READING_PROGRESS', 'USER_STATS'] as RecordType[]) {
    const previous = JSON.parse((await db.syncMetadata.get(stateKey(type)))?.value ?? '{}') as Record<string, string>
    const next: Record<string, string> = {}
    for (const item of grouped.get(type) ?? []) { const value = JSON.stringify(item.payload); next[item.recordId] = value; if (previous[item.recordId] !== value) mutations.push({ mutationId: crypto.randomUUID(), baseCursor: cursor, ...item }) }
    for (const id of Object.keys(previous)) if (!(id in next)) mutations.push({ mutationId: crypto.randomUUID(), baseCursor: cursor, recordType: type, recordId: id, deleted: true })
    snapshots.push({ key: stateKey(type), value: JSON.stringify(next) })
  }
  const id = deviceId()
  if (mutations.length) {
    const pushed = await fetch('/api/sync/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId: id, mutations }) })
    if (!pushed.ok) throw new Error('push failed')
  }
  await db.syncMetadata.bulkPut(snapshots)
  const pulled = await fetch(`/api/sync/pull?after=${encodeURIComponent(cursor)}`)
  if (!pulled.ok) return
  const result = await pulled.json() as { cursor: string; changes: Array<{ recordType: RecordType; recordId: string; payload: Record<string, unknown> | null; deletedAt: string | null }> }
  await db.transaction('rw', [db.cards, db.phraseBank, db.readingProgress, db.userStats, db.syncMetadata], async () => {
    for (const change of result.changes) {
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
