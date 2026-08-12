import phraseBankSeed from '@/data/content/phrase-bank.json';
import { db } from '@/data/local/database';

export async function ensureSeeded() {
  const hasSeedData = (await db.sentences.count()) > 0 && (await db.phraseBank.count()) > 0;
  if (hasSeedData) return;

  const sentences = [
    {
      id: 's1',
      french: "Je ne sais pas ce que c'est.",
      english: "I don't know what it is.",
      difficulty: 1,
      cefrLevel: 'A1' as const,
      source: 'curated' as const,
      spokenForm: "Chais pas c'que c'est.",
      audioText: "Je ne sais pas ce que c'est.",
    },
    {
      id: 's2',
      french: "Nous allons au cinéma ce soir.",
      english: "We are going to the movies tonight.",
      difficulty: 1,
      cefrLevel: 'A1' as const,
      source: 'curated' as const,
      spokenForm: "On va au cinéma ce soir.",
      audioText: "Nous allons au cinéma ce soir.",
    },
    {
      id: 's3',
      french: "Il n'y a pas de problème.",
      english: "There is no problem.",
      difficulty: 1.2,
      cefrLevel: 'A1' as const,
      source: 'curated' as const,
      spokenForm: "Y a pas de problème.",
      audioText: "Il n'y a pas de problème.",
    },
  ];

  await db.sentences.bulkPut(sentences);

  await db.stories.put({
    id: 'story1',
    title: 'Une petite conversation',
    sentenceIds: ['s1', 's2', 's3'],
    difficulty: 1.1,
  });

  await db.readingProgress.put({
    storyId: 'story1',
    status: 'unread',
    lastSeenAt: new Date(),
    nextResurfaceAt: new Date(),
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
