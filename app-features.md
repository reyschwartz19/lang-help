# Feature Breakdown

Everything the app does, grouped by module. No version gating, this is the full build.

---

## Module 1: Reader (comprehensible input)

**What it does:** Serves a short French passage (a few sentences to a short story) at your current level, with audio.

- Displays French text with an audio player per sentence
- Two playback speeds: normal and slowed
- Sentence-by-sentence loop mode, so you can replay one line repeatedly
- Tap any word or phrase to see its meaning instantly (looked up from the Tatoeba/Lexique data, not a live dictionary API)
- Tapping a word/phrase saves it as a full sentence card into your review deck (not the isolated word)
- Each passage shows a "spoken version" toggle next to the standard written sentence where a common contraction applies (e.g. "je ne sais pas" alongside "chais pas"), so you learn to recognize both forms
- Passages you've already read resurface automatically after a few days (listen-only), then again after a couple of weeks (full read), instead of disappearing after one pass

**Why:** This is the core comprehensible-input engine, the single biggest lever from the research for both vocabulary acquisition and listening comprehension.

---

## Module 2: Review (spaced repetition)

**What it does:** A short daily review queue of sentence cards you've mined, scheduled by FSRS.

- Audio-first cards: hear the sentence with the target word/phrase silenced, try to say it out loud before revealing
- Reveal shows full sentence, translation, and audio
- Self-grade (again / hard / good / easy) drives the next review interval via FSRS
- Cards are always full sentences, never isolated words

**Why:** Active recall plus spaced repetition is the best-supported memory technique in the research, and sentence-level cards retain grammar and context that word lists lose.

---

## Module 3: Phrase Bank

**What it does:** A separate, smaller deck of high-frequency conversational chunks, not vocabulary, things like fillers, repair phrases, and opinion starters.

- Organized by category: greetings, buying time, repairing conversation, giving opinion
- Reviewed the same way as sentence cards (FSRS, audio-first)
- Populated with a starter set you seed once, plus anything similar you mine from readings

**Why:** These reflexive chunks are what make speech feel automatic rather than assembled word-by-word, and they're exactly what's missing from vocabulary-only apps.

---

## Module 4: Speaking Drill (scenario practice)

**What it does:** A short, timed speaking exercise using a real-world scenario.

- App shows/plays a situational prompt ("You're at a bakery, ask for two baguettes and ask if card payment is accepted")
- Short countdown, then you record your spoken response via the browser microphone
- Playback shows your recording next to a reference response, so you can self-compare
- No AI grading, this is intentionally self-assessed

**Why:** Rehearsing production under light time pressure targets the specific anxiety/hesitation gap between knowing French and being able to produce it live, without needing any AI evaluation.

---

## Module 5: ChatGPT Handoff (external conversation practice)

**What it does:** Generates a ready-to-paste prompt for a real conversation practice session in ChatGPT.

- Pulls in: your current CEFR estimate, a scenario category (rotates or pick manually), and a list of phrases/words you've mined recently
- One-tap "copy prompt" button
- You paste it into ChatGPT (or any AI chat) yourself, entirely outside the app, no API key, no cost

**Why:** This gets you real, adaptive AI conversation practice, the one thing static content genuinely can't provide, without building or paying for any AI integration into the app itself.

---

## Module 6: Difficulty & Content Engine

**What it does:** Decides what content you see next.

- Estimates each Tatoeba/OpenSubtitles sentence's difficulty from Lexique word-frequency data
- Tracks your personal signals: how often you look up words in a passage, your review accuracy, self-reported difficulty
- Adjusts which difficulty band of content gets served next, automatically, no manual level selection needed after initial setup

**Why:** Keeps content in the i+1 "comprehensible but stretching" zone the research points to, without you having to guess your own level.

---

## Module 7: Progress Dashboard

**What it does:** A simple, honest view of where you stand.

- Words/phrases known (cards past a retention threshold)
- Review accuracy over time
- Stories/passages completed
- Listening minutes
- Speaking drill sessions completed
- Rough CEFR estimate, derived from the above, not a guess

**Why:** Visible, honest progress tracking is tied in the research to better self-directed learning outcomes, and it's the thing that keeps a solo project motivating without fake gamification.

---

## Module 8: Grammar Reference (static, not AI)

**What it does:** A small, curated reference of common patterns (verb conjugation groups, key tenses, pronoun placement), surfaced inline when a pattern repeats often enough in what you're reading to be worth naming.

- No live explanations, no AI, just a small static lookup table you build once
- Deliberately minimal, this is support material, not the primary learning method

**Why:** Grammar taught in isolation showed minimal impact on fluency in the research, this exists only as lightweight backup, not a core module.

---

## Module 9: Sync

**What it does:** Keeps your progress consistent across phone and desktop.

- All data lives locally first (Dexie/IndexedDB) so the app works fully offline
- A thin background sync pushes/pulls changes to Supabase whenever you're online
- Single-user, so conflict resolution is simple: last write wins by timestamp

**Why:** You use both devices regularly, this is required, but it stays in the background and never blocks the core loop from working offline.
