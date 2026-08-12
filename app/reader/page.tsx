'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Bookmark, Headphones, Volume2, CheckCircle2, Turtle } from 'lucide-react'
import Link from 'next/link'
import { AppShell, ScreenCard } from '@/components/layout/app-shell'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Sentence, Story, ReadingProgress } from '@/data/local/database'
import { ensureSeeded } from '@/data/local/seed-database'
import { playAudio, stopAudio } from '@/lib/audio/speech-synthesis'
import { putCardLocally, deleteCardLocally, putReadingProgressLocally } from '@/lib/sync/local-mutations'
import { captureLearnerEvent } from '@/lib/learning/events'
import { cacheAheadContent } from '@/lib/content/cache-content'
import { advanceReadingProgress, isReadingProgressDue } from '@/lib/reader/resurfacing'
import { selectAdaptiveStory, type DifficultySignal } from '@/lib/learning/adaptive-selector'
import { findRepeatedGrammarPatterns } from '@/lib/learning/grammar-patterns'

export default function ReaderPage() {
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [spokenToggles, setSpokenToggles] = useState<Record<string, boolean>>({});
  const [loopingSentenceId, setLoopingSentenceId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rated, setRated] = useState(false);
  const loopRef = useRef<string | null>(null);

  // Seed for testing if DB is empty
  useEffect(() => {
    void ensureSeeded().then(cacheAheadContent).catch(() => setFeedback('Local content could not be opened. Reload the page to try again.'));
    return () => stopAudio();
  }, []);

  const storyData = useLiveQuery(async () => {
    const now = new Date();
    const candidates = (await db.readingProgress.filter(p => p.status !== 'mastered').toArray()).map((item) => ({ ...item, lastSeenAt: new Date(item.lastSeenAt), nextResurfaceAt: new Date(item.nextResurfaceAt) }));
    const stories = await db.stories.toArray();
    const events = await db.learnerEvents.orderBy('occurredAt').reverse().limit(40).toArray();
    const selection = selectAdaptiveStory(stories, candidates.filter((item) => isReadingProgressDue(item, now)), events, now);
    const progress = selection?.progress;
    let story: Story | undefined;
    const progressRec: ReadingProgress | undefined = progress;

    if (progress) {
      story = selection?.story;
    } else {
      return null;
    }

    if (!story) return null;

    const sentences = await db.sentences.where('id').anyOf(story.sentenceIds).toArray();
    // Maintain order
    const orderedSentences = story.sentenceIds.map(id => sentences.find(s => s.id === id)).filter(Boolean) as Sentence[];

    const savedCards = await db.cards.where('type').equals('sentence').toArray();
    const savedSentenceIds = new Set(savedCards.map(c => c.sentenceId));

    return { story, progress: progressRec, sentences: orderedSentences, savedSentenceIds, decision: selection?.decision };
  });

  if (storyData === undefined) {
    return (
      <AppShell title="Reading practice" eyebrow="READING · 5 MINUTES">
        <div className="content-grid">
          <p>Loading story...</p>
        </div>
      </AppShell>
    );
  }

  if (storyData === null) {
    return <AppShell title="Reading practice"><ScreenCard><p className="eyebrow">NOT DUE YET</p><h2 className="mt-2 text-xl font-semibold">Your completed stories are resting.</h2><p className="screen-copy">Return when the next listen-only or reread session is due. Bundled stories remain cached offline.</p>{feedback && <p role="alert" className="mt-3 text-sm text-red-700">{feedback}</p>}</ScreenCard></AppShell>
  }

  const { story, progress, sentences, savedSentenceIds, decision } = storyData;
  const grammarPatterns = findRepeatedGrammarPatterns(sentences);

  const activeSentence = activeSentenceId ? sentences.find(s => s.id === activeSentenceId) : null;
  const isSaved = activeSentenceId ? savedSentenceIds.has(activeSentenceId) : false;

  const speak = async (sentence: Sentence, rate = 1) => {
    const text = spokenToggles[sentence.id] && sentence.spokenForm ? sentence.spokenForm : sentence.audioText;
    setFeedback(null);
    try {
      await playAudio(text, rate);
      const estimatedSeconds = Math.max(1, Math.round(text.trim().split(/\s+/).length / (2.5 * rate)));
      await captureLearnerEvent('audio_played', { entityId: sentence.id, durationSeconds: estimatedSeconds });
      if (loopRef.current === sentence.id) await speak(sentence, rate);
    } catch (reason) { setLoopingSentenceId(null); setFeedback(reason instanceof Error ? reason.message : 'Audio playback failed.'); }
  };

  const handleSentenceClick = (sentence: Sentence) => {
    setActiveSentenceId(sentence.id);
    void captureLearnerEvent('definition_viewed', { entityId: sentence.id, metadata: { target: sentence.targetText ?? 'sentence' } });
    void speak(sentence);
  };

  const reportDifficulty = async (rating: DifficultySignal) => {
    await captureLearnerEvent('passage_difficulty', { entityId: story.id, metadata: { rating, difficulty: story.difficulty } });
    setRated(true);
  };

  const handleToggleSpoken = (sentenceId: string) => {
    setSpokenToggles(prev => ({ ...prev, [sentenceId]: !prev[sentenceId] }));
  };

  const handleSaveSentence = async () => {
    if (!activeSentenceId) return;
    if (isSaved) {
      // Unsaving? Just for convenience in testing.
      const card = await db.cards.where({ sentenceId: activeSentenceId }).first();
      if (card) await deleteCardLocally(card.id);
    } else {
      await putCardLocally({
        id: crypto.randomUUID(),
        sentenceId: activeSentenceId,
        type: 'sentence',
        dueDate: new Date(),
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReviewedAt: null,
        createdAt: new Date()
      });
      await captureLearnerEvent('sentence_mined', { entityId: activeSentenceId });
    }
  };

  const handleComplete = async () => {
    if (!progress) return;

    const now = new Date();
    const updated = advanceReadingProgress(progress, now);
    await putReadingProgressLocally(updated);

    await captureLearnerEvent('story_completed', { entityId: story.id, metadata: { phase: progress.status } });
    setFeedback(updated.status === 'mastered' ? 'Story cycle completed.' : `Session saved. This story will resurface ${updated.nextResurfaceAt.toLocaleDateString()}.`);
  };

  return (
    <AppShell title="Reading practice" eyebrow={`READING · ${progress?.status === 'listen_only_due' ? 'LISTEN ONLY' : 'READING'}`}>
      <div className="content-grid">
        <div className="main-column">
          <ScreenCard className="reader-card">
            <div className="reading-label">
              <Headphones size={16} /> {progress?.status === 'listen_only_due' ? 'LISTEN-ONLY MODE' : 'A SHORT STORY'}
            </div>
            <h2>{story.title}</h2>
            <p className="reader-meta">Difficulty {story.difficulty.toFixed(1)} · Everyday life</p>
            <p className="mt-2 text-xs text-slate-500" title={decision?.reason}>{decision?.reason}</p>

            <div className="reader-text flex flex-col gap-4 mt-6">
              {sentences.map(sentence => {
                const isActive = sentence.id === activeSentenceId;
                const showSpoken = spokenToggles[sentence.id];
                const displayText = showSpoken && sentence.spokenForm ? sentence.spokenForm : sentence.french;

                return (
                  <div key={sentence.id} className="relative group">
                    <p
                      className={`cursor-pointer transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-slate-800 hover:text-blue-500'}`}
                      onClick={() => handleSentenceClick(sentence)}
                    >
                      {progress?.status === 'listen_only_due' && !isActive ? '...' : displayText}
                    </p>

                    {sentence.spokenForm && isActive && (
                      <div className="mt-2 mb-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                        <span className="text-sm text-slate-500">Spoken form available</span>
                        <button
                          className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50 transition-colors font-medium text-slate-700"
                          onClick={(e) => { e.stopPropagation(); handleToggleSpoken(sentence.id); }}
                        >
                          {showSpoken ? 'Show formal' : 'Show spoken'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="reader-actions mt-8 pt-6 border-t border-slate-100 flex justify-between">
              <button className="primary-button bg-emerald-500 hover:bg-emerald-600 w-full justify-center" onClick={handleComplete}>
                <CheckCircle2 size={18} /> Complete Session
              </button>
            </div>
            {feedback && <p role="status" className="mt-3 text-center text-sm text-slate-600">{feedback}</p>}
            <fieldset className="mt-5 border-0 text-center" disabled={rated}><legend className="mb-2 w-full text-sm font-semibold">How did this passage feel?</legend><div className="flex flex-wrap justify-center gap-2">{(['too_easy', 'just_right', 'too_hard'] as const).map((value) => <button type="button" className="pill-button" key={value} onClick={() => void reportDifficulty(value)}>{value === 'too_easy' ? 'Too easy' : value === 'just_right' ? 'Just right' : 'Too hard'}</button>)}</div>{rated && <p role="status" className="mt-2 text-xs text-slate-500">Difficulty saved for future selections.</p>}</fieldset>
          </ScreenCard>

          {grammarPatterns.length > 0 && <ScreenCard><p className="eyebrow">PATTERNS IN THIS PASSAGE</p>{grammarPatterns.map((pattern) => <details className="mt-3 rounded-xl border border-slate-200 p-3" key={pattern.id}><summary className="cursor-pointer font-semibold">{pattern.title}</summary><p className="mt-2 text-sm text-slate-600">{pattern.summary}</p></details>)}</ScreenCard>}

          <Link href="/" className="text-button mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft size={15} /> Back home
          </Link>
        </div>

        <aside className="right-column">
          <ScreenCard>
            <p className="eyebrow">VOCABULARY</p>
            {activeSentence ? (
              <div className="mt-2 flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Sentence Translation</h3>
                <div className="p-4 bg-blue-50 text-blue-900 rounded-xl">
                  {activeSentence.english}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl transition-colors font-medium"
                    onClick={() => void speak(activeSentence, 1)}
                  >
                    <Volume2 size={18} /> Normal
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl transition-colors font-medium"
                    onClick={() => void speak(activeSentence, 0.7)}
                  >
                    <Turtle size={18} /> Slow
                  </button>
                </div>

                {activeSentence.definition && <div className="rounded-xl border border-slate-200 p-3"><p className="eyebrow">TARGET MEANING</p><strong>{activeSentence.targetText}</strong><p className="text-sm text-slate-600">{activeSentence.definition}</p></div>}

                <button className="secondary-button full" onClick={() => { if (loopRef.current) { loopRef.current = null; setLoopingSentenceId(null); stopAudio(); } else { loopRef.current = activeSentence.id; setLoopingSentenceId(activeSentence.id); void speak(activeSentence); } }}>{loopingSentenceId === activeSentence.id ? 'Stop sentence loop' : 'Loop this sentence'}</button>

                <button
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors border ${isSaved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  onClick={handleSaveSentence}
                >
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved to Review' : 'Save as Flashcard'}
                </button>
              </div>
            ) : (
              <div className="mt-4 text-slate-500 text-center py-8">
                <p>Tap any sentence to see its translation and hear it pronounced.</p>
              </div>
            )}
          </ScreenCard>
        </aside>
      </div>
    </AppShell>
  )
}
