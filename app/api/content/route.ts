import { NextResponse } from 'next/server'
import { db } from '@/data/server/database'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 10), 1), 50)
  const cursor = url.searchParams.get('cursor') ?? undefined
  const release = await db.contentRelease.findFirst({
    where: { isActive: true },
    orderBy: { releasedAt: 'desc' },
    include: { stories: { orderBy: { id: 'asc' }, take: limit, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), include: { sentences: { orderBy: { position: 'asc' }, include: { sentence: true } } } } },
  })
  if (!release) return NextResponse.json({ error: 'No active content release' }, { status: 404 })
  return NextResponse.json({
    schemaVersion: 1,
    releaseVersion: release.version,
    releasedAt: release.releasedAt.toISOString(),
    attribution: [{ name: 'Parlez curated teaching content', license: 'CC0-1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
    stories: release.stories.map((story) => ({ id: story.id, title: story.title, difficulty: story.difficulty / 100, sentences: story.sentences.map(({ sentence }) => ({ ...sentence, difficulty: sentence.difficulty / 100, audioText: sentence.french, grammar: undefined, createdAt: undefined, updatedAt: undefined })) })),
    nextCursor: release.stories.length === limit ? release.stories.at(-1)?.id : null,
  })
}
