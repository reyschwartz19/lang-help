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
  targetText?: string;
  definition?: string;
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
  level: 'A1' | 'A2';
  priority: 1 | 2 | 3;
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

export interface SyncMetadata { key: string; value: string }

export interface ContentCacheMetadata {
  key: string;
  releaseVersion: string;
  fetchedAt: Date;
  source: 'bundled' | 'remote';
}

export type LearnerRecordType = 'CARD' | 'PHRASE' | 'READING_PROGRESS' | 'USER_STATS' | 'LEARNER_EVENT';

export interface SyncOutboxItem {
  mutationId: string;
  recordType: LearnerRecordType;
  recordId: string;
  payload: Record<string, unknown> | null;
  deleted: boolean;
  baseCursor: string;
  createdAt: Date;
  attempts: number;
  nextAttemptAt: Date;
}

export type LearnerEventType = 'story_completed' | 'sentence_mined' | 'review_graded' | 'speech_completed' | 'audio_played' | 'definition_viewed' | 'passage_difficulty';

export interface LearnerEvent {
  id: string;
  type: LearnerEventType;
  occurredAt: Date;
  entityId: string | null;
  durationSeconds: number | null;
  grade: 'again' | 'hard' | 'good' | 'easy' | null;
  metadata: Record<string, string | number | boolean>;
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
  syncMetadata: EntityTable<SyncMetadata, 'key'>;
  contentCacheMetadata: EntityTable<ContentCacheMetadata, 'key'>;
  syncOutbox: EntityTable<SyncOutboxItem, 'mutationId'>;
  learnerEvents: EntityTable<LearnerEvent, 'id'>;
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

db.version(2).stores({
  sentences: 'id, difficulty, cefrLevel, source', stories: 'id, difficulty', cards: 'id, sentenceId, type, dueDate',
  phraseBank: 'id, category, cardId', readingProgress: 'storyId, status, nextResurfaceAt',
  speakingSessions: 'id, scenarioId, completedAt', userStats: 'id', syncMetadata: 'key',
});

db.version(3).stores({
  sentences: 'id, difficulty, cefrLevel, source', stories: 'id, difficulty', cards: 'id, sentenceId, type, dueDate',
  phraseBank: 'id, category, cardId', readingProgress: 'storyId, status, nextResurfaceAt',
  speakingSessions: 'id, scenarioId, completedAt', userStats: 'id', syncMetadata: 'key',
  contentCacheMetadata: 'key, releaseVersion, fetchedAt, source',
  syncOutbox: 'mutationId, recordType, recordId, createdAt, nextAttemptAt',
  learnerEvents: 'id, type, occurredAt, entityId',
});

db.version(4).stores({
  sentences: 'id, difficulty, cefrLevel, source', stories: 'id, difficulty', cards: 'id, sentenceId, type, dueDate',
  phraseBank: 'id, category, level, priority, cardId', readingProgress: 'storyId, status, nextResurfaceAt',
  speakingSessions: 'id, scenarioId, completedAt', userStats: 'id', syncMetadata: 'key',
  contentCacheMetadata: 'key, releaseVersion, fetchedAt, source',
  syncOutbox: 'mutationId, recordType, recordId, createdAt, nextAttemptAt',
  learnerEvents: 'id, type, occurredAt, entityId',
});

export { db };
