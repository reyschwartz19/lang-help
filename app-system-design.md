# System Design

---

## 1. Architecture Overview

```
                    ┌─────────────────────────────┐
                    │        Browser (PWA)        │
                    │                              │
                    │  React + TypeScript + Vite   │
                    │  Tailwind CSS                │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │   App Modules          │  │
                    │  │  Reader / Review /      │  │
                    │  │  Phrase Bank / Drill /  │  │
                    │  │  Dashboard / Handoff    │  │
                    │  └───────────┬────────────┘  │
                    │              │                │
                    │  ┌───────────▼────────────┐  │
                    │  │   Local Data Layer      │  │
                    │  │   Dexie.js (IndexedDB)  │  │
                    │  └───────────┬────────────┘  │
                    │              │  background sync
                    │              │  when online
                    └──────────────┼────────────────┘
                                   │
                          ┌────────▼─────────┐
                          │     Supabase      │
                          │  Postgres + Auth   │
                          │  (sync layer only) │
                          └────────────────────┘

    Static content bundled at build time (no runtime calls):
    Tatoeba sentences, Lexique frequency data, curated register
    pairs, phrase bank seed data → shipped as JSON/SQLite in the
    app bundle, loaded into Dexie on first run.

    Audio: generated live in-browser via Web Speech API,
    nothing pre-recorded or cached.

    External, manual only: ChatGPT, used outside the app via a
    copy-pasted, app-generated prompt. No network call from the
    app to any AI service, ever.
```

---

## 2. Tech Stack Summary

| Layer | Choice | Why |
|---|---|---|
| UI framework | React + TypeScript | You already know JS/TS, strong PWA tooling support |
| Build tool | Vite | Fast, simple PWA plugin support |
| Styling | Tailwind CSS | Fast to build with, no design system overhead for a single-user app |
| Local storage | Dexie.js (IndexedDB) | Primary data store, works fully offline |
| Sync | Supabase (Postgres) | Thin sync layer only, free tier is plenty for one user |
| Scheduling algorithm | ts-fsrs | Modern, tested spaced-repetition scheduler |
| Audio | Web Speech API | Zero cost, zero storage, generated on demand |
| Recording | MediaRecorder API | Built into every modern browser |
| Hosting | Vercel or Cloudflare Pages | Free tier, auto-deploy from GitHub |
| PWA/offline | vite-plugin-pwa (Workbox under the hood) | Installable, offline-capable |

---

## 3. Data Model

All tables live in Dexie locally; the same shape is mirrored in Supabase for sync.

### `sentences` (static content, shipped with the app, read-only at runtime)
```
id            string (uuid or Tatoeba id)
french        string
english       string
difficulty    number        // derived from Lexique frequency
source        "tatoeba" | "opensubtitles" | "curated"
spokenForm    string | null // informal/contracted version, if one exists
audioText     string        // text passed to Web Speech API (may differ slightly from display text)
```

### `stories` (static content, groups of sentences)
```
id            string
title         string
sentenceIds   string[]      // ordered list of sentence ids
difficulty    number
```

### `cards` (user-generated, the actual review deck)
```
id                string
sentenceId        string        // references sentences.id
type              "sentence" | "phrase"
dueDate           datetime
stability         number        // FSRS state
difficulty        number        // FSRS state
reps              number
lapses            number
lastReviewedAt    datetime | null
createdAt         datetime
```

### `phraseBank` (static seed + user-added)
```
id            string
french        string
english       string
category      "greeting" | "buying_time" | "repair" | "opinion" | ...
cardId        string | null   // linked cards row once it enters review
```

### `readingProgress`
```
storyId           string
status            "unread" | "read" | "listen_only_due" | "reread_due" | "mastered"
lastSeenAt        datetime
nextResurfaceAt    datetime
```

### `speakingSessions`
```
id            string
scenarioId    string
recordingBlob  blob (local only, not synced, too large for free-tier sync at scale)
completedAt   datetime
```

### `userStats` (derived/aggregated, powers the dashboard)
```
wordsKnown         number
phrasesKnown       number
reviewAccuracy     number
listeningMinutes   number
storiesCompleted   number
cefrEstimate       string   // "A2", "B1", etc, computed, not stored as ground truth
```

---

## 4. Key Algorithms

### Difficulty scoring (content leveling)
1. At build time, tokenize each Tatoeba/OpenSubtitles sentence.
2. Look up each word's frequency rank in the Lexique data.
3. Score the sentence by its rarest/least-frequent words (a sentence is only as easy as its hardest word) plus overall length.
4. Bucket into rough CEFR bands (A1, A2, B1) for initial content ordering.
This runs once during content preparation, not live in the app.

### Adaptive difficulty (runtime)
- Track lookup rate per passage (words tapped ÷ total words) and review accuracy over the last ~2 weeks of cards.
- If lookup rate is consistently low and review accuracy is high, shift the served difficulty band up one notch.
- If lookup rate is high or review accuracy drops, hold or shift down.
- Simple moving-average based rule, not a model, keeps it transparent and debuggable.

### Spaced repetition (FSRS)
- Use `ts-fsrs` directly, no custom scheduler.
- Each review submits a grade (again/hard/good/easy), the library returns the next due date and updated stability/difficulty state, stored on the `cards` row.

### Register transformation (spoken vs written)
- A small, hand-curated static lookup table of common formal→informal patterns (ne-dropping, "il y a"→"y a", "tu es"→"t'es", etc.), applied to sentences during content preparation.
- Not AI-generated, this keeps it deterministic and free of any runtime dependency. Expandable manually over time as you notice more patterns worth adding.

### Story resurfacing schedule
- Fixed intervals to start: read → +2 days listen-only → +7 days full reread → +30 days conversation-topic candidate.
- Stored per-story in `readingProgress.nextResurfaceAt`, checked against current date on app load.

### ChatGPT prompt generation
- Pure string templating, no AI call: pulls your CEFR estimate, a chosen/rotating scenario, and your most recently mined phrase-bank/card entries, and fills a fixed template (as shown earlier in this conversation).

---

## 5. Offline & Sync Strategy

- **Source of truth while using the app:** always Dexie/IndexedDB, locally on-device. The app must be fully usable with no network connection.
- **Sync trigger:** on app load and periodically while online, push any local changes since last sync, pull any remote changes since last sync.
- **Conflict handling:** last-write-wins by timestamp. Since this is single-user across two of your own devices, true conflicts should be rare and low-stakes (e.g. a review done offline on both devices before syncing), not worth building operational-transform-level conflict resolution for.
- **What syncs:** `cards`, `readingProgress`, `phraseBank` additions, `userStats`. Recording blobs from the speaking drill stay local-only, to avoid pushing large binary data through the free-tier sync path.
- **Static content** (`sentences`, `stories`) is never synced, it ships with the app bundle and is identical on every device.

---

## 6. Repository / Folder Structure

```
french-app/
├── public/
│   └── manifest.json, icons/            # PWA assets
├── src/
│   ├── modules/
│   │   ├── reader/
│   │   ├── review/
│   │   ├── phrasebank/
│   │   ├── speaking-drill/
│   │   ├── chatgpt-handoff/
│   │   ├── dashboard/
│   │   └── grammar-reference/
│   ├── data/
│   │   ├── db.ts                        # Dexie schema/setup
│   │   ├── sync.ts                      # Supabase sync logic
│   │   ├── fsrs.ts                      # ts-fsrs wrapper
│   │   └── content/                     # bundled static JSON (sentences, stories, phrase bank seed, register table)
│   ├── lib/
│   │   ├── difficulty.ts                # scoring + adaptive logic
│   │   ├── audio.ts                     # Web Speech API wrapper
│   │   └── promptTemplate.ts            # ChatGPT handoff templating
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── prepare-content.ts               # one-time script: ingest Tatoeba/Lexique, score difficulty, tag register pairs, output static JSON into src/data/content/
├── supabase/
│   └── schema.sql                       # mirrors the Dexie schema for sync tables
├── vite.config.ts                       # includes vite-plugin-pwa config
└── package.json
```

---

## 7. Build & Deploy Pipeline

1. Run `scripts/prepare-content.ts` once locally to generate the static content bundle (this is the only "offline batch" step, not part of the live app).
2. Commit the generated JSON into `src/data/content/`.
3. Push to GitHub.
4. Vercel/Cloudflare Pages auto-builds and deploys on push (free tier, connected directly to the repo).
5. Supabase project holds only the sync tables, provisioned once, no ongoing maintenance beyond normal free-tier limits.

No CI/CD complexity beyond "push to main, it deploys," appropriate for a single-user personal app.
