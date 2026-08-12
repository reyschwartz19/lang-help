import bundledRelease from '@/data/content/content-release.json'
import type { Sentence, Story } from '@/data/local/database'

export interface ContentAttribution { name: string; license: string; url: string }
export interface PreparedStory extends Omit<Story, 'sentenceIds'> { sentences: Sentence[] }
export interface PreparedContentRelease {
  schemaVersion: 1
  releaseVersion: string
  releasedAt: string
  attribution: ContentAttribution[]
  stories: PreparedStory[]
}

const levels = new Set(['A1', 'A2', 'B1', 'B2'])

export function validateContentRelease(value: unknown): PreparedContentRelease {
  if (!value || typeof value !== 'object') throw new Error('Content release must be an object')
  const release = value as Record<string, unknown>
  if (release.schemaVersion !== 1 || typeof release.releaseVersion !== 'string' || !/^\d{4}\.\d{2}\.\d+$/.test(release.releaseVersion)) throw new Error('Invalid content release version')
  if (typeof release.releasedAt !== 'string' || Number.isNaN(Date.parse(release.releasedAt))) throw new Error('Invalid release date')
  if (!Array.isArray(release.attribution) || release.attribution.length === 0 || !Array.isArray(release.stories)) throw new Error('Release attribution and stories are required')
  const ids = new Set<string>()
  for (const rawStory of release.stories as Array<Record<string, unknown>>) {
    if (typeof rawStory.id !== 'string' || typeof rawStory.title !== 'string' || typeof rawStory.difficulty !== 'number' || !Array.isArray(rawStory.sentences) || rawStory.sentences.length < 2) throw new Error('Invalid story')
    for (const rawSentence of rawStory.sentences as Array<Record<string, unknown>>) {
      if (typeof rawSentence.id !== 'string' || ids.has(rawSentence.id) || typeof rawSentence.french !== 'string' || typeof rawSentence.english !== 'string' || !levels.has(String(rawSentence.cefrLevel))) throw new Error('Invalid or duplicate sentence')
      ids.add(rawSentence.id)
    }
  }
  return value as PreparedContentRelease
}

export const bundledContentRelease = validateContentRelease(bundledRelease)
