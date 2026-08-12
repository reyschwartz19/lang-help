'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Bookmark, Headphones, Volume2, CheckCircle2, Turtle } from 'lucide-react'
import Link from 'next/link'
import { AppShell, ScreenCard } from '@/components/app-shell'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Sentence, Story, ReadingProgress } from '@/data/db'
import { playAudio, stopAudio } from '@/lib/audio'
import { ensureSeeded } from '@/lib/seed'

export default function ReaderPage() {
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [spokenToggles, setSpokenToggles] = useState<Record<string, boolean>>({});

  // Seed for testing if DB is empty
  useEffect(() => {
    ensureSeeded();
  }, []);

  const storyData = useLiveQuery(async () => {
    const progress = await db.readingProgress.filter(p => p.status !== 'mastered').first();
    let story: Story | undefined;
    let progressRec: ReadingProgress | undefined = progress;

    if (progress) {
      story = await db.stories.get(progress.storyId);
    } else {
      // Just grab first story if no progress tracking
      story = await db.stories.toCollection().first();
      if (story) {
        progressRec = {
          storyId: story.id,
          status: 'unread',
          lastSeenAt: new Date(),
          nextResurfaceAt: new Date()
        };
      }
    }

    if (!story) return null;

    const sentences = await db.sentences.where('id').anyOf(story.sentenceIds).toArray();
    // Maintain order
    const orderedSentences = story.sentenceIds.map(id => sentences.find(s => s.id === id)).filter(Boolean) as Sentence[];

    const savedCards = await db.cards.where('type').equals('sentence').toArray();
    const savedSentenceIds = new Set(savedCards.map(c => c.sentenceId));

    return { story, progress: progressRec, sentences: orderedSentences, savedSentenceIds };
  });

  if (!storyData) {
    return (
      <AppShell title="Reading practice" eyebrow="READING · 5 MINUTES">
        <div className="content-grid">
          <p>Loading story...</p>
        </div>
      </AppShell>
    );
  }

  const { story, progress, sentences, savedSentenceIds } = storyData;

  const activeSentence = activeSentenceId ? sentences.find(s => s.id === activeSentenceId) : null;
  const isSaved = activeSentenceId ? savedSentenceIds.has(activeSentenceId) : false;

  const handleSentenceClick = (sentence: Sentence) => {
    setActiveSentenceId(sentence.id);
    playAudio(spokenToggles[sentence.id] && sentence.spokenForm ? sentence.spokenForm : sentence.audioText, 1.0);
  };

  const handleToggleSpoken = (sentenceId: string) => {
    setSpokenToggles(prev => ({ ...prev, [sentenceId]: !prev[sentenceId] }));
  };

  const handleSaveSentence = async () => {
    if (!activeSentenceId) return;
    if (isSaved) {
      // Unsaving? Just for convenience in testing.
      const card = await db.cards.where({ sentenceId: activeSentenceId }).first();
      if (card) await db.cards.delete(card.id);
    } else {
      await db.cards.add({
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
    }
  };

  const handleComplete = async () => {
    if (!progress) return;

    // Story resurfacing logic (read → listen-only → reread schedule)
    const now = new Date();
    let nextStatus = progress.status;
    let nextResurface = new Date(now);

    if (progress.status === 'unread') {
      nextStatus = 'listen_only_due';
      nextResurface.setDate(now.getDate() + 1); // Tomorrow
    } else if (progress.status === 'listen_only_due') {
      nextStatus = 'reread_due';
      nextResurface.setDate(now.getDate() + 3); // In 3 days
    } else if (progress.status === 'reread_due') {
      nextStatus = 'mastered';
    }

    await db.readingProgress.put({
      ...progress,
      status: nextStatus as any,
      lastSeenAt: now,
      nextResurfaceAt: nextResurface
    });

    alert(`Story marked as ${nextStatus}! Resurfacing at ${nextResurface.toLocaleDateString()}`);
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
          </ScreenCard>

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
                    onClick={() => playAudio(spokenToggles[activeSentence.id] && activeSentence.spokenForm ? activeSentence.spokenForm : activeSentence.audioText, 1.0)}
                  >
                    <Volume2 size={18} /> Normal
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl transition-colors font-medium"
                    onClick={() => playAudio(spokenToggles[activeSentence.id] && activeSentence.spokenForm ? activeSentence.spokenForm : activeSentence.audioText, 0.7)}
                  >
                    <Turtle size={18} /> Slow
                  </button>
                </div>

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
