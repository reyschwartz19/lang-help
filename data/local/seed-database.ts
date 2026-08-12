import phraseBankSeed from '@/data/content/phrase-bank.json';
import { db } from '@/data/local/database';
import { bundledContentRelease } from '@/lib/content/content-release';

export async function ensureSeeded() {
  await db.transaction('rw', db.sentences, db.stories, db.readingProgress, db.contentCacheMetadata, async () => {
    for (const story of bundledContentRelease.stories) {
      await db.sentences.bulkPut(story.sentences);
      await db.stories.put({ id: story.id, title: story.title, difficulty: story.difficulty, sentenceIds: story.sentences.map((sentence) => sentence.id) });
      const existing = await db.readingProgress.get(story.id);
      if (!existing) await db.readingProgress.put({ storyId: story.id, status: 'unread', lastSeenAt: new Date(0), nextResurfaceAt: new Date(0) });
    }
    await db.contentCacheMetadata.put({ key: 'active-release', releaseVersion: bundledContentRelease.releaseVersion, fetchedAt: new Date(), source: 'bundled' });
  });

  const existingPhraseBank = await db.phraseBank.count();
  const phraseCardCount = await db.cards.filter((card) => card.type === 'phrase').count();

  if (existingPhraseBank === 0 || phraseCardCount === 0) {
    const phraseRows = existingPhraseBank === 0 ? phraseBankSeed.map((phrase) => ({ ...phrase, cardId: null })) : await db.phraseBank.toArray();

    if (existingPhraseBank === 0) {
      await db.phraseBank.bulkPut(phraseRows);
    }

    const phraseCards = phraseRows.map((phrase) => ({
      id: `${phrase.id}-card`,
      sentenceId: phrase.id,
      type: 'phrase' as const,
      dueDate: new Date(),
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      createdAt: new Date(),
    }));

    await db.cards.bulkPut(phraseCards);

    await Promise.all(
      phraseCards.map(async (card) => {
        const phrase = phraseRows.find((entry) => entry.id === card.sentenceId);
        if (!phrase) return;

        await db.phraseBank.update(phrase.id, { cardId: card.id });
      })
    );
  }
}
