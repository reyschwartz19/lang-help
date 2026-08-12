import phraseBankSeed from '@/data/content/phrase-bank.json';
import { db, type PhraseBank } from '@/data/local/database';
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

  await db.transaction('rw', db.phraseBank, db.cards, async () => {
    const existingPhrases = new Map((await db.phraseBank.toArray()).map((phrase) => [phrase.id, phrase]));
    const existingCards = new Map(
      (await db.cards.filter((card) => card.type === 'phrase').toArray()).map((card) => [card.sentenceId, card]),
    );
    const now = new Date();
    const curatedPhrases = phraseBankSeed as Array<Omit<PhraseBank, 'cardId'>>;
    const phraseRows: PhraseBank[] = curatedPhrases.map((phrase) => ({
      ...phrase,
      cardId: existingPhrases.get(phrase.id)?.cardId ?? `${phrase.id}-card`,
    }));

    await db.phraseBank.bulkPut(phraseRows);

    const phraseCards = phraseRows.filter((phrase) => !existingCards.has(phrase.id)).map((phrase) => ({
      id: `${phrase.id}-card`,
      sentenceId: phrase.id,
      type: 'phrase' as const,
      dueDate: new Date(now.getTime() + (phrase.priority === 1 ? 0 : phrase.priority === 2 ? 7 : 21) * 86_400_000),
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      createdAt: now,
    }));

    await db.cards.bulkPut(phraseCards);
  });
}
