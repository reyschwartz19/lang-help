import { NextResponse } from 'next/server'
import { getDatabase } from '@/data/server/database'
import { getSessionUser } from '@/lib/auth/session'

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const raw = new URL(request.url).searchParams.get('after') ?? '0'
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
  const db = getDatabase()
  const after = BigInt(raw)
  const changes = await db.learnerChange.findMany({ where: { userId: user.id, sequence: { gt: after } }, orderBy: { sequence: 'asc' }, take: 500 })
  const cursor = changes.at(-1)?.sequence ?? after
  return NextResponse.json({ cursor: cursor.toString(), changes: changes.map(({ sequence, ...change }) => ({ ...change, sequence: sequence.toString() })) })
}
