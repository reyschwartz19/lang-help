import releaseJson from '../../data/content/content-release.json'
import { PrismaClient } from '@prisma/client'
import { validateContentRelease } from '../../lib/content/content-release'

const prisma = new PrismaClient()
const release = validateContentRelease(releaseJson)

async function run() {
  await prisma.$transaction(async (tx) => {
    const savedRelease = await tx.contentRelease.upsert({ where: { version: release.releaseVersion }, create: { version: release.releaseVersion, description: `Prepared release ${release.releaseVersion}`, releasedAt: new Date(release.releasedAt), isActive: true }, update: { description: `Prepared release ${release.releaseVersion}` } })
    await tx.contentRelease.updateMany({ where: { id: { not: savedRelease.id } }, data: { isActive: false } })
    for (const story of release.stories) {
      await tx.story.upsert({ where: { id: story.id }, create: { id: story.id, contentReleaseId: savedRelease.id, title: story.title, difficulty: Math.round(story.difficulty * 100) }, update: { contentReleaseId: savedRelease.id, title: story.title, difficulty: Math.round(story.difficulty * 100) } })
      await tx.storySentence.deleteMany({ where: { storyId: story.id } })
      for (const [position, sentence] of story.sentences.entries()) {
        await tx.sentence.upsert({ where: { id: sentence.id }, create: { id: sentence.id, french: sentence.french, english: sentence.english, spokenForm: sentence.spokenForm, difficulty: Math.round(sentence.difficulty * 100), cefrLevel: sentence.cefrLevel, source: sentence.source }, update: { french: sentence.french, english: sentence.english, spokenForm: sentence.spokenForm, difficulty: Math.round(sentence.difficulty * 100), cefrLevel: sentence.cefrLevel, source: sentence.source } })
        await tx.storySentence.create({ data: { storyId: story.id, sentenceId: sentence.id, position } })
      }
    }
  }, { maxWait: 10_000, timeout: 300_000 })
  console.log(`Imported ${release.releaseVersion} (${release.stories.length} stories) idempotently.`)
}

run().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
