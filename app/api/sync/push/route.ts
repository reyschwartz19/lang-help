import type { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/data/server/database'
import { getSessionUser } from '@/lib/auth/session'
import { hasTrustedOrigin } from '@/lib/auth/request-security'

type LearnerRecordType = 'CARD' | 'PHRASE' | 'READING_PROGRESS' | 'USER_STATS' | 'LEARNER_EVENT'
const allowed = new Set<LearnerRecordType>(['CARD', 'PHRASE', 'READING_PROGRESS', 'USER_STATS', 'LEARNER_EVENT'])

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { deviceId?: unknown; mutations?: unknown } | null
  if (!body || typeof body.deviceId !== 'string' || body.deviceId.length > 100 || !Array.isArray(body.mutations) || body.mutations.length > 500) return NextResponse.json({ error: 'Invalid sync request' }, { status: 400 })
  const db = getDatabase()
  const deviceId = body.deviceId
  const cursor = await db.$transaction(async (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => {
    await tx.syncDevice.upsert({ where: { id: deviceId }, create: { id: deviceId, userId: user.id }, update: { lastSeenAt: new Date() } })
    let latest = BigInt(0)
    for (const value of body.mutations as Array<Record<string, unknown>>) {
      if (typeof value.mutationId !== 'string' || typeof value.recordId !== 'string' || typeof value.recordType !== 'string' || !allowed.has(value.recordType as LearnerRecordType)) throw new Error('Invalid mutation')
      if (typeof value.baseCursor !== 'string' || !/^\d+$/.test(value.baseCursor)) throw new Error('Invalid mutation cursor')
      const prior = await tx.syncMutation.findUnique({ where: { userId_mutationId: { userId: user.id, mutationId: value.mutationId } } })
      if (prior) { latest = prior.sequence > latest ? prior.sequence : latest; continue }
      const identity = { userId: user.id, recordType: value.recordType as LearnerRecordType, recordId: value.recordId }
      const existing = await tx.learnerRecord.findUnique({ where: { userId_recordType_recordId: identity } })
      if (existing && existing.lastChangeSequence > BigInt(value.baseCursor)) {
        await tx.syncMutation.create({ data: { userId: user.id, mutationId: value.mutationId, deviceId, sequence: existing.lastChangeSequence } })
        latest = existing.lastChangeSequence > latest ? existing.lastChangeSequence : latest
        continue
      }
      const deletedAt = value.deleted ? new Date() : null
      const payload = deletedAt ? null : JSON.parse(JSON.stringify(value.payload ?? null))
      const change = await tx.learnerChange.create({ data: { userId: user.id, deviceId, recordId: value.recordId, recordType: value.recordType as LearnerRecordType, payload, deletedAt } })
      await tx.learnerRecord.upsert({ where: { userId_recordType_recordId: identity }, create: { ...identity, payload, deletedAt, lastDeviceId: deviceId, lastChangeSequence: change.sequence }, update: { payload, deletedAt, updatedAt: new Date(), lastDeviceId: deviceId, lastChangeSequence: change.sequence } })
      await tx.syncMutation.create({ data: { userId: user.id, mutationId: value.mutationId, deviceId, sequence: change.sequence } })
      latest = change.sequence
    }
    return latest
  }).catch(() => null)
  if (cursor === null) return NextResponse.json({ error: 'Invalid sync request' }, { status: 400 })
  return NextResponse.json({ cursor: cursor.toString() })
}
