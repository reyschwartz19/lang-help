import Dexie, { type EntityTable } from 'dexie';

// ---------------------------------------------------------------------------
// Data model — matches app-system-design.md § 3
// ---------------------------------------------------------------------------

export interface Sentence {
  id: string;
  french: string;
  english: string;
  difficulty: number;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  source: 'tatoeba' | 'opensubtitles' | 'curated';
  spokenForm: string | null;
  audioText: string;
}

export interface Story {
  id: string;
  title: string;
  sentenceIds: string[];
  difficulty: number;
}

export interface Card {
  id: string;
  sentenceId: string;
  type: 'sentence' | 'phrase';
  dueDate: Date;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  lastReviewedAt: Date | null;
  createdAt: Date;
}

export interface PhraseBank {
  id: string;
  french: string;
  english: string;
  category: 'greeting' | 'buying_time' | 'repair' | 'opinion' | string;
  cardId: string | null;
}

export interface ReadingProgress {
  storyId: string;
  status: 'unread' | 'read' | 'listen_only_due' | 'reread_due' | 'mastered';
  lastSeenAt: Date;
  nextResurfaceAt: Date;
}

export interface SpeakingSession {
  id: string;
  scenarioId: string;
  promptText: string;
  recordingBlob: Blob;
  selfRating?: 'great' | 'good' | 'needs-work';
  completedAt: Date;
}

export interface UserStats {
  id: string; // singleton row, always "current"
  wordsKnown: number;
  phrasesKnown: number;
  reviewAccuracy: number;
  listeningMinutes: number;
  storiesCompleted: number;
  cefrEstimate: string;
}

// ---------------------------------------------------------------------------
// Database class
// ---------------------------------------------------------------------------

const db = new Dexie('parlez') as Dexie & {
  sentences: EntityTable<Sentence, 'id'>;
  stories: EntityTable<Story, 'id'>;
  cards: EntityTable<Card, 'id'>;
  phraseBank: EntityTable<PhraseBank, 'id'>;
  readingProgress: EntityTable<ReadingProgress, 'storyId'>;
  speakingSessions: EntityTable<SpeakingSession, 'id'>;
  userStats: EntityTable<UserStats, 'id'>;
};

db.version(1).stores({
  sentences: 'id, difficulty, cefrLevel, source',
  stories: 'id, difficulty',
  cards: 'id, sentenceId, type, dueDate',
  phraseBank: 'id, category, cardId',
  readingProgress: 'storyId, status, nextResurfaceAt',
  speakingSessions: 'id, scenarioId, completedAt',
  userStats: 'id',
});

export { db };
